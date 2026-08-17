/**
 * SearchPerformanceWidget — Compact mini-widget for analytics hub dashboard.
 * Shows search order count, sparkline trend, search share, and top 3 keywords.
 * Pattern 1 (Multi-Source Orchestration): two independent hooks, graceful degradation.
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchOrders } from '@/hooks/use-search-analytics'
import { truncateQuery } from '@/lib/string-utils'
import { formatPercentage } from '@/lib/utils'
import type { SearchOrderItem, SearchOrdersSummary } from '@/types/search-analytics'

/**
 * Convert daily SearchOrderItems to an SVG polyline `d` attribute.
 * Maps totalOrders to a 100×30 viewport (max→30, min→0).
 * Returns empty string when < 2 data points (sparkline needs a line).
 */
export function sparklinePath(items: SearchOrderItem[]): string {
  const valid = items.filter(i => i.key != null)
  if (valid.length < 2) return ''

  const values = valid.map(i => i.totalOrders)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = valid.map((item, idx) => {
    const x = (idx / (valid.length - 1)) * 100
    const y = 30 - ((item.totalOrders - min) / range) * 30
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return `M ${points.join(' L ')}`
}

/** Null-safe percent display (anti-pattern #8: null → em-dash, never fabricate 0). */
function displayPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return formatPercentage(value)
}

/** Null-safe count display with Russian locale. */
function displayCount(value: number | undefined): string {
  if (value === undefined) return '—'
  return value.toLocaleString('ru-RU')
}

/** Top 3 keywords from query-grouped items, truncated. */
function topKeywords(items: SearchOrderItem[] | undefined): string {
  if (!items || items.length === 0) return '—'
  return items
    .slice(0, 3)
    .map(i => truncateQuery(String(i.key)))
    .join(', ')
}

export function SearchPerformanceWidget({ from, to }: { from: string; to: string }) {
  const queryHook = useSearchOrders(from, to, { groupBy: 'query' })
  const dayHook = useSearchOrders(from, to, { groupBy: 'day' })

  // Loading state — compact skeleton
  if (queryHook.isLoading || dayHook.isLoading) {
    return <Skeleton className="h-32" />
  }

  // Error state — graceful degradation (render nothing, don't blank the page)
  if (queryHook.error || dayHook.error) {
    return null
  }

  const summary: SearchOrdersSummary | undefined = queryHook.data?.summary
  const queryItems: SearchOrderItem[] = queryHook.data?.items ?? []
  const dayItems: SearchOrderItem[] = dayHook.data?.items ?? []

  const path = sparklinePath(dayItems)

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header: icon + title + total count */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {'\u{1F50D}'} Поисковые заказы
          </span>
          <span className="text-lg font-bold tabular-nums">
            {displayCount(summary?.totalSearchOrders)}
          </span>
        </div>

        {/* Sparkline */}
        <div className="my-2">
          {path ? (
            <svg
              viewBox="0 0 100 30"
              className="h-8 w-full"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={path} stroke="var(--color-chart-1)" fill="none" strokeWidth="1.5" />
            </svg>
          ) : (
            <div className="h-8" />
          )}
        </div>

        {/* Footer: share + top keywords */}
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>Доля поиска: {displayPercent(summary?.searchOrderShare)}</span>
          <span className="truncate">Топ: {topKeywords(queryItems)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
