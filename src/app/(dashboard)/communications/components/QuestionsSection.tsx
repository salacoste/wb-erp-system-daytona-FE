'use client'

/**
 * QuestionsSection — NEW-2 WB product questions (read + gated answer, PR2).
 *
 * Owns its OWN loading/error/empty state machine (AC4). Lists questions with
 * text, nmId (String, AP#10), and answer status. Each row renders its answer
 * surface via QuestionRow → QuestionWriteControls (extracted for size cap).
 */

import { useCallback } from 'react'
import { HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuestions } from '@/hooks/useCommunications'
import { SectionState } from './SectionState'
import { QuestionRow } from './QuestionRow'

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
