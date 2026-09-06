/**
 * FE-D5: cross-tab cabinet-create mutual exclusion (Web Locks API + claim).
 *
 * A user with two tabs could double-POST /v1/cabinets (two Idempotency-Keys →
 * two multi-tenant cabinets). Same-tab submission is triple-guarded elsewhere;
 * the CROSS-TAB hole is closed here by serializing the create behind a
 * `navigator.locks` lock AND wrapping a shared-state re-check, because a lock
 * alone would only serialize (tab B would still POST after tab A releases).
 *
 * BE contract (cabinet_creation_operations, durable — no TTL): the SAME
 * Idempotency-Key replays the canonical result, so a crashed tab's claim key
 * is REUSED on takeover (within CLAIM_REPLAY_WINDOW_MS) to replay, never
 * duplicate. Claim storage is localStorage (cross-tab); the sessionStorage
 * RecoveryMarker saga (components/custom/cabinetCreationRecovery.ts) stays
 * authoritative for phases — the claim holds ONLY mutual exclusion + the key.
 *
 * KNOWN LIMITATION (no Web Locks): on the fallback path a simultaneous
 * absent-absent read race (~µs window) can still double-create. Narrowed by
 * the pre-adoption re-read below; fully closed only where navigator.locks
 * exists. Old browsers MUST still be able to create — never fail-close the
 * fallback for missing Web Locks support.
 */

import { logger } from '@/lib/logger'
import { STORAGE_KEY } from '@/stores/authStoreHelpers'
import { useAuthStore } from '@/stores/authStore'

/** In-flight claim considered crashed after this long; takeover allowed. */
export const CLAIM_TTL_MS = 90_000
/** Takeover within this window reuses the dead tab's Idempotency-Key (BE replay). */
export const CLAIM_REPLAY_WINDOW_MS = CLAIM_TTL_MS * 2
const ANON_SCOPE = '_anon'

export const CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE =
  'Операция создания кабинета уже выполняется в другой вкладке. Не отправляйте форму повторно — обновите страницу, чтобы проверить состояние.'
export const CABINET_CREATE_SETTLED_BLOCK_MESSAGE =
  'Кабинет уже создан в другой вкладке. Обновите страницу, чтобы продолжить работу с ним.'
// N2 (review pass 2): CANONICAL single source — cabinetCreationSubmission.ts
// re-exports this constant as TOKEN_RECOVERY_MESSAGE; the texts must never
// drift apart again.
export const CABINET_CREATE_TOMBSTONE_BLOCK_MESSAGE =
  'Кабинет уже создан, но не удалось обновить авторизацию. Не создавайте его повторно. Выйдите из аккаунта и войдите снова: требуется безопасная повторная авторизация и сверка кабинета с сервером.'
export const CABINET_CREATE_UNAVAILABLE_BLOCK_MESSAGE =
  'Не удалось безопасно начать операцию создания кабинета. Обновите страницу и попробуйте ещё раз.'

/** Minimal structural view of LockManager — avoids leaking DOM `any` returns. */
export type ExclusiveLockManager = {
  request<R>(name: string, callback: () => Promise<R>): Promise<R>
}

export type CabinetCreateClaim = {
  v: 1
  claimId: string
  acquiredAt: number
  idempotencyKey: string
  // 'failed-ambiguous' (wave 4): pre-POST wire-ambiguous rejection (0/5xx) —
  // adoptable IMMEDIATELY (key reuse ⇒ BE replay makes the retry safe), not a
  // tombstone: preserves deliberate-retry recovery (CABINET-BROWSER-02).
  phase: 'in-flight' | 'settled-uncertain' | 'failed-ambiguous'
}

export type CreateRunnerOutcome<T> = { ok: true; value: T } | { ok: false; error: unknown }
// F6: runner failures travel as a RESULT (`error`) so a LockManager request
// rejection (browser quirk) can never be confused with them.
export type ExclusiveOutcome<T> =
  | { kind: 'ran'; value: T }
  | { kind: 'blocked'; message: string }
  | { kind: 'error'; error: unknown }

export type CabinetCreateLockOptions = {
  lockManager?: ExclusiveLockManager | null
  storage?: Storage
  now?: () => number
}

export const cabinetCreateClaimKey = (userId: string | null) =>
  `wb:cabinet-creation:claim:v1:${userId ?? ANON_SCOPE}`
export const cabinetCreateLockName = (userId: string | null) =>
  `wb:cabinet-creation:v1:${userId ?? ANON_SCOPE}`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isCabinetCreateClaim = (value: unknown): value is CabinetCreateClaim => {
  if (!isRecord(value) || value.v !== 1) return false
  if (typeof value.claimId !== 'string' || value.claimId.length === 0) return false
  if (typeof value.acquiredAt !== 'number' || !Number.isFinite(value.acquiredAt)) return false
  if (typeof value.idempotencyKey !== 'string' || value.idempotencyKey.length === 0) return false
  return (
    typeof value.phase === 'string' &&
    ['in-flight', 'settled-uncertain', 'failed-ambiguous'].includes(value.phase)
  )
}

