/**
 * FBS Regional Data Section — Section 3 of 5
 * Epic 129-FE Story 129.2: single-bar chart matching real backend contract per Request #202.
 *
 * Fields renamed: regionName→region, orderShare→percentage.
 * Dropped: stockShare — merged into single percentage field.
 *
 * Pattern 2: recharts BarChart — single-bar region comparison.
 * Pattern 1: independent null/empty-state.
 *
 * Story 164.2: the tooltip boundary is now a typed adapter (see RegionalTooltip.tsx);
 * `RegionalTooltip` is re-exported here to keep the historical direct-unit-test import
 * path (`{ RegionalTooltip } from '../FbsRegionalDataSection'`) stable.
 */

'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatPercentage } from '@/lib/utils'
import type { FbsRegionalDataItem } from '@/types/fbs-enhanced'

// Epic 169.6: single-series regional bar color via chart token (169.4 single-source precedent)
const REGIONAL_BAR_COLOR = 'var(--color-chart-1)'
// Typed recharts tooltip adapter — replaces the prior `RegionalTooltip as any` cast
// (CLAUDE.md anti-pattern #4). Adapter narrows the opaque payload to {name,color,value}.
export { RegionalTooltip, regionalTooltipContent } from './RegionalTooltip'
import { regionalTooltipContent } from './RegionalTooltip'

interface FbsRegionalDataSectionProps {
  regionalData: FbsRegionalDataItem[] | null | undefined
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

  // Map null percentage to 0 only for chart rendering (chart library requires number);
  // tooltip uses original value (null → '—') per anti-pattern #8.
  const chartData = useMemo(
    () =>
      regions.map(r => ({
        region: r.region || '—',
        percentage: r.percentage ?? 0,
        // Keep original for tooltip null-safe display
        _percentageRaw: r.percentage,
      })),
    [regions]
  )

  return (
    <section aria-label="Региональное распределение" data-testid="fbs-regional-data-section">
      <h2 className="text-lg font-semibold mb-3">Региональное распределение</h2>
      <div className="rounded-md border bg-background p-4">
        {/* Epic 169.6: a11y data-alternative — non-hover access to tooltip data (sr-only, 169.4 precedent) */}
        <p className="sr-only">
          {`Данные по регионам: ${chartData
            .map(
              r =>
                `${r.region} — ${r._percentageRaw == null ? 'нет данных' : formatPercentage(r._percentageRaw)}`
            )
            .join(', ')}`}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="region"
              tick={{ fontSize: 11, fill: 'var(--color-chart-axis)' }}
              angle={-30}
              textAnchor="end"
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-chart-axis)' }}
              tickFormatter={v => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            {/* Typed adapter (RegionalTooltip.tsx) — no `as any` cast; payload narrowed to {name,color,value}. */}
            <Tooltip content={regionalTooltipContent} />
            <Bar
              dataKey="percentage"
              name="Доля (%)"
              fill={REGIONAL_BAR_COLOR}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
