'use client'

/**
 * QuestionsSection — NEW-2 WB product questions (read-only PR1).
 *
 * Owns its OWN loading/error/empty state machine (AC4). Lists questions with
 * text, nmId (String, AP#10), and answer status. No answer UI (PR2 write-side).
 */

import { useCallback } from 'react'
import { HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuestions } from '@/hooks/useCommunications'
import { formatDate } from '@/lib/utils'
import { SectionState } from './SectionState'
import type { WbQuestion } from '@/types/communications'

const QUESTIONS_ERROR_MESSAGE = 'Не удалось загрузить вопросы. Попробуйте ещё раз.'
const QUESTIONS_EMPTY_MESSAGE = 'Нет вопросов'

export interface QuestionsSectionProps {
  enabled?: boolean
}

/** GET /v1/communications/questions — unanswered questions by default. */
export function QuestionsSection({ enabled = true }: QuestionsSectionProps) {
  const questions = useQuestions({ isUnanswered: true }, { enabled })

  const handleRetry = useCallback(() => questions.refetch(), [questions])
  const rows = questions.data?.rows ?? []
  const total = questions.data?.total ?? 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" aria-hidden />
            Вопросы
          </span>
          <span className="text-xs font-normal text-muted-foreground">Всего: {total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SectionState
          isLoading={questions.isLoading}
          isError={questions.isError}
          isEmpty={rows.length === 0}
          errorMessage={QUESTIONS_ERROR_MESSAGE}
          emptyMessage={QUESTIONS_EMPTY_MESSAGE}
          onRetry={handleRetry}
        >
          <ul className="divide-y divide-border">
            {rows.map(q => (
              <QuestionRow key={q.id} question={q} />
            ))}
          </ul>
        </SectionState>
      </CardContent>
    </Card>
  )
}

/** Render a single question: text + nmId + date + answer status (read-only). */
function QuestionRow({ question }: { question: WbQuestion }) {
  const { text, nmId, answer, isAnswered, createdAt } = question
  return (
    <li className="py-3">
      {text ? (
        <p className="text-sm">{text}</p>
      ) : (
        <p className="text-sm italic">Вопрос без текста</p>
      )}
      {answer && isAnswered !== false ? (
        <p className="mt-1 text-xs italic text-muted-foreground">{answer}</p>
      ) : null}
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
