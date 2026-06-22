'use client'

/**
 * SearchOrdersChart — daily time-series of search-attributed orders
 * Story 117.1-FE: Search Orders time-series chart
 *
 * Independent state machine (Multi-Source Orchestration Pattern 1, CLAUDE.md):
 * self-fetches groupBy='day' SEPARATELY from the table/summary (groupBy='query').
 * A chart-fetch failure must NOT blank the summary cards or the orders table —
 * the error/empty states stay contained inside this card.
 *
 * Revenue is intentionally EXCLUDED: Story 91.1-FE removed totalRevenue from the
 * search types (backend dropped it). Revenue restoration is Story 117.2's scope.
 * Pattern mirrors analytics/advertising/components/DailyTrendChart.tsx (Story 72.3-FE),
 * simplified to a single series + single counts Y-axis.
 */

import { useMemo, type ReactNode } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchOrders } from '@/hooks/use-search-analytics'
import { pluralize, DAY_FORMS } from '@/lib/russian-plural'
import type { SearchOrderItem } from '@/types/search-analytics'

interface SearchOrdersChartProps {
  from: string
  to: string
}

interface ChartRow {
  date: string
  totalOrders: number
}

const TITLE = 'Динамика поисковых заказов по дням'

/**
 * Format ISO day key (YYYY-MM-DD) to RU short label "DD.MM"; pass through if not
 * a date. Intentionally uses pure string-split, NOT `new Date()`, to stay
 * timezone-safe — `new Date('YYYY-MM-DD')` parses as UTC midnight and reading the
 * local date can shift the day backward in negative-offset zones. (Distinct from
 * advertising/daily-trend-config.ts `formatDailyDate`, which uses `new Date()`.)
 */
export function formatDayTick(value: string): string {
  const parts = value.split('-')
  // Require a plain YYYY-MM-DD: the day part must be exactly 2 digits, so an ISO
  // datetime ("2026-03-01T00:00:00") falls through rather than yielding a garbage
  // "01T00:00:00.03" label (Story 117.1-FE 3rd-pass F-5).
  if (parts.length === 3 && /^\d{2}$/.test(parts[2])) return `${parts[2]}.${parts[1]}`
  // Post-Story-119.1-FE: normalizer at the API boundary coerces numeric keys to
  // strings before reaching here; the regex below still handles 8-digit YYYYMMDD
  // strings defensively for any boundary-bypass path (defense-in-depth per
  // Story 119.1-FE).
  if (/^\d{8}$/.test(value)) return `${value.slice(6, 8)}.${value.slice(4, 6)}`
  return value
}

/**
 * Map day-grouped SearchOrderItem[] to chart rows. In groupBy='day' mode the item
 * `key` is the date string, but the type is `string | number`; we COERCE via
 * String() rather than filter on typeof (Story 117.1-FE 1st-pass F-1 origin).
 * We DO drop items whose key is null/undefined: `String(null)` would fabricate
 * a "null" axis label. `totalOrders` is numeric-coerced via `Number(...) || 0`
 * (3rd-pass F-2): a string "50" would otherwise reach recharts' numeric Y-axis
 * and mis-scale the line. `|| 0` also covers null (counts exception, AP#8).
 *
 * Boundary Normalizer attached at API layer per Story 119.1-FE
 * (src/lib/api/search-analytics-normalizer.ts) — this coerce remains as
 * defense-in-depth (CLAUDE.md § Defense-in-depth convention).
 */
export function toChartRows(items: SearchOrderItem[]): ChartRow[] {
  return items
    .filter(item => item.key != null)
    .map(item => ({ date: String(item.key), totalOrders: Number(item.totalOrders) || 0 }))
}

function tooltipNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0
}

function ChartShell({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{TITLE}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function SearchOrdersChart({ from, to }: SearchOrdersChartProps) {
  const { data, isLoading, isError } = useSearchOrders(from, to, { groupBy: 'day' })

  const prefersReducedMotion = useMemo(() => {
    // Guard matchMedia existence — jsdom (test env) does not implement it.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const rows = useMemo(() => toChartRows(data?.items ?? []), [data?.items])

  // Hoisted once (3rd-pass F-4): used by both the aria-label and the sr-only text —
  // computing in one place prevents the two accessibility strings from desyncing.
  const dayCountLabel = `${rows.length} ${pluralize(DAY_FORMS, rows.length)}`

  if (isLoading) {
    return (
      <ChartShell>
        {/* role=status/aria-busy parity with SearchOrdersOverview + the old tab (3rd-pass F-3). */}
        <div role="status" aria-busy="true">
          <Skeleton className="h-60 w-full md:h-72" />
        </div>
      </ChartShell>
    )
  }

  // Non-destructive: error OR empty renders a contained message — never throws to
  // the parent, so the summary cards + table (sibling source) stay visible (Pattern 1).
  if (isError || rows.length === 0) {
    return (
      <ChartShell>
        <p className="flex items-center justify-center py-12 text-muted-foreground">
          {isError
            ? 'Не удалось загрузить динамику поисковых заказов'
            : 'Нет ежедневных данных за выбранный период'}
        </p>
      </ChartShell>
    )
  }

  return (
    <ChartShell>
      <div role="img" aria-label={`${TITLE}: ${dayCountLabel}`} className="h-60 w-full md:h-72">
        <p className="sr-only">
          Линейный график показывает количество поисковых заказов за {dayCountLabel}
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 12, right: 16, bottom: 32, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayTick}
              tick={{ fontSize: 12, fill: '#757575' }}
              axisLine={{ stroke: '#EEEEEE' }}
              tickLine={{ stroke: '#EEEEEE' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#757575' }}
              axisLine={{ stroke: '#EEEEEE' }}
              tickLine={false}
              width={48}
            />
            <Tooltip
              formatter={value => [tooltipNumber(value).toLocaleString('ru-RU'), 'Заказы']}
              labelFormatter={label => formatDayTick(String(label ?? ''))}
            />
            <Line
              type="monotone"
              dataKey="totalOrders"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              animationDuration={prefersReducedMotion ? 0 : 300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  )
}
