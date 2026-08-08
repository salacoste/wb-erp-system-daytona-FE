'use client'

/**
 * QuestionRow — single WB question row (read + gated answer, PR2).
 *
 * Extracted from QuestionsSection for file-size compliance. nmId is rendered
 * with String() (AP#10); createdAt is nullable (AP#8 → '—'). The answer write
 * surface is delegated to QuestionWriteControls (keeps this row <200 lines).
 */

import { formatDate } from '@/lib/utils'
import { QuestionWriteControls } from './QuestionWriteControls'
import type { WbQuestion } from '@/types/communications'

export interface QuestionRowProps {
  question: WbQuestion
}

/** Render a single question: text + nmId + date + answer status + answer control. */
export function QuestionRow({ question }: QuestionRowProps) {
  const { text, nmId, questionId, answer, isAnswered, createdAt } = question
  const hasAnswer = !!answer && isAnswered !== false
  return (
    <li className="py-3">
      {text ? (
        <p className="text-sm">{text}</p>
      ) : (
        <p className="text-sm italic">Вопрос без текста</p>
      )}
      {hasAnswer ? <p className="mt-1 text-xs italic text-muted-foreground">{answer}</p> : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          Артикул:{' '}
          <span className="font-mono tabular-nums text-foreground">
            {nmId == null ? '—' : String(nmId)}
          </span>
        </span>
        <span className="tabular-nums">{createdAt ? formatDate(createdAt) : '—'}</span>
        <QuestionAnswerStatus isAnswered={isAnswered} />
      </div>
      <QuestionWriteControls questionId={questionId} existingAnswer={hasAnswer ? answer : null} />
    </li>
  )
}

/**
 * Read-only answer-status chip. Three-state: isAnswered===true → "Отвечено",
 * ===false → "Без ответа", ==null → neutral "Статус неизвестен" (Defensive
 * Frontend: never fabricate "answered" from the answer text).
 */
function QuestionAnswerStatus({ isAnswered }: { isAnswered: boolean | null }) {
  if (isAnswered === true) return <span className="text-green-600">Отвечено</span>
  if (isAnswered === false) return <span className="text-red-600">Без ответа</span>
  return <span>Статус неизвестен</span>
}
