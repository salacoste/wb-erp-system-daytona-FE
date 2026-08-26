'use client'

/**
 * Top Keywords by Orders widget
 * Story 117.4-FE: 3rd Pattern-1 sibling in SearchOrdersTab. Ranks top-N queries by
 * totalOrders desc, sourced from useSearchOrders(groupBy='query'). TanStack Query
 * dedupes the shared query-cache key with SearchOrdersOverview — 2 component
 * callers = 1 HTTP request, shared cache. Independent state machine per Pattern 1:
 * a failure here NEVER blanks the chart/overview, and vice versa.
 *
 * Re-scoped from "by Revenue" → "by Orders" after Story 117.2-FE Branch A
 * live-verified the backend returns no search revenue.
 */

import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchOrders } from '@/hooks/use-search-analytics'
import { formatNumber } from '@/lib/utils'
import { pluralize, PRODUCT_FORMS } from '@/lib/russian-plural'
import type { SearchOrderItem } from '@/types/search-analytics'

interface TopKeywordsByOrdersCardProps {
  from: string
  to: string
  n?: number
}

const TITLE = 'Топ-запросы по заказам'
const EMPTY = 'Нет данных за выбранный период'
const LOADING = 'Загрузка топ-запросов'
const ERROR = 'Не удалось загрузить топ-запросы'

/**
 * Pure: pick top-N items by totalOrders desc.
 *
 * Defensive Frontend stance — FILTER, don't coerce: we drop items whose `key` is
 * not a string. Rationale: this widget renders `key` as a user-facing query LABEL,
 * unlike Story 117.1-FE's `toChartRows` which COERCES via `String(...)` because
 * the chart X-axis is purely visual. Both stances are correct in their context.
 *
 * Defense-in-depth — Story 119.1-FE normalizer at API layer
 * (src/lib/api/search-analytics-normalizer.ts) now absorbs the same case; this
 * filter is redundant-but-harmless post-119.1, kept for component-level resilience.
 *
 * Sort is stable per the ECMAScript 2019 spec (V8, SpiderMonkey, JSC all comply);
 * we rely on engine-level stability rather than decorate-sort-undecorate ceremony
 * (Story 117.4-FE Pass-1 M-3 simplification).
 *
 * Edge cases:
 *  - undefined / null items → []
 *  - !(n > 0) → [] (covers n<=0 AND NaN; `NaN > 0` is false, so the guard catches
 *    NaN without an extra Number.isFinite() check — Story 117.4-FE Pass-1 L-1)
 *  - all items filtered out → []
 *  - n larger than items.length → returns all (no error)
 */
export function pickTopByOrders(
  items: SearchOrderItem[] | undefined,
  n: number = 10
): SearchOrderItem[] {
  if (!items || !(n > 0)) return []
  return [...items.filter(item => typeof item.key === 'string')]
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, n)
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{TITLE}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function TopKeywordsByOrdersCard({ from, to, n = 10 }: TopKeywordsByOrdersCardProps) {
  const { data, isLoading, isError } = useSearchOrders(from, to, { groupBy: 'query' })

  if (isLoading) {
    return (
      <CardShell>
        <div role="status" aria-busy="true">
          <span className="sr-only">{LOADING}</span>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </CardShell>
    )
  }

  // Error → render the card chrome with an error message rather than returning
  // null (Story 117.4-FE Pass-1 H-1, Defensive Frontend Principle): "indicate,
  // don't hide" — and stay consistent with sibling Chart/Overview, both of which
  // render their error inside their card chrome.
  if (isError) {
    return (
      <CardShell>
        <p className="py-6 text-center text-sm text-muted-foreground">{ERROR}</p>
      </CardShell>
    )
  }

  const top = pickTopByOrders(data?.items, n)
  if (top.length === 0) {
    return (
      <CardShell>
        <p className="py-6 text-center text-sm text-muted-foreground">{EMPTY}</p>
      </CardShell>
    )
  }

  return (
    <CardShell>
      <ol className="space-y-2">
        {top.map((item, idx) => {
          // pickTopByOrders' filter guarantees `key` is a string here; index
          // prefix makes the React key collision-safe even if the backend ever
          // returns duplicate queries (Story 117.4-FE Pass-1 L-2 correctness).
          const query = item.key as string
          return (
            <li
              key={`${idx}-${query}`}
              className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
            >
              {/* `title` is a hover-only affordance — `textContent` carries the
                  full query, so screen readers get it regardless of CSS truncate
                  (Story 117.4-FE Pass-1 L-1 cleanup acknowledgement). */}
              <span className="truncate font-medium text-foreground" title={query}>
                {query}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                <span className="font-semibold text-foreground">
                  {formatNumber(item.totalOrders)}
                </span>
                {item.uniqueProducts != null && (
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(item.uniqueProducts)}{' '}
                    {pluralize(PRODUCT_FORMS, item.uniqueProducts)}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </CardShell>
  )
}
