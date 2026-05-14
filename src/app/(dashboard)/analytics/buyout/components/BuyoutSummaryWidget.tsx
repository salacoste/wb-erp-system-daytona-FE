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
import { SourceBadge } from '@/components/custom/badges/SourceBadge'
import type { BuyoutSource } from '@/types/analytics-buyout'
import type { ReturnBreakdown } from '@/types/fulfillment'

interface BuyoutSummaryWidgetProps {
  from: string
  to: string
  source: BuyoutSource
  returnBreakdown?: ReturnBreakdown | null
}

export function BuyoutSummaryWidget({
  from,
  to,
  source,
  returnBreakdown,
}: BuyoutSummaryWidgetProps) {
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
            Возвраты (FBS): {data.totalReturnsCount.toLocaleString('ru-RU')} из{' '}
            {data.totalSalesCount.toLocaleString('ru-RU')} продаж
            {data.skuCount != null && ` (${data.skuCount} SKU)`}
          </p>
          <p className="text-xs text-muted-foreground/70">
            В таблице по SKU — все возвраты (FBO+FBS), включая оценочные
          </p>
          {/* Story 96.15-FE: section-level source badge — summary data comes from one source */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Источник:</span>
            <SourceBadge source={data.source} />
          </div>
          {/* H2-1 fix: Defensive Frontend Principle "show an indicator" full recipe —
              footnote required when anomalous 'unknown' source surfaces (icon alone insufficient).
              Backend resolved in Epic 106 (request #169 § 1.3); guard kept for defense-in-depth
              per CLAUDE.md § Defensive Frontend Principle. */}
          {data.source === 'unknown' && (
            <p className="text-xs text-amber-700 mt-1">
              * Источник данных не распознан backend&apos;ом. Возможна ошибка нормализации на
              стороне WB API.
            </p>
          )}
        </div>

        {/* Return reasons breakdown (FBS) */}
        {returnBreakdown && returnBreakdown.total > 0 && (
          <ReturnBreakdownBar breakdown={returnBreakdown} />
        )}

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
                    {d.buyoutRatePct != null ? `${d.buyoutRatePct.toFixed(0)}%` : '—'}
                    <span className="text-red-500 ml-1">
                      ({d.trendDelta < 0 ? '' : '-'}
                      {Math.abs(d.trendDelta).toFixed(0)} п.п.)
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

const REASON_COLORS = [
  { key: 'cancelBeforeShipment', label: 'До отправки', bg: 'bg-blue-500', text: 'text-blue-600' },
  { key: 'refusalAtPvz', label: 'Отказ на ПВЗ', bg: 'bg-orange-500', text: 'text-orange-600' },
  { key: 'returnAfterReceipt', label: 'После получения', bg: 'bg-red-500', text: 'text-red-600' },
] as const

function ReturnBreakdownBar({ breakdown }: { breakdown: ReturnBreakdown }) {
  const total = breakdown.total
  const segments = REASON_COLORS.map(c => ({
    ...c,
    count: breakdown[c.key],
    pct: total > 0 ? (breakdown[c.key] / total) * 100 : 0,
  }))

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Причины возвратов (FBS)</p>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
        {segments.map(s =>
          s.pct > 0 ? (
            <div key={s.key} className={`h-full ${s.bg}`} style={{ width: `${s.pct}%` }} />
          ) : null
        )}
      </div>
      <div className="flex gap-4 text-xs">
        {segments.map(s => (
          <span key={s.key} className={s.text}>
            {s.label}: {s.count}
          </span>
        ))}
      </div>
      {breakdown.classificationCoverage < 100 && (
        <p className="text-xs text-muted-foreground">
          Покрытие классификации: {breakdown.classificationCoverage}%
        </p>
      )}
    </div>
  )
}
