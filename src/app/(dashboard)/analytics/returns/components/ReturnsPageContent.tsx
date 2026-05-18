/**
 * Returns Page orchestrator
 * Epic 70-FE: Returns Analytics
 * See docs/epics/epic-70-fe-returns-analytics.md (Numbering History for rename trail).
 */

'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import type { DateRange } from '@/types/date-range'
import { ReturnsSummaryCards } from './ReturnsSummaryCards'
import { ReturnReasonsPieChart } from './ReturnReasonsPieChart'
import { ReturnsTable } from './ReturnsTable'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function ReturnsPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [anomalyOnly, setAnomalyOnly] = useState(false)

  const apiFrom = dateRange ? formatApi(dateRange.from) : undefined
  const apiTo = dateRange ? formatApi(dateRange.to) : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Аналитика возвратов</h1>
        <p className="text-muted-foreground mt-1">Причины возвратов и аномалии по SKU</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="returns-date-range"
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={anomalyOnly}
            onChange={e => setAnomalyOnly(e.target.checked)}
            className="rounded border-gray-300"
            aria-labelledby="returns-anomaly-label"
          />
          <span id="returns-anomaly-label">Только проблемные</span>
        </label>
      </div>

      {/* Summary cards */}
      <ReturnsSummaryCards from={apiFrom} to={apiTo} />

      {/* Pie chart */}
      <ReturnReasonsPieChart from={apiFrom} to={apiTo} />

      {/* Per-SKU table */}
      <ReturnsTable from={apiFrom} to={apiTo} anomalyOnly={anomalyOnly} />
    </div>
  )
}
