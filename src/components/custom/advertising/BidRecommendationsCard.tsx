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

interface BidRecommendationsCardProps {
  cabinetId: string
  advertId: number
  nmId?: number
}

export function BidRecommendationsCard({ cabinetId, advertId, nmId }: BidRecommendationsCardProps) {
  const { data, isLoading, isError } = useBidRecommendations(cabinetId, advertId, nmId)

  if (!nmId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
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
            <TrendingUp className="h-5 w-5" />
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Рекомендации по ставкам
        </CardTitle>
        <CardDescription>Товар: {data.nmId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <BidLevel label="Конкурентная" value={recommendations.competitive} variant="default" />
          <BidLevel label="Лидеры" value={recommendations.leaders} variant="blue" />
          <BidLevel label="Топ-2" value={recommendations.top2} variant="green" />
        </div>

        {keywords && keywords.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
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
  variant: 'default' | 'blue' | 'green'
}) {
  const colors = {
    default: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
  }
  return (
    <div className={`rounded-lg border p-3 ${colors[variant]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{formatCurrency(value)}</p>
    </div>
  )
}

function KeywordRow({ data }: { data: KeywordBidRange }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
      <span className="truncate font-medium">{data.keyword}</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">
          {formatCurrency(data.minBid)} — {formatCurrency(data.maxBid)}
        </span>
        <Badge variant="outline" className="text-xs">
          {formatCurrency(data.recommendedBid)}
        </Badge>
      </div>
    </div>
  )
}
