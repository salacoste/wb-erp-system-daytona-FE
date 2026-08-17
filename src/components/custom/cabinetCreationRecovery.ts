export const TOKEN_RECOVERY_PHASE = 'token-recovery-blocked' as const
export const CREATE_PENDING_PHASE = 'create-pending' as const
export const UPDATE_PENDING_PHASE = 'update-pending' as const
export const POST_CREATE_MARGIN_PHASE = 'post-create-margin-recovery' as const
export const UPDATE_RECOVERY_PHASE = 'update-recovery' as const

export type RecoveryPhase =
  | typeof TOKEN_RECOVERY_PHASE
  | typeof CREATE_PENDING_PHASE
  | typeof UPDATE_PENDING_PHASE
  | typeof POST_CREATE_MARGIN_PHASE
  | typeof UPDATE_RECOVERY_PHASE

export type RecoveryMarker = {
  version: 2
  userId: string
  operationId: string
  phase: RecoveryPhase
}

export type RecoveryRead =
  { kind: 'absent' | 'indeterminate' } | { kind: 'present'; marker: RecoveryMarker }

export type CasResult = 'applied' | 'mismatch' | 'indeterminate'

const KEY_PREFIX = 'cabinet-creation:recovery:v2:'
export const RECOVERY_MARKER_EVENT = 'cabinet-creation:recovery-marker-change'
const inMemoryRecovery = new Map<string, { marker: RecoveryMarker; durable: boolean }>()
const uncertainCabinets = new Map<string, string>()
const activeOperationIds = new Set<string>()

export const recoveryMarkerKey = (userId: string) => `${KEY_PREFIX}${encodeURIComponent(userId)}`

const isRecoveryMarker = (value: unknown, userId: string): value is RecoveryMarker => {
  if (!value || typeof value !== 'object') return false
  const marker = value as Partial<RecoveryMarker>
  return (
    Object.keys(value).length === 4 &&
    ['operationId', 'phase', 'userId', 'version'].every(key => Object.hasOwn(value, key)) &&
    marker.version === 2 &&
    marker.userId === userId &&
    typeof marker.operationId === 'string' &&
    marker.operationId.length > 0 &&
    [
      TOKEN_RECOVERY_PHASE,
      CREATE_PENDING_PHASE,
      UPDATE_PENDING_PHASE,
      POST_CREATE_MARGIN_PHASE,
      UPDATE_RECOVERY_PHASE,
    ].includes(marker.phase as RecoveryPhase)
  )
}

const sameOperation = (left: RecoveryMarker, right: RecoveryMarker) =>
  left.userId === right.userId &&
  left.operationId === right.operationId &&
  left.phase === right.phase

const notifyRecoveryChange = (userId: string, reconcile = false) => {
  window.dispatchEvent(new CustomEvent(RECOVERY_MARKER_EVENT, { detail: { userId, reconcile } }))
}

export function readRecoveryMarker(userId: string): RecoveryRead {
  try {
    const stored = sessionStorage.getItem(recoveryMarkerKey(userId))
    if (stored === null) {
      const memory = inMemoryRecovery.get(userId)
      if (memory && !memory.durable) return { kind: 'present', marker: memory.marker }
      inMemoryRecovery.delete(userId)
      uncertainCabinets.delete(userId)
      return { kind: 'absent' }
    }
    const marker: unknown = JSON.parse(stored)
    if (!isRecoveryMarker(marker, userId)) return { kind: 'indeterminate' }
    inMemoryRecovery.set(userId, { marker, durable: true })
    return { kind: 'present', marker }
  } catch {
    return { kind: 'indeterminate' }
  }
}

function persistMarker(marker: RecoveryMarker, cabinetId?: string): boolean {
  const serialized = JSON.stringify(marker)
  inMemoryRecovery.set(marker.userId, { marker, durable: false })
  if (cabinetId) uncertainCabinets.set(marker.userId, cabinetId)
  try {
    const key = recoveryMarkerKey(marker.userId)
    sessionStorage.setItem(key, serialized)
    if (sessionStorage.getItem(key) !== serialized) return false
    inMemoryRecovery.set(marker.userId, { marker, durable: true })
    notifyRecoveryChange(marker.userId)
    return true
  } catch {
    notifyRecoveryChange(marker.userId)
    return false
  }
}

export function admitRecoveryOperation(
  userId: string,
  phase: typeof CREATE_PENDING_PHASE | typeof UPDATE_PENDING_PHASE
): RecoveryMarker | null {
  if (readRecoveryMarker(userId).kind !== 'absent') return null
  const randomUUID = globalThis.crypto?.randomUUID
  if (typeof randomUUID !== 'function') return null
  let operationId: string
  try {
    operationId = randomUUID.call(globalThis.crypto)
  } catch {
    return null
  }
  const marker: RecoveryMarker = {
    version: 2,
    userId,
    operationId,
    phase,
  }
  if (!persistMarker(marker)) return null
  activeOperationIds.add(marker.operationId)
  return marker
}

export function transitionRecoveryMarker(
  expected: RecoveryMarker,
  phase: RecoveryPhase,
  cabinetId?: string
): CasResult {
  const read = readRecoveryMarker(expected.userId)
  if (read.kind === 'indeterminate') return 'indeterminate'
  if (read.kind !== 'present' || !sameOperation(read.marker, expected)) return 'mismatch'
  const next = { ...expected, phase }
  return persistMarker(next, cabinetId) ? 'applied' : 'indeterminate'
}

export function resumeRecoveryOperation(
  expected: RecoveryMarker,
  phase: typeof UPDATE_PENDING_PHASE
): RecoveryMarker | null {
  if (transitionRecoveryMarker(expected, phase) !== 'applied') return null
  const resumed = { ...expected, phase }
  activeOperationIds.add(resumed.operationId)
  return resumed
}

export function clearRecoveryMarker(expected: RecoveryMarker, reconcile = false): CasResult {
  const read = readRecoveryMarker(expected.userId)
  if (read.kind === 'indeterminate') return 'indeterminate'
  if (read.kind !== 'present' || !sameOperation(read.marker, expected)) return 'mismatch'
  try {
    const key = recoveryMarkerKey(expected.userId)
    sessionStorage.removeItem(key)
    if (sessionStorage.getItem(key) !== null) return 'indeterminate'
    inMemoryRecovery.delete(expected.userId)
    uncertainCabinets.delete(expected.userId)
    notifyRecoveryChange(expected.userId, reconcile)
    return 'applied'
  } catch {
    return 'indeterminate'
  }
}

export const finishRecoveryOperation = (marker: RecoveryMarker) => {
  activeOperationIds.delete(marker.operationId)
}

export const isRecoveryOperationActive = (marker: RecoveryMarker) =>
  activeOperationIds.has(marker.operationId)

export const markerAllowsUpdate = (marker: RecoveryMarker, activeCabinetId: string | null) =>
  Boolean(activeCabinetId) &&
  (marker.phase === POST_CREATE_MARGIN_PHASE || marker.phase === UPDATE_RECOVERY_PHASE)

export const markerBlocksCreate = (marker: RecoveryMarker, activeCabinetId: string | null) =>
  !activeCabinetId || uncertainCabinets.get(marker.userId) === activeCabinetId
