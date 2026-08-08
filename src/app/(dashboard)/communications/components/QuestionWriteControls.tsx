'use client'

/**
 * QuestionWriteControls — NEW-2 answer write surface for a single question.
 *
 * Orchestrates the 202→poll→terminal flow for answering a question (deterministic
 * jobId). Inline ReplyForm (textarea ≤3000). On terminal `completed` → toast +
 * invalidate the questions read query; on `failed`/error → WritebackStatus.
 * 403 from the gate → kill-switch RU message (Defensive Frontend).
 *
 * Extracted from QuestionsSection so the section stays <200 lines. The hook
 * mints the confirmationToken; the user gesture is the submit click.
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ReplyForm } from './ReplyForm'
import { WritebackStatus } from './WritebackStatus'
import {
  useAnswerQuestion,
  WRITEBACK_TIMEOUT_MESSAGE,
  WRITEBACK_TIMEOUT_STATUS,
} from '@/hooks/useCommunicationsWriteback'
import { useWritebackJob } from '@/hooks/useWritebackJob'
import { communicationsQueryKeys } from '@/hooks/useCommunications-utils'
import { isWritebackCompleted } from '@/lib/communications-writeback-utils'

export interface QuestionWriteControlsProps {
  questionId: string
  /** Existing answer text — prefilled when editing. */
  existingAnswer: string | null
}

/** Render the answer button, inline form, and async status. */
export function QuestionWriteControls({ questionId, existingAnswer }: QuestionWriteControlsProps) {
  const [open, setOpen] = useState(false)
  const answer = useAnswerQuestion()
  const queryClient = useQueryClient()

  const invalidateQuestions = useCallback(
    () => queryClient.invalidateQueries({ queryKey: communicationsQueryKeys.questions({}) }),
    [queryClient]
  )

  const job = useWritebackJob((status, _error, _meta) => {
    if (isWritebackCompleted(status)) {
      toast.success('Ответ отправлен')
      invalidateQuestions()
    } else if (status === WRITEBACK_TIMEOUT_STATUS) {
      // Pass-2 P2-1: RU timeout toast (distinct from the generic failure toast).
      toast.error(WRITEBACK_TIMEOUT_MESSAGE)
    } else {
      toast.error('Не удалось отправить ответ')
    }
    setOpen(false)
  })

  const isPending = answer.isPending || (!!job.jobId && !job.isTerminal)

  const handleSubmit = useCallback(
    (text: string) => {
      job.setActionKind('answer_question')
      answer.mutate(
        { questionId, answer: text },
        {
          onSuccess: enqueued => job.setJobId(enqueued.jobId),
          onError: () => setOpen(false),
        }
      )
    },
    [answer, questionId, job]
  )

  if (open) {
    return (
      <div className="mt-1">
        <ReplyForm
          initialText={existingAnswer ?? ''}
          submitLabel="Ответить"
          ariaLabel="Ответ на вопрос"
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isPending={isPending}
        />
        <WritebackStatus
          isInflight={isPending}
          error={answer.error}
          status={job.effectiveStatus}
          pollError={job.pollError}
          jobError={
            job.isTerminal && !isWritebackCompleted(job.status)
              ? (job.error ?? undefined)
              : undefined
          }
          testId="question-writeback-status"
        />
      </div>
    )
  }

  return (
    <div className="mt-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-testid={existingAnswer ? 'question-edit-btn' : 'question-answer-btn'}
      >
        {existingAnswer ? 'Редактировать' : 'Ответить'}
      </Button>
      <WritebackStatus isInflight={false} error={answer.error} testId="question-writeback-status" />
    </div>
  )
}
