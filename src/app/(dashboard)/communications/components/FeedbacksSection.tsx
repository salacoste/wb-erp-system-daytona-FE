'use client'

/**
 * FeedbacksSection — NEW-2 WB seller feedbacks (read-only PR1).
 *
 * Owns its OWN loading/error/empty state machine (AC4). Lists feedbacks with
 * rating (1..5 stars), text, nmId (String, AP#10), and answer status. Rating is
 * nullable (AP#8: null → '—'). No reply UI (PR2 write-side).
 */

import { useCallback } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFeedbacks } from '@/hooks/useCommunications'
import { SectionState } from './SectionState'
import { FeedbackRow } from './FeedbackRow'

const FEEDBACKS_ERROR_MESSAGE = 'Не удалось загрузить отзывы. Попробуйте ещё раз.'
const FEEDBACKS_EMPTY_MESSAGE = 'Нет отзывов'

export interface FeedbacksSectionProps {
  enabled?: boolean
}

/** GET /v1/communications/feedbacks — unanswered feedbacks by default. */
export function FeedbacksSection({ enabled = true }: FeedbacksSectionProps) {
  // isUnanswered=true surfaces the actionable queue (the read-only PR1 default).
  // Under this filter `total` is the unanswered-subset count (BE returns the
  // count under the active filter), so the label reads "Всего без ответа"
  // rather than implying the universe of feedbacks.
  const feedbacks = useFeedbacks({ isUnanswered: true }, { enabled })

  const handleRetry = useCallback(() => feedbacks.refetch(), [feedbacks])
  const rows = feedbacks.data?.rows ?? []
  const total = feedbacks.data?.total ?? 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" aria-hidden />
            Отзывы
          </span>
          <span className="text-xs font-normal text-muted-foreground" data-testid="feedbacks-count">
            Всего без ответа: {total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SectionState
          isLoading={feedbacks.isLoading}
          isError={feedbacks.isError}
          isEmpty={rows.length === 0}
          errorMessage={FEEDBACKS_ERROR_MESSAGE}
          emptyMessage={FEEDBACKS_EMPTY_MESSAGE}
          onRetry={handleRetry}
        >
          <ul className="divide-y divide-border">
            {rows.map(fb => (
              <FeedbackRow key={fb.id} feedback={fb} />
            ))}
          </ul>
        </SectionState>
      </CardContent>
    </Card>
  )
}

/** Render a feedback's rating as stars (nullable — AP#8: null → '—'). */
export function FeedbackRating({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={
            i < rating ? 'h-3.5 w-3.5 fill-yellow-500 text-yellow-500' : 'h-3.5 w-3.5 text-muted'
          }
          aria-hidden
        />
      ))}
    </span>
  )
}
