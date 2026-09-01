'use client'

/**
 * Bid Recommendations Card — displays competitive, leaders, top-2 bids
 * Story 86.1: Campaign bid optimization
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { useBidRecommendations } from '@/hooks/useBidRecommendations'
import { formatCurrency } from '@/lib/utils'
import type { KeywordBidRange } from '@/types/bid-recommendations'

/** Module-level color map (avoids per-render allocation).
 *  Story 170.2: semantic matched pairs (tint /15 + border /30, canon 169.5/170.1);
 *  default tier stays neutral muted (never read as "healthy green"). */
export const BID_LEVEL_COLORS = {
  default: 'bg-muted/50 border-border',
  blue: 'bg-status-information/15 border-status-information/30',
  green: 'bg-status-success/15 border-status-success/30',
} as const

type BidLevelVariant = keyof typeof BID_LEVEL_COLORS

/** Format relative cache age for "Обновлено X мин назад" indicator */
function formatCacheAge(cachedAt?: string): string | null {
  if (!cachedAt) return null
  const cached = new Date(cachedAt).getTime()
  if (!Number.isFinite(cached)) return null
  const ageMs = Date.now() - cached
  const ageMin = Math.floor(ageMs / 60_000)
  if (ageMin < 1) return 'только что'
  if (ageMin < 60) return `${ageMin} мин назад`
  const ageHours = Math.floor(ageMin / 60)
  return `${ageHours} ч назад`
}

interface BidRecommendationsCardProps {
  /** Cabinet UUID — used for the API request path */
  cabinetId: string
  /** WB advertising campaign ID (advertId in WB API) */
  advertId: number
  /** Optional WB nomenclature ID — when absent, the card shows a "select product" empty state */
  nmId?: number
}

export function BidRecommendationsCard({ cabinetId, advertId, nmId }: BidRecommendationsCardProps) {
  const { data, isLoading, isError } = useBidRecommendations(cabinetId, advertId, nmId)

  if (!nmId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Рекомендации по ставкам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Выберите товар (nmId) для получения рекомендаций по ставкам
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Рекомендации по ставкам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Не удалось загрузить рекомендации</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const { recommendations, keywords } = data
  const cacheAge = formatCacheAge(data.cachedAt)
  const recommendationValues = [
    recommendations.competitive,
    recommendations.leaders,
    recommendations.top2,
  ]
  const hasRecommendation = recommendationValues.some(value => Number.isFinite(value) && value > 0)

  if (!hasRecommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Рекомендации по ставкам
          </CardTitle>
          <CardDescription>Товар: {nmId}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Для этого товара пока нет доступных рекомендаций по ставкам.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
          Рекомендации по ставкам
        </CardTitle>
        <CardDescription>
          Товар: {nmId}
          {cacheAge && <span className="ml-2 text-xs">· обновлено {cacheAge}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <BidLevel label="Конкурентная" value={recommendations.competitive} variant="default" />
          <BidLevel label="Лидеры" value={recommendations.leaders} variant="blue" />
          <BidLevel label="Топ-2" value={recommendations.top2} variant="green" />
        </div>

        {keywords && keywords.length > 0 && (
          <div aria-labelledby="bid-keywords-heading">
            <h4
              id="bid-keywords-heading"
              className="mb-3 text-sm font-medium text-muted-foreground"
            >
              Диапазоны ставок по ключевым словам
            </h4>
            <div className="space-y-2">
              {keywords.map(kw => (
                <KeywordRow key={kw.keyword} data={kw} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BidLevel({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: BidLevelVariant
}) {
  const isInvalid = !Number.isFinite(value) || value <= 0
  return (
    <div className={`rounded-lg border p-3 ${BID_LEVEL_COLORS[variant]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">
        {isInvalid ? <span className="text-muted-foreground">—</span> : formatCurrency(value)}
      </p>
    </div>
  )
}

function KeywordRow({ data }: { data: KeywordBidRange }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
      <span className="truncate font-medium">{data.keyword}</span>
      <div className="flex items-center gap-2">
        {/* iter-70: guard ≤0 → "—" (consistent with BidLevel) so an absent reach tier (normalized
            to 0) shows "—" not a misleading "0 ₽" (anti-pattern #8). */}
        <span className="text-muted-foreground">
          {data.minBid > 0 ? formatCurrency(data.minBid) : '—'} —{' '}
          {data.maxBid > 0 ? formatCurrency(data.maxBid) : '—'}
        </span>
        <Badge variant="outline" className="text-xs">
          {data.recommendedBid > 0 ? formatCurrency(data.recommendedBid) : '—'}
        </Badge>
      </div>
    </div>
  )
}
