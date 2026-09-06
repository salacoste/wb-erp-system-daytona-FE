import { useEffect, useRef, useState, type RefObject } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { sweepSettledClaim } from '@/lib/cabinetCreationLock'

import type { CabinetFormData } from './CabinetCreationFormPresentation'
import {
  CREATE_PENDING_PHASE,
  RECOVERY_MARKER_EVENT,
  TOKEN_RECOVERY_PHASE,
  clearRecoveryMarker,
  isRecoveryOperationActive,
  markerAllowsUpdate,
  markerBlocksCreate,
  readRecoveryMarker,
} from './cabinetCreationRecovery'
import {
  MARGIN_RECOVERY_MESSAGE,
  SAFE_RECONCILIATION_MESSAGE,
  TOKEN_RECOVERY_MESSAGE,
  UPDATE_RECOVERY_MESSAGE,
  type WorkflowPhase,
} from './cabinetCreationSubmission'

type CabinetData = { name: string; targetMarginPct: number | null }
type Args = {
  activeCabinetId: string | null
  currentUserId?: string
  existingCabinetData?: CabinetData
  form: UseFormReturn<CabinetFormData>
  isMarginDirty: boolean
  localOperationIds: ReadonlySet<string>
}

type RecoveryState = {
  phase: WorkflowPhase
  recoveryError: string | null
  recoveryErrorRef: RefObject<HTMLDivElement | null>
  setPhase: React.Dispatch<React.SetStateAction<WorkflowPhase>>
  /** R2: `source` 'blocked' alerts persist across the reconcile fall-through. */
  setRecoveryError: (message: string | null, source?: 'recovery' | 'blocked') => void
}

