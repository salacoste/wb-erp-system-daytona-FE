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
          className={`h-5 w-5 ${i < Math.round(clamped) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5" />
          Рейтинг продавца
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        ) : data ? (
          <>
            {data.available === false && (
              <Alert className="mb-4 border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
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
        ) : null}
      </CardContent>
    </Card>
  )
}
