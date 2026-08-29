'use client'

/**
 * Seller Rating Card — displays WB seller valuation (0–5) and feedback count.
 * GET /v1/cabinets/:id/seller-rating — cached 1h, graceful degradation.
 */

import { Star, MessageSquare, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useSellerRating } from '@/hooks/useSellerRating'
import { SELLER_RATING_REASON_LABELS } from '@/types/cabinet'

function RatingStars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value))
  return (
    <div className="flex items-center gap-1" aria-label={`Рейтинг: ${clamped} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`h-5 w-5 ${i < Math.round(clamped) ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="ml-2 text-lg font-semibold">{clamped.toFixed(1)}</span>
    </div>
  )
}

export function SellerRatingCard({ cabinetId }: { cabinetId: string }) {
  const { data, isLoading } = useSellerRating(cabinetId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2 text-lg">
            <Star aria-hidden="true" className="h-5 w-5" />
            Рейтинг продавца
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className="space-y-3"
            role="status"
            aria-label="Загрузка рейтинга продавца"
            aria-busy="true"
          >
            <span className="sr-only">Загружаем рейтинг продавца</span>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        ) : data ? (
          <>
            {data.available === false && (
              <Alert
                role="status"
                aria-live="polite"
                className="mb-4 border-status-warning/40 bg-status-warning/10"
              >
                <AlertTriangle aria-hidden="true" className="h-4 w-4 text-status-warning" />
                <AlertDescription>
                  Рейтинг недоступен:{' '}
                  {(data.reason && SELLER_RATING_REASON_LABELS[data.reason]) ??
                    'неизвестная ошибка'}
                </AlertDescription>
              </Alert>
            )}
            {data.available && data.valuation !== null && (
              <div className="space-y-3">
                <RatingStars value={data.valuation} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{data.feedbackCount ?? 0} отзывов</span>
                </div>
              </div>
            )}
            {data.available && data.valuation === null && (
              <p className="text-sm text-muted-foreground">Рейтинг пока отсутствует</p>
            )}
          </>
        ) : (
          <Alert role="status" aria-live="polite">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 text-status-warning" />
            <AlertDescription>
              Рейтинг продавца сейчас недоступен. Проверьте токен WB или повторите позже.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