type ClaimState =
  | { kind: 'absent' }
  | { kind: 'tombstone'; claim: CabinetCreateClaim }
  | { kind: 'in-flight-fresh'; claim: CabinetCreateClaim }
  | { kind: 'in-flight-stale'; claim: CabinetCreateClaim }
  | { kind: 'expired' }

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    // Malformed content cannot come from a POSTed-then-crashed tab (the claim
    // is written BEFORE the create) — corruption self-heals as `expired`.
    return null
  }
}

const classifyClaim = (storage: Storage, key: string, nowMs: number): ClaimState => {
  // A detached storage MAY throw here; the throw propagates as a plain create
  // failure (retry stays legal) instead of a silent cross-tab bypass.
  const raw = storage.getItem(key)
  if (raw === null) return { kind: 'absent' }
  const parsed = parseJson(raw)
  if (!isCabinetCreateClaim(parsed)) return { kind: 'expired' }
  if (parsed.phase === 'settled-uncertain') return { kind: 'tombstone', claim: parsed }
  // Wave 4: a wire-ambiguous failure is adoptable IMMEDIATELY — no TTL wait.
  // Reuses the stored key ⇒ BE replay collapses any landed ghost POST; past
  // the replay window a fresh key is minted (as for an expired claim).
  if (parsed.phase === 'failed-ambiguous')
    return nowMs - parsed.acquiredAt > CLAIM_REPLAY_WINDOW_MS
      ? { kind: 'expired' }
      : { kind: 'in-flight-stale', claim: parsed }
  const age = nowMs - parsed.acquiredAt
  if (age < CLAIM_TTL_MS) return { kind: 'in-flight-fresh', claim: parsed }
  if (age <= CLAIM_REPLAY_WINDOW_MS) return { kind: 'in-flight-stale', claim: parsed }
  return { kind: 'expired' }
}

const finalizeClaim = (
  key: string,
  claim: CabinetCreateClaim,
  storage: Storage,
  disposition: 'clean' | 'ambiguous' | 'uncertain'
): void => {
  try {
    if (storage.getItem(key) !== JSON.stringify(claim)) return
    if (disposition === 'clean') return storage.removeItem(key)
    const phase = disposition === 'uncertain' ? 'settled-uncertain' : 'failed-ambiguous'
    storage.setItem(key, JSON.stringify({ ...claim, phase }))
  } catch {
    // Best-effort; a stranded claim self-heals via TTL (non-tombstone only).
  }
}

/**
 * The persisted auth blob is written SYNCHRONOUSLY by the settling tab (zustand
 * persist) BEFORE it removes the claim and releases the lock — reading it
 * directly makes the shared re-check independent of storage-EVENT delivery
 * timing (authStore's listener is the async path).
 */
const readPersistedCabinetId = (storage: Storage): string | null => {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return null
  const parsed = parseJson(raw)
  if (!isRecord(parsed) || !isRecord(parsed.state)) return null
  const cabinetId = parsed.state.cabinetId
  return typeof cabinetId === 'string' && cabinetId.length > 0 ? cabinetId : null
}

const detectLockManager = (): ExclusiveLockManager | null =>
  typeof navigator === 'undefined' || !('locks' in navigator) ? null : navigator.locks

/** Caller-visible outcomes: `error` is rethrown verbatim, never returned. */
export type ResolvedExclusiveOutcome<T> = Exclude<ExclusiveOutcome<T>, { kind: 'error' }>

/**
 * Runs `runner` under the cross-tab create lock for the account. Returns
 * `blocked` (with RU user-facing copy) instead of throwing when the shared
 * re-check refuses the create — FE-D1 canon: no new transport throws. Runner
 * failures are rethrown verbatim; the Idempotency-Key is minted INSIDE the
 * locked section.
 */
export async function runCabinetCreateExclusive<T>(
  userId: string | null,
  runner: (idempotencyKey: string) => Promise<T>,
  report: (outcome: CreateRunnerOutcome<T>) => 'clean' | 'ambiguous' | 'uncertain',
  options: CabinetCreateLockOptions = {}
): Promise<ResolvedExclusiveOutcome<T>> {
  const storage = options.storage ?? window.localStorage
  const now = options.now ?? Date.now
  // Feature-detect once per call: no navigator.locks → fallback best-effort CAS.
  const lockManager = 'lockManager' in options ? options.lockManager : detectLockManager()
  let outcome: ExclusiveOutcome<T>
  if (lockManager) {
    try {
      outcome = await lockManager.request(cabinetCreateLockName(userId), () =>
        runExclusiveBody(userId, runner, report, storage, now)
      )
    } catch (error) {
      // F6: lock ACQUISITION failed (browser quirk) — fail closed as `blocked`.
      // Runner errors never reach this catch: runExclusiveBody returns them as
      // `error` outcomes, and they are rethrown verbatim below (FE-D1 canon).
      // Pass-5 rider: a THROWING storage inside runExclusiveBody (detached
      // localStorage; pre-runner classify/adopt) also rejects the lock callback
      // and lands HERE on the Web-Locks path → blocked/UNAVAILABLE + this warn
      // label, while the fallback path rethrows it verbatim. Safe divergence:
      // both outcomes happen pre-POST with no stranded claim; retry stays legal.
      // N4: quiet audit trail — lock name + error class only, NEVER user data
      // (Story 167.9 privacy rule; check:privacy scans logger payloads).
      logger.warn('Cabinet create lock acquisition failed', {
        lockName: cabinetCreateLockName(userId),
        errorName: error instanceof Error ? error.name : 'unknown',
      })
      return { kind: 'blocked', message: CABINET_CREATE_UNAVAILABLE_BLOCK_MESSAGE }
    }
  } else {
    outcome = await runExclusiveBody(userId, runner, report, storage, now)
  }
  if (outcome.kind === 'error') throw outcome.error
  return outcome
}

