'use client'

/**
 * FeedbackRow — single WB feedback row (read + gated reply/edit, PR2).
 *
 * Extracted from FeedbacksSection for file-size compliance. nmId is rendered
 * with String() (AP#10 — opaque id, never formatNumber). createdAt is nullable
 * (AP#8 → '—'). The reply/edit write surface is delegated to
 * FeedbackWriteControls (keeps this row <200 lines).
 */

import { formatDate } from '@/lib/utils'
import { FeedbackRating } from './FeedbacksSection'
import { FeedbackWriteControls } from './FeedbackWriteControls'
import type { WbFeedback } from '@/types/communications'

export interface FeedbackRowProps {
  feedback: WbFeedback
}

/** Render a single feedback: rating + text + nmId + date + answer status + reply. */
export function FeedbackRow({ feedback }: FeedbackRowProps) {
  const { rating, text, nmId, feedbackId, answer, isAnswered, createdAt } = feedback
  const hasAnswer = !!answer && isAnswered !== false
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-2">
        <FeedbackRating rating={rating} />
        <span className="text-xs tabular-nums text-muted-foreground">
          {createdAt ? formatDate(createdAt) : '—'}
        </span>
      </div>
      {text ? <p className="mt-1 text-sm">{text}</p> : null}
      {hasAnswer ? <p className="mt-1 text-xs italic text-muted-foreground">{answer}</p> : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          Артикул:{' '}
          <span className="font-mono tabular-nums text-foreground">
            {nmId == null ? '—' : String(nmId)}
          </span>
        </span>
        <AnswerStatus isAnswered={isAnswered} />
      </div>
      <FeedbackWriteControls feedbackId={feedbackId} existingAnswer={hasAnswer ? answer : null} />
    </li>
  )
}

/**
 * Read-only answer-status chip (no reply control — PR2 write-side). Three-state:
 * isAnswered===true → "Отвечено", ===false → "Без ответа", ==null → neutral
 * "Статус неизвестен" (Defensive Frontend: never fabricate "answered" from the
 * answer text — only the backend's isAnswered flag confirms an answer exists).
 */
function AnswerStatus({ isAnswered }: { isAnswered: boolean | null }) {
  if (isAnswered === true) return <span className="text-status-success">Отвечено</span>
  if (isAnswered === false) return <span className="text-status-error">Без ответа</span>
  return <span>Статус неизвестен</span>
}
