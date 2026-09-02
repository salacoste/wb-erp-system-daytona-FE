import { useMutation } from '@tanstack/react-query'

import { getCabinetCreationOperation } from '@/lib/api'
import { ApiError } from '@/types/api'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/lib/routes'
import { handleCreateCabinet } from '@/services/cabinets.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

import type { CabinetFormData } from './CabinetCreationFormPresentation'
import {
  POST_CREATE_MARGIN_PHASE,
  TOKEN_RECOVERY_PHASE,
  clearRecoveryMarker,
  finishRecoveryOperation,
  transitionRecoveryMarker,
  type RecoveryMarker,
} from './cabinetCreationRecovery'
import {
  MARGIN_RECOVERY_MESSAGE,
  SAFE_RECONCILIATION_MESSAGE,
  TOKEN_RECOVERY_MESSAGE,
  type CreateAttemptSnapshot,
  type WorkflowPhase,
} from './cabinetCreationSubmission'

type CreateVariables = {
  attempt: CreateAttemptSnapshot
  data: CabinetFormData
  marker: RecoveryMarker
}

type Args = {
  router: { push: (href: string) => void }
  showRecoveryError: (message: string, phase: WorkflowPhase) => void
  setPhase: React.Dispatch<React.SetStateAction<WorkflowPhase>>
}

const isLiveOwner = (marker: RecoveryMarker) => useAuthStore.getState().user?.id === marker.userId

/**
 * Story 167.5 alignment (carry-over from 167.9): after a superseded settlement,
 * reconcile the durable Story 167.8 operation for the initiating account —
 * quiet evidence only, no UI effects, no secrets logged.
 */
async function reconcileSettledOperation(
  operationId: string | undefined,
  initiatingToken: string | null
): Promise<void> {
  if (!operationId || !initiatingToken) return
  try {
    const operation = await getCabinetCreationOperation(operationId, initiatingToken)
    logger.info('Cabinet creation operation reconciled after superseded settlement', {
      operationId,
      status: 'status' in operation ? operation.status : 'succeeded',
    })
  } catch (error) {
    // Pass-1 review: distinguish 404 (operation gone / cross-account — expected
    // for a superseded settlement) from 401 (initiating token expired at reconcile
    // time) from transport failure, so the recovery audit trail is answerable.
    // Never log the token itself (Story 167.9 privacy rule).
    const status = error instanceof ApiError ? error.status : 'network'
    logger.warn('Cabinet creation operation reconciliation unavailable', { operationId, status })
  }
}

export function useCabinetCreateMutation({ router, setPhase, showRecoveryError }: Args) {
  return useMutation({
    retry: false,
    mutationFn: ({ data }: CreateVariables) =>
      handleCreateCabinet(data.name, Number(data.targetMarginPct)),
    onSuccess: (result, { attempt, marker }) => {
      // Story 167.9 (ported into the refactored seam 2026-08-17): only an
      // `applied` settlement belongs to the live session. Stale/indeterminate
      // suppress toast, navigation, form reset, AND marker-clear — the durable
      // marker/operation stays available for reconciliation.
      if (result.status !== 'applied' || !result.cabinet) {
        void reconcileSettledOperation(result.operationId, attempt.token)
        // D-1 (PB-1): `indeterminate` means the initiator may still be the live
        // user (the cabinet exists server-side): indicate, never silently
        // swallow (Defensive Frontend). `stale` stays quiet — the live session
        // is not the initiator (Story 167.9 canon). isLiveOwner keeps the alert
        // away from a different live account.
        if (result.status === 'indeterminate' && isLiveOwner(marker)) {
          showRecoveryError(SAFE_RECONCILIATION_MESSAGE, 'recovery-blocked')
        }
        return
      }
      finishRecoveryOperation(marker)
      const cleared = clearRecoveryMarker(marker)
      if (!isLiveOwner(marker) || cleared === 'mismatch') return
      if (cleared === 'indeterminate') {
        showRecoveryError(SAFE_RECONCILIATION_MESSAGE, 'recovery-blocked')
        return
      }
      setPhase('idle')
      toast.success(`Кабинет "${result.cabinet.name}" успешно создан!`)
      router.push(ROUTES.ONBOARDING.WB_TOKEN)
    },
    onError: (error: Error, { attempt, marker }) => {
      finishRecoveryOperation(marker)
      const errorMessage = error.message.toLowerCase()
      const liveAuth = useAuthStore.getState()
      const emergedCabinetId =
        attempt.userId === liveAuth.user?.id && liveAuth.cabinetId !== attempt.cabinetId
          ? (liveAuth.cabinetId ?? undefined)
          : undefined
      const tokenPartial =
        (errorMessage.includes('cabinet created') && /token|refresh/.test(errorMessage)) ||
        Boolean(emergedCabinetId)
      const recovery = errorMessage.includes('target margin')
        ? {
            result: transitionRecoveryMarker(marker, POST_CREATE_MARGIN_PHASE),
            message: MARGIN_RECOVERY_MESSAGE,
            phase: 'margin-recovery' as const,
          }
        : tokenPartial
          ? {
              result: transitionRecoveryMarker(marker, TOKEN_RECOVERY_PHASE, emergedCabinetId),
              message: TOKEN_RECOVERY_MESSAGE,
              phase: TOKEN_RECOVERY_PHASE,
            }
          : {
              result: clearRecoveryMarker(marker),
              message: error.message || 'Ошибка создания кабинета. Попробуйте еще раз.',
              phase: 'idle' as const,
            }
      if (!isLiveOwner(marker) || recovery.result === 'mismatch') return
      showRecoveryError(
        recovery.result === 'applied' ? recovery.message : SAFE_RECONCILIATION_MESSAGE,
        recovery.result === 'applied' ? recovery.phase : 'recovery-blocked'
      )
    },
  })
}
