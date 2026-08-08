'use client'

/**
 * PinnedWriteControls — NEW-2 pin/unpin surface for a feedback (PR2).
 *
 * Orchestrates the 202→poll→terminal flow for pin + unpin (one-shot jobIds).
 * Finding 5: pin and unpin use SEPARATE useWritebackJob coordinators so two
 * concurrent jobs each reach their own terminal (a shared coordinator clobbered
 * the second jobId before the first fired onTerminal). Each action opens an
 * accessible ConfirmAction dialog — the explicit confirm IS the user-gesture
 * proof the BE confirmationToken represents (the hook mints a fresh
 * crypto.randomUUID token on the firing call). On terminal `completed` → toast
 * + invalidate the pinned read query; on `failed`/timeout/error → WritebackStatus.
 * 403 from the gate → kill-switch RU message (Defensive Frontend).
 *
 * `feedbackId` here is the WB review id (PinnedReviewItem.feedbackId). When
 * null/empty the controls are disabled (no crash) — a null feedbackId can't be
 * targeted. Pin/unpin use the same `{ id }` body shape (the WB SDK target).
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ConfirmAction } from './ConfirmAction'
import { WritebackStatus } from './WritebackStatus'
import {
  usePinFeedback,
  useUnpinFeedback,
  WRITEBACK_TIMEOUT_MESSAGE,
  WRITEBACK_TIMEOUT_STATUS,
} from '@/hooks/useCommunicationsWriteback'
import { useWritebackJob } from '@/hooks/useWritebackJob'
import { communicationsQueryKeys } from '@/hooks/useCommunications-utils'
import { isWritebackCompleted } from '@/lib/communications-writeback-utils'

export interface PinnedWriteControlsProps {
  /** WB review id (PinnedReviewItem.feedbackId) — the pin/unpin target. */
  feedbackId: string | null
}

type Dialog = 'none' | 'pin' | 'unpin'

/** Build the RU toast for a terminal result given the fired action kind. */
function pinToast(actionKind: string | null, ok: boolean): string {
  const verb = actionKind === 'unpin' ? 'откреплён' : 'закреплён'
  return ok ? `Отзыв ${verb}` : 'Не удалось изменить закрепление'
}

/** Render the pin/unpin buttons + confirm dialogs + async status. */
export function PinnedWriteControls({ feedbackId }: PinnedWriteControlsProps) {
  const [dialog, setDialog] = useState<Dialog>('none')
  const pin = usePinFeedback()
  const unpin = useUnpinFeedback()
  const queryClient = useQueryClient()

  const invalidatePinned = useCallback(
    () => queryClient.invalidateQueries({ queryKey: communicationsQueryKeys.pinned({}) }),
    [queryClient]
  )

  // Finding 5: separate coordinators so concurrent pin/unpin jobs each reach
  // their own terminal (a shared one clobbered the second jobId). Pass-2 P2-5:
  // each coordinator closes its OWN dialog unconditionally on terminal (the
  // actionKind gate was fragile now that pin/unpin are separate coordinators).
  const pinJob = useWritebackJob((status, _error, meta) => {
    if (status === WRITEBACK_TIMEOUT_STATUS) toast.error(WRITEBACK_TIMEOUT_MESSAGE)
    else {
      const ok = isWritebackCompleted(status)
      toast[ok ? 'success' : 'error'](pinToast(meta.actionKind, ok))
      if (ok) invalidatePinned()
    }
    setDialog(d => (d === 'pin' ? 'none' : d))
  })
  const unpinJob = useWritebackJob((status, _error, meta) => {
    if (status === WRITEBACK_TIMEOUT_STATUS) toast.error(WRITEBACK_TIMEOUT_MESSAGE)
    else {
      const ok = isWritebackCompleted(status)
      toast[ok ? 'success' : 'error'](pinToast(meta.actionKind, ok))
      if (ok) invalidatePinned()
    }
    setDialog(d => (d === 'unpin' ? 'none' : d))
  })

  const jobPending =
    (!!pinJob.jobId && !pinJob.isTerminal) || (!!unpinJob.jobId && !unpinJob.isTerminal)
  const isPending = pin.isPending || unpin.isPending || jobPending
  const activeError = pin.error ?? unpin.error
  // feedbackId may be null on incomplete pinned rows — can't target those.
  const targetId = feedbackId ?? ''

  const firePin = useCallback(() => {
    if (!targetId) return
    pinJob.setActionKind('pin')
    pin.mutate(
      { feedbackId: targetId, pinData: { id: targetId } },
      { onSuccess: enqueued => pinJob.setJobId(enqueued.jobId) }
    )
  }, [targetId, pin, pinJob])

  const fireUnpin = useCallback(() => {
    if (!targetId) return
    unpinJob.setActionKind('unpin')
    unpin.mutate(
      { feedbackId: targetId, unpinData: { id: targetId } },
      { onSuccess: enqueued => unpinJob.setJobId(enqueued.jobId) }
    )
  }, [targetId, unpin, unpinJob])

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDialog('pin')}
        disabled={isPending || !targetId}
        data-testid="pin-btn"
      >
        Закрепить
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDialog('unpin')}
        disabled={isPending || !targetId}
        data-testid="unpin-btn"
      >
        Открепить
      </Button>
      <WritebackStatus
        isInflight={isPending}
        error={activeError}
        status={pinJob.effectiveStatus ?? unpinJob.effectiveStatus}
        pollError={pinJob.pollError || unpinJob.pollError}
        testId="pinned-writeback-status"
      />
      <ConfirmAction
        open={dialog === 'pin'}
        onOpenChange={open => setDialog(open ? 'pin' : 'none')}
        title="Закрепить отзыв?"
        description="Отзыв будет показан на карточке товара."
        confirmLabel="Закрепить"
        onConfirm={firePin}
        isPending={isPending}
      />
      <ConfirmAction
        open={dialog === 'unpin'}
        onOpenChange={open => setDialog(open ? 'unpin' : 'none')}
        title="Открепить отзыв?"
        description="Отзыв больше не будет показан на карточке товара."
        confirmLabel="Открепить"
        onConfirm={fireUnpin}
        isPending={isPending}
      />
    </div>
  )
}
