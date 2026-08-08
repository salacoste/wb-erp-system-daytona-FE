'use client'

/**
 * FeedbackWriteControls — NEW-2 reply/edit write surface for a single feedback.
 *
 * Orchestrates the 202→poll→terminal flow for the feedback reply (one-shot) and
 * reply edit (one-shot PATCH). On terminal `completed` → toast + invalidate the
 * feedbacks read query; on `failed`/error → the inline WritebackStatus banner.
 * 403 from the gate → the kill-switch RU message (Defensive Frontend).
 *
 * Extracted from FeedbackRow so the row stays <200 lines and the write logic
 * lives in ONE place. The hook mints the confirmationToken; the user gesture is
 * the submit button click.
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ReplyForm } from './ReplyForm'
import { WritebackStatus } from './WritebackStatus'
import {
  useReplyFeedback,
  useUpdateFeedbackReply,
  WRITEBACK_TIMEOUT_MESSAGE,
  WRITEBACK_TIMEOUT_STATUS,
} from '@/hooks/useCommunicationsWriteback'
import { useWritebackJob } from '@/hooks/useWritebackJob'
import { useQueryClient } from '@tanstack/react-query'
import { communicationsQueryKeys } from '@/hooks/useCommunications-utils'
import { isWritebackCompleted } from '@/lib/communications-writeback-utils'

export interface FeedbackWriteControlsProps {
  feedbackId: string
  /** Existing answer text — when present the control offers "Редактировать". */
  existingAnswer: string | null
}

type Mode = 'idle' | 'reply' | 'edit'

/** Render the reply/edit button, inline form, and async status. */
export function FeedbackWriteControls({ feedbackId, existingAnswer }: FeedbackWriteControlsProps) {
  const [mode, setMode] = useState<Mode>('idle')
  const reply = useReplyFeedback()
  const update = useUpdateFeedbackReply()
  const queryClient = useQueryClient()

  const invalidateFeedbacks = useCallback(
    () => queryClient.invalidateQueries({ queryKey: communicationsQueryKeys.feedbacks({}) }),
    [queryClient]
  )

  // Coordinator captures the 202 jobId and polls; on terminal fires the handler.
  // reply + edit are mutually exclusive (one mode at a time) so a single job is
  // safe — the action kind is captured at fire time so the toast labels correctly.
  const job = useWritebackJob((status, _error, _meta) => {
    if (isWritebackCompleted(status)) {
      toast.success('Ответ отправлен')
      invalidateFeedbacks()
    } else if (status === WRITEBACK_TIMEOUT_STATUS) {
      // Pass-2 P2-1: a poll timeout surfaces the RU timeout copy (distinct from
      // the generic failure toast) so the user knows the send-status check gave up.
      toast.error(WRITEBACK_TIMEOUT_MESSAGE)
    } else {
      toast.error('Не удалось отправить ответ')
    }
    setMode('idle')
  })

  const isPending = reply.isPending || update.isPending || (!!job.jobId && !job.isTerminal)
  const activeError = reply.error ?? update.error

  const handleSubmit = useCallback(
    (text: string) => {
      job.setActionKind(mode === 'edit' ? 'update_feedback_reply' : 'reply_feedback')
      if (mode === 'edit') {
        update.mutate(
          { feedbackId, text },
          {
            onSuccess: enqueued => job.setJobId(enqueued.jobId),
            onError: () => setMode('idle'),
          }
        )
      } else {
        reply.mutate(
          { feedbackId, text },
          {
            onSuccess: enqueued => job.setJobId(enqueued.jobId),
            onError: () => setMode('idle'),
          }
        )
      }
    },
    [mode, update, reply, feedbackId, job]
  )

  if (mode === 'reply' || mode === 'edit') {
    return (
      <div className="mt-1">
        <ReplyForm
          initialText={mode === 'edit' && existingAnswer ? existingAnswer : ''}
          submitLabel={mode === 'edit' ? 'Сохранить' : 'Ответить'}
          ariaLabel={mode === 'edit' ? 'Редактировать ответ' : 'Ответ на отзыв'}
          onSubmit={handleSubmit}
          onCancel={() => setMode('idle')}
          isPending={isPending}
        />
        <WritebackStatus
          isInflight={isPending}
          error={activeError}
          status={job.effectiveStatus}
          pollError={job.pollError}
          jobError={
            job.isTerminal && !isWritebackCompleted(job.status)
              ? (job.error ?? undefined)
              : undefined
          }
          testId="feedback-writeback-status"
        />
      </div>
    )
  }

  const hasAnswer = !!existingAnswer
  return (
    <div className="mt-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setMode(hasAnswer ? 'edit' : 'reply')}
        data-testid={hasAnswer ? 'feedback-edit-btn' : 'feedback-reply-btn'}
      >
        {hasAnswer ? 'Редактировать' : 'Ответить'}
      </Button>
      <WritebackStatus isInflight={false} error={activeError} testId="feedback-writeback-status" />
    </div>
  )
}
