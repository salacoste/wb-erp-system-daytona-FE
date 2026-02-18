/**
 * Buyout Summary Widget
 * Epic 69: Progress bar with buyout/return rates + top decliners
 */

'use client'

import { useBuyoutSummary } from '@/hooks/use-buyout-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, TrendingDown } from 'lucide-react'
import type { BuyoutSource } from '@/types/analytics-epics-68-71'

interface BuyoutSummaryWidgetProps {
  from: string
  to: string
  source: BuyoutSource
}

export function BuyoutSummaryWidget({ from, to, source }: BuyoutSummaryWidgetProps) {
  const { data, isLoading, isError } = useBuyoutSummary(from, to, source)

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

  const buyoutPct = data.overallBuyoutRatePct ?? 0
  const returnPct = data.overallReturnRatePct ?? 0
  const decliners = data.topDecliners ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Процент выкупа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{buyoutPct.toFixed(1)}% выкуп</span>
            <span className="text-muted-foreground">{returnPct.toFixed(1)}% возвраты</span>
          </div>
          <div className="h-3 rounded-full bg-red-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.min(buyoutPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Возвраты: {data.totalReturnsCount.toLocaleString('ru-RU')} из{' '}
            {data.totalSalesCount.toLocaleString('ru-RU')} продаж
            {data.skuCount != null && ` (${data.skuCount} SKU)`}
          </p>
        </div>

        {/* Top decliners */}
        {decliners.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium text-red-600">
              <TrendingDown className="h-4 w-4" />
              Снижение выкупа
            </div>
            <div className="space-y-1">
              {decliners.map(d => (
                <div
                  key={d.nmId}
                  className="flex items-center justify-between text-sm text-muted-foreground"
                >
                  <span className="font-mono text-xs">#{d.nmId}</span>
                  <span>
                    {d.currentBuyoutRate != null ? `${d.currentBuyoutRate.toFixed(0)}%` : '—'}
                    <span className="text-red-500 ml-1">
                      ({d.declinePct > 0 ? '-' : ''}
                      {Math.abs(d.declinePct).toFixed(0)} п.п.)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
