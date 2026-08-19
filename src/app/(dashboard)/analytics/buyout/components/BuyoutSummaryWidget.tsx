/**
 * Buyout Summary Widget
 * Epic 69: Progress bar with buyout/return rates + top decliners
 * Story 127.4-FE: Added comparison period delta indicators
 * Sub-components: BuyoutDeclinersList
 */

'use client'

import { useBuyoutSummary } from '@/hooks/use-buyout-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { SourceBadge } from '@/components/custom/badges/SourceBadge'
import { formatPercentage } from '@/lib/utils'
import type { BuyoutSource, BuyoutSummaryResponse } from '@/types/analytics-buyout'
import type { ReturnBreakdown } from '@/types/fulfillment'
import { calculateBuyoutDelta } from './buyout-comparison-utils'
import { DeltaTag, ReturnBreakdownBar } from './BuyoutSummarySubComponents'
import { BuyoutDeclinersList } from './BuyoutDeclinersList'

interface BuyoutSummaryWidgetProps {
  from: string
  to: string
  source: BuyoutSource
  returnBreakdown?: ReturnBreakdown | null
  compareEnabled?: boolean
  compareFrom?: string
  compareTo?: string
}

export function BuyoutSummaryWidget({
  from,
  to,
  source,
  returnBreakdown,
  compareEnabled,
  compareFrom,
  compareTo,
}: BuyoutSummaryWidgetProps) {
  const { data, isLoading, isError } = useBuyoutSummary(from, to, source)

  // Comparison period data — Story 127.4-FE
  const hasCompare = compareEnabled && !!compareFrom && !!compareTo
  const { data: prevData, isLoading: prevLoading } = useBuyoutSummary(
    compareFrom ?? '',
    compareTo ?? '',
    source
  )

  if (isLoading) return <Skeleton className="h-40 w-full" />

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить сводку выкупов</AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const buyoutPct = data.overallBuyoutRatePct
  const returnPct = data.overallReturnRatePct
  const decliners = data.topDecliners ?? []

  // Comparison deltas
  const prevSummary: BuyoutSummaryResponse | undefined = hasCompare ? prevData : undefined
  const buyoutDelta = calculateBuyoutDelta(buyoutPct, prevSummary?.overallBuyoutRatePct ?? null)
  const returnDelta = calculateBuyoutDelta(returnPct, prevSummary?.overallReturnRatePct ?? null)
  const salesDelta = calculateBuyoutDelta(
    data.totalSalesCount,
    prevSummary?.totalSalesCount ?? null
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Процент выкупа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {buyoutPct != null ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {formatPercentage(buyoutPct)} выкуп
                  {hasCompare && (
                    <DeltaTag
                      delta={buyoutDelta}
                      field="overallBuyoutRatePct"
                      loading={prevLoading}
                    />
                  )}
                </span>
                <span className="text-muted-foreground">
                  {returnPct != null ? (
                    <>
                      {formatPercentage(returnPct)} возвраты
                      {hasCompare && (
                        <DeltaTag
                          delta={returnDelta}
                          field="overallReturnRatePct"
                          loading={prevLoading}
                        />
                      )}
                    </>
                  ) : (
                    '— возвраты'
                  )}
                </span>
              </div>
              {/* Epic 169.4: progress metric — status tokens (process, not financial);
                  track = error-tinted remainder, fill = success. */}
              <div className="h-3 rounded-full bg-status-error/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-status-success transition-all"
                  style={{ width: `${Math.min(buyoutPct, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Нет данных о выкупах за выбранный период
              </p>
              {returnPct != null && (
                <p className="mt-1 text-xs text-status-warning">
                  Возвраты: {formatPercentage(returnPct)} (процент выкупа недоступен)
                </p>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Возвраты (FBS): {data.totalReturnsCount.toLocaleString('ru-RU')} из{' '}
            {data.totalSalesCount.toLocaleString('ru-RU')} продаж
            {data.skuCount != null && ` (${data.skuCount} SKU)`}
            {hasCompare && (
              <DeltaTag delta={salesDelta} field="totalSalesCount" loading={prevLoading} />
            )}
          </p>
          <p className="text-xs text-muted-foreground/70">
            В таблице по SKU — все возвраты (FBO+FBS), включая оценочные
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Источник:</span>
            <SourceBadge source={data.source} />
          </div>
          {data.source === 'unknown' && (
            <p className="text-xs text-status-warning mt-1">
              * Источник данных не распознан backend&apos;ом. Возможна ошибка нормализации на
              стороне WB API.
            </p>
          )}
        </div>

        {returnBreakdown && returnBreakdown.total > 0 && (
          <ReturnBreakdownBar breakdown={returnBreakdown} />
        )}

        <BuyoutDeclinersList decliners={decliners} />
      </CardContent>
    </Card>
  )
}
