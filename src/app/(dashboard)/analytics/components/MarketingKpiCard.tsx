'use client'

/**
 * MarketingKpiCard — compact marketing overview for analytics hub.
 * Self-fetches search orders data and renders a single KPI card with
 * total search orders, search share, and top 3 keywords.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSearchOrders } from '@/hooks/use-search-analytics'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { truncateQuery } from '@/lib/string-utils'
import { BarChart3, Info } from 'lucide-react'
import type { SearchOrderItem, SearchOrdersSummary } from '@/types/search-analytics'

interface MarketingKpiCardProps {
  from: string
  to: string
}

/** Null-safe percent display (anti-pattern #8: null → em-dash). */
function displayPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return formatPercentage(value)
}

/** Get keyword text from item, truncated. key is `string | number` — numeric keys
 *  (nmId for groupBy=product) rendered via String() per anti-pattern #10, matching
 *  SearchPerformanceWidget's handling of the same contract field. */
function keywordText(item: SearchOrderItem | undefined): string {
  if (!item) return '—'
  return truncateQuery(String(item.key))
}

export function MarketingKpiCard({ from, to }: MarketingKpiCardProps) {
  const { data, isLoading, error } = useSearchOrders(from, to, { groupBy: 'query' })

  if (isLoading) {
    return (
      // role=status live region; sr-only text is the single announcement source
      // (no aria-label — avoids duplicate screen-reader announcement)
      <div role="status">
        <Skeleton className="h-40" />
        <span className="sr-only">Загрузка маркетинга</span>
      </div>
    )
  }

  // Graceful degradation — render nothing on error
  if (error) return null

  const summary: SearchOrdersSummary | undefined = data?.summary
  const items: SearchOrderItem[] = data?.items ?? []
  const topItem = items[0]
  const secondItem = items[1]
  const thirdItem = items[2]
  // Defensive Frontend: show BOTH raw and deduplicated share.
  // Raw share may exceed 100% due to WB multi-attribution. Deduplicated share is ≤100%.
  // Preserve raw value + show corrected figure alongside per Defensive Frontend Principle.
  const dedupShare = summary?.searchOrderShareDeduplicated
  const rawShare = summary?.searchOrderShare
  const hasDedup = dedupShare != null && rawShare != null && Math.abs(rawShare - dedupShare) > 0.5
  // A non-null-but-zero share with zero orders is not meaningful content → treat as empty.
  const hasData = (summary != null && summary.totalSearchOrders > 0) || items.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Маркетинг — обзор
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!hasData ? (
          <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
        ) : (
          <>
            {/* Main metric: total search orders + share */}
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">Поисковые заказы:</span>
              <span className="text-xl font-bold tabular-nums">
                {summary?.totalSearchOrders != null ? formatNumber(summary.totalSearchOrders) : '—'}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                ({displayPercent(summary?.searchOrderShare)} от всех)
                {summary?.searchOrderShareInflated === true && summary.searchOrderShare != null && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="inline-flex cursor-help text-muted-foreground"
                          aria-label="Доля превышает 100% из-за мультиатрибуции"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {hasDedup
                          ? `С учётом мультиатрибуции: ${displayPercent(dedupShare)} (без дублей)`
                          : 'WB может атрибутировать один заказ нескольким запросам — доля может превышать 100%'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            </div>

            {/* Top keyword */}
            <div className="text-sm">
              <span className="text-muted-foreground">Топ запрос: </span>
              <span className="font-medium">{keywordText(topItem)}</span>
            </div>

            {/* Divider */}
            <hr className="border-border" />

            {/* 2nd and 3rd keywords */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>2-й: {keywordText(secondItem)}</span>
              <span>3-й: {keywordText(thirdItem)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
