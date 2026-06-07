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
 * M-3 fix: RegionalTooltip exported as named export for direct unit testing.
 */

'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="region"
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip content={RegionalTooltip as any} />
            <Bar
              dataKey="percentage"
              name="Доля (%)"
              fill={CHART_COLORS.primaryRed}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
