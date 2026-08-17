import type { UseFormReturn } from 'react-hook-form'

import { ROUTES } from '@/lib/routes'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

import type { CabinetFormData } from './CabinetCreationFormPresentation'
import {
  CREATE_PENDING_PHASE,
  UPDATE_PENDING_PHASE,
  UPDATE_RECOVERY_PHASE,
  admitRecoveryOperation,
  clearRecoveryMarker,
  finishRecoveryOperation,
  markerAllowsUpdate,
  readRecoveryMarker,
  resumeRecoveryOperation,
  transitionRecoveryMarker,
  type RecoveryMarker,
} from './cabinetCreationRecovery'
import {
  SAFE_RECONCILIATION_MESSAGE,
  UPDATE_RECOVERY_MESSAGE,
  type WorkflowPhase,
} from './cabinetCreationSubmission'

type UpdateMutation = {
  isPending: boolean
  mutateAsync: (value: { targetMarginPct: number }) => Promise<{
    name: string
    targetMarginPct: number | null
  }>
}

type Args = {
  activeCabinetId: string | null
  canCreateCabinet: boolean
  createIsPending: boolean
  currentUserId?: string
  form: UseFormReturn<CabinetFormData>
  localOperationIds: Set<string>
  phase: WorkflowPhase
  router: { push: (href: string) => void }
  setPhase: React.Dispatch<React.SetStateAction<WorkflowPhase>>
  showRecoveryError: (message: string, phase: WorkflowPhase) => void
  startCreate: (data: CabinetFormData, marker: RecoveryMarker) => void
  updateExistingCabinet: UpdateMutation
}

const isLiveOwner = (marker: RecoveryMarker) => useAuthStore.getState().user?.id === marker.userId

export function useCabinetCreationSubmission({
  activeCabinetId,
  canCreateCabinet,
  createIsPending,
  currentUserId,
  form,
  localOperationIds,
  phase,
  router,
  setPhase,
  showRecoveryError,
  startCreate,
  updateExistingCabinet,
}: Args) {
  const isCreateBlocked =
    phase === 'restoring' || phase === 'token-recovery-blocked' || phase === 'recovery-blocked'

  const settleUpdateSuccess = (
    marker: RecoveryMarker,
    updated: { name: string; targetMarginPct: number | null },
    data: CabinetFormData
  ) => {
    finishRecoveryOperation(marker)
    const cleared = clearRecoveryMarker(marker, true)
    if (!isLiveOwner(marker) || cleared === 'mismatch') return
    if (cleared === 'indeterminate') {
      showRecoveryError(SAFE_RECONCILIATION_MESSAGE, 'recovery-blocked')
      return
    }
    setPhase('idle')
    form.reset({
      name: updated.name || data.name,
      targetMarginPct: String(updated.targetMarginPct ?? 20),
    })
    toast.success('Целевая маржа сохранена')
    router.push(ROUTES.ONBOARDING.WB_TOKEN)
  }

  const settleUpdateError = (marker: RecoveryMarker) => {
    finishRecoveryOperation(marker)
    const transitioned = transitionRecoveryMarker(marker, UPDATE_RECOVERY_PHASE)
    if (!isLiveOwner(marker) || transitioned === 'mismatch') return
    showRecoveryError(
      transitioned === 'applied' ? UPDATE_RECOVERY_MESSAGE : SAFE_RECONCILIATION_MESSAGE,
      transitioned === 'applied' ? 'margin-recovery' : 'recovery-blocked'
    )
  }

  const onSubmit = (data: CabinetFormData) => {
    const read = currentUserId
      ? readRecoveryMarker(currentUserId)
      : ({ kind: 'indeterminate' } as const)
    const marker = read.kind === 'present' ? read.marker : null
    const persistentBlock =
      read.kind === 'indeterminate' ||
      Boolean(marker && !markerAllowsUpdate(marker, activeCabinetId))
    if (
      !canCreateCabinet ||
      isCreateBlocked ||
      persistentBlock ||
      createIsPending ||
      updateExistingCabinet.isPending
    ) {
      if (read.kind === 'indeterminate') {
        showRecoveryError(SAFE_RECONCILIATION_MESSAGE, 'recovery-blocked')
      }
      return
    }
    if (!currentUserId) return
    const pending =
      marker && markerAllowsUpdate(marker, activeCabinetId)
        ? resumeRecoveryOperation(marker, UPDATE_PENDING_PHASE)
        : admitRecoveryOperation(
            currentUserId,
            activeCabinetId ? UPDATE_PENDING_PHASE : CREATE_PENDING_PHASE
          )
    if (!pending) {
      showRecoveryError(SAFE_RECONCILIATION_MESSAGE, 'recovery-blocked')
      return
    }
    localOperationIds.add(pending.operationId)
    if (activeCabinetId) {
      void updateExistingCabinet
        .mutateAsync({ targetMarginPct: Number(data.targetMarginPct) })
        .then(updated => settleUpdateSuccess(pending, updated, data))
        .catch(() => settleUpdateError(pending))
      return
    }
    setPhase('creating')
    startCreate(data, pending)
  }

  return { isCreateBlocked, onSubmit }
}