export function useCabinetCreationRecovery({
  activeCabinetId,
  currentUserId,
  existingCabinetData,
  form,
  isMarginDirty,
  localOperationIds,
}: Args): RecoveryState {
  const [phase, setPhase] = useState<WorkflowPhase>('restoring')
  const [recoveryError, setRecoveryErrorText] = useState<string | null>(null)
  const [markerRevision, setMarkerRevision] = useState(0)
  const [reconcileRevision, setReconcileRevision] = useState(0)
  const appliedReconcileRevision = useRef(0)
  const recoveryErrorRef = useRef<HTMLDivElement>(null)
  // R2 (review pass 3): discriminate alerts by CAUSE, not by text — N2 made the
  // tombstone copy byte-identical to TOKEN_RECOVERY_MESSAGE, so the fall-through
  // text-based nulling self-erased blocked alerts. 'blocked'-cause alerts
  // (FE-D5 lock refusals) persist; 'recovery'-cause alerts stay self-erasing.
  const recoveryErrorSourceRef = useRef<'recovery' | 'blocked'>('recovery')
  const setRecoveryError = (
    message: string | null,
    source: 'recovery' | 'blocked' = 'recovery'
  ) => {
    recoveryErrorSourceRef.current = source
    setRecoveryErrorText(message)
  }

  useEffect(() => {
    const handleMarkerChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; reconcile?: boolean }>).detail
      if (!currentUserId || detail?.userId !== currentUserId) return
      setMarkerRevision(revision => revision + 1)
      if (detail.reconcile) setReconcileRevision(revision => revision + 1)
    }
    window.addEventListener(RECOVERY_MARKER_EVENT, handleMarkerChange)
    return () => window.removeEventListener(RECOVERY_MARKER_EVENT, handleMarkerChange)
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) {
      setPhase('restoring')
      return
    }
    // FE-D5: a reconciled cabinet resolves the uncertain-settlement tombstone —
    // the lock's cabinetId re-check independently blocks any blind re-POST.
    if (activeCabinetId) sweepSettledClaim(currentUserId)
    const read = readRecoveryMarker(currentUserId)
    if (read.kind === 'indeterminate') {
      setRecoveryError(SAFE_RECONCILIATION_MESSAGE)
      setPhase('recovery-blocked')
      return
    }
    const marker = read.kind === 'present' ? read.marker : null
    const activeOperation = marker ? isRecoveryOperationActive(marker) : false
    const reconciledCreate =
      marker?.phase === CREATE_PENDING_PHASE && Boolean(activeCabinetId) && !activeOperation
    const reconciledToken =
      marker?.phase === TOKEN_RECOVERY_PHASE && !markerBlocksCreate(marker, activeCabinetId)
    if (marker && (reconciledCreate || reconciledToken)) {
      if (clearRecoveryMarker(marker) === 'applied') {
        setRecoveryError(null)
        setPhase('idle')
      } else {
        setRecoveryError(SAFE_RECONCILIATION_MESSAGE)
        setPhase('recovery-blocked')
      }
      return
    }
    if (marker && markerAllowsUpdate(marker, activeCabinetId)) {
      setRecoveryError(
        marker.phase === 'post-create-margin-recovery'
          ? MARGIN_RECOVERY_MESSAGE
          : UPDATE_RECOVERY_MESSAGE
      )
      setPhase('margin-recovery')
      return
    }
    // Quiet-guard for a locally-known operation. Deliberately NOT gated on
    // `activeOperation`: the mutation's non-applied branch releases the
    // liveness flag when it settles (D-1 review fix — so a same-tab
    // logout+login can reconcile via `reconciledCreate`), and this effect can
    // run AFTER that release (React passive effects are deferred). A form
    // instance that itself dispatched the operation stays quiet about its
    // settled marker (stale canon); only a remount (fresh localOperationIds)
    // surfaces the recovery alert for the durable marker.
    if (marker && localOperationIds.has(marker.operationId)) {
      // Pass-2 review (D-1): a released liveness flag + still-local operation
      // must stay quiet, but must not strand a pre-normalization phase —
      // 'restoring' silently blocks the form (same-tab logout+login without
      // a cabinet re-enters here before the fall-through normalization).
      // Pass-3 review: after indeterminate + same-tab logout+login without a cabinetId, the earlier alert text persists beside the enabled button until a real cabinetId lands (reconciledCreate clears it); production re-login returns cabinet_ids — test-visible-only state.
      setPhase(current => (current === 'restoring' ? 'idle' : current))
      return
    }
    if (marker) {
      setRecoveryError(
        marker.phase === TOKEN_RECOVERY_PHASE ? TOKEN_RECOVERY_MESSAGE : SAFE_RECONCILIATION_MESSAGE
      )
      setPhase(marker.phase === TOKEN_RECOVERY_PHASE ? TOKEN_RECOVERY_PHASE : 'recovery-blocked')
      return
    }
    // Raw state setter: going through the wrapper would RESET the source ref
    // to 'recovery' before React lazily invokes this updater.
    setRecoveryErrorText(error =>
      recoveryErrorSourceRef.current === 'recovery' &&
      (error === TOKEN_RECOVERY_MESSAGE || error === SAFE_RECONCILIATION_MESSAGE)
        ? null
        : error
    )
    setPhase(currentPhase =>
      activeCabinetId && (currentPhase === 'creating' || currentPhase === 'margin-recovery')
        ? currentPhase
        : 'idle'
    )
  }, [activeCabinetId, currentUserId, localOperationIds, markerRevision])

  useEffect(() => {
    if (!existingCabinetData || phase !== 'idle') return
    const mustReconcile = reconcileRevision > appliedReconcileRevision.current
    form.reset(
      {
        name: existingCabinetData.name,
        targetMarginPct: String(existingCabinetData.targetMarginPct ?? 20),
      },
      mustReconcile ? undefined : { keepDirtyValues: isMarginDirty }
    )
    if (mustReconcile) appliedReconcileRevision.current = reconcileRevision
  }, [existingCabinetData, form, isMarginDirty, phase, reconcileRevision])

  useEffect(() => {
    if (recoveryError) recoveryErrorRef.current?.focus()
  }, [recoveryError])

  return { phase, recoveryError, recoveryErrorRef, setPhase, setRecoveryError }
}