const runExclusiveBody = async <T>(
  userId: string | null,
  runner: (idempotencyKey: string) => Promise<T>,
  report: (outcome: CreateRunnerOutcome<T>) => 'clean' | 'ambiguous' | 'uncertain',
  storage: Storage,
  now: () => number
): Promise<ExclusiveOutcome<T>> => {
  const key = cabinetCreateClaimKey(userId)

  // Fail-closed shared re-checks — the part that makes serialization sufficient.
  // Live store OR persisted blob: storage events are async, the blob is not.
  const activeCabinet =
    (useAuthStore.getState().cabinetId ?? null) !== null || readPersistedCabinetId(storage) !== null
  const state = classifyClaim(storage, key, now())
  // F1b: the settled-cabinet check runs BEFORE the tombstone check — when a
  // cabinet demonstrably exists, tab B gets the "already created" advice even
  // if an old uncertain tombstone is still parked on the claim key.
  if (activeCabinet) return { kind: 'blocked', message: CABINET_CREATE_SETTLED_BLOCK_MESSAGE }
  if (state.kind === 'tombstone') {
    return { kind: 'blocked', message: CABINET_CREATE_TOMBSTONE_BLOCK_MESSAGE }
  }
  if (state.kind === 'in-flight-fresh') {
    return { kind: 'blocked', message: CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE }
  }

  // F4: re-read immediately before adoption — a claim that appeared (or a
  // stale claim another tab just refreshed) means another tab won the race;
  // block instead of overwriting. Narrows (not closes) the no-Web-Locks window.
  if (state.kind === 'absent' || state.kind === 'in-flight-stale') {
    const reread = classifyClaim(storage, key, now())
    if (reread.kind === 'in-flight-fresh' || reread.kind === 'tombstone') {
      return { kind: 'blocked', message: CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE }
    }
  }

  // Adopt: reuse a crashed tab's key (BE replays it) or mint fresh. Concurrent
  // same-key takeover is additionally serialized BE-side (unique-index INSERT
  // wait in cabinets.service.ts) — takeover replay never double-creates. (F8)
  const randomUUID = globalThis.crypto?.randomUUID
  if (typeof randomUUID !== 'function') {
    return { kind: 'blocked', message: CABINET_CREATE_UNAVAILABLE_BLOCK_MESSAGE }
  }
  const staleKey = state.kind === 'in-flight-stale' ? state.claim.idempotencyKey : null
  const idempotencyKey = staleKey ?? randomUUID.call(globalThis.crypto)
  const claim: CabinetCreateClaim = {
    v: 1,
    claimId: randomUUID.call(globalThis.crypto),
    acquiredAt: now(),
    idempotencyKey,
    phase: 'in-flight',
  }
  // Write-verify CAS (mirrors persistMarker): a lost write means another tab
  // won adoption ⇒ block. A throwing storage rethrows verbatim on the FALLBACK
  // path but surfaces as blocked/UNAVAILABLE on the Web-Locks path (see the
  // acquisition catch) — safe both ways: pre-POST, no stranded claim.
  const serialized = JSON.stringify(claim)
  storage.setItem(key, serialized)
  if (storage.getItem(key) !== serialized) {
    return { kind: 'blocked', message: CABINET_CREATE_IN_FLIGHT_BLOCK_MESSAGE }
  }

  // F6: runner failures are returned as `error` outcomes (never rethrown from
  // inside the lock callback) so an acquisition rejection stays distinguishable.
  let disposition: 'clean' | 'ambiguous' | 'uncertain'
  let outcome: ExclusiveOutcome<T>
  try {
    const value = await runner(idempotencyKey)
    disposition = report({ ok: true, value })
    outcome = { kind: 'ran', value }
  } catch (error) {
    disposition = report({ ok: false, error })
    outcome = { kind: 'error', error }
  }
  finalizeClaim(key, claim, storage, disposition)
  return outcome
}

/**
 * Clears a settled-uncertain tombstone once the uncertainty is resolved
 * (re-login / reconciled cabinet read). Safe only because the lock's
 * cabinetId re-check independently blocks any blind re-POST.
 */
export const sweepSettledClaim = (userId: string | null, storage?: Storage): void => {
  const target = storage ?? window.localStorage
  const key = cabinetCreateClaimKey(userId)
  const parsed = parseJson(target.getItem(key) ?? '')
  if (isCabinetCreateClaim(parsed) && parsed.phase === 'settled-uncertain') target.removeItem(key)
}
