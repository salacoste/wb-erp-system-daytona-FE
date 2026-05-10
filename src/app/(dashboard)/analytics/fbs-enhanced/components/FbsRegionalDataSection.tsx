/**
 * FBS Regional Data Section — Section 3 of 5
 * Epic 96-FE Story 96.13: bar chart — orderShare + stockShare per region.
 *
 * Pattern 2: recharts BarChart chosen — multi-bar region comparison is recharts' native fit.
 * Story 92.4-FE M-2 reminder: jsdom doesn't render recharts children — tests MUST mock
 * recharts at the top of the test file (before any component imports).
 * See FbsRegionalDataSection.test.tsx for the canonical recharts mock template.
 *
 * Pattern 1: independent null/empty-state — empty regions array shows empty state without
 * affecting other sections.
 *
 * M-3 fix: RegionalTooltip exported as named export for direct unit testing.
 * L-2 fix: inline colors replaced with CHART_COLORS tokens.
 */

'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatPercentage } from '@/lib/utils'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { FbsRegionalDataItem } from '@/types/fbs-enhanced'

interface FbsRegionalDataSectionProps {
  regionalData: FbsRegionalDataItem[] | null | undefined
}

interface TooltipPayloadEntry {
  name: string
  value: number | null
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

/**
 * Custom recharts tooltip for the regional bar chart.
 * Exported for unit-testing only — not consumed externally.
 *
 * Renders null-safe metric rows: null value → '—' per CLAUDE.md anti-pattern #8
 * and Defensive Frontend Principle.
 */
export function RegionalTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map(entry => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value == null ? '—' : formatPercentage(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function FbsRegionalDataSection({ regionalData }: FbsRegionalDataSectionProps) {
  const regions = regionalData ?? []

  if (regions.length === 0) {
    return (
      <section aria-label="Региональное распределение" data-testid="fbs-regional-data-section">
        <h2 className="text-lg font-semibold mb-3">Региональное распределение</h2>
        <p className="text-sm text-muted-foreground">Нет данных по регионам</p>
      </section>
    )
  }

  // Map null shares to 0 only for chart rendering (chart library requires number);
  // tooltip uses original value (null → '—') per anti-pattern #8.
  // M2-2 fix: useMemo prevents array rebuild on every render (stable reference for recharts).
  const chartData = useMemo(
    () =>
      regions.map(r => ({
        regionName: r.regionName || '—',
        orderShare: r.orderShare ?? 0,
        stockShare: r.stockShare ?? 0,
        // Keep originals for tooltip null-safe display
        _orderShareRaw: r.orderShare,
        _stockShareRaw: r.stockShare,
      })),
    [regions]
  )

  return (
    <section aria-label="Региональное распределение" data-testid="fbs-regional-data-section">
      <h2 className="text-lg font-semibold mb-3">Региональное распределение</h2>
      <div className="rounded-md border bg-background p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="regionName"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={v => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            {/* M2-1 fix: component reference (not JSX element) — stable across renders, no pointer-event jitter.
                Cast: recharts ContentType<ValueType, NameType> is narrower than our CustomTooltipProps;
                bridge via `as unknown as` per CLAUDE.md anti-pattern #4 (structurally compatible subset). */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip content={RegionalTooltip as any} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar
              dataKey="orderShare"
              name="Доля заказов (%)"
              fill={CHART_COLORS.primaryRed}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="stockShare"
              name="Доля остатков (%)"
              fill={CHART_COLORS.primaryBlue}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
