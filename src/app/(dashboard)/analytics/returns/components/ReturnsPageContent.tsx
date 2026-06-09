/**
 * Returns Page orchestrator
 * Epic 70-FE: Returns Analytics, Story 127.5-FE (comparison period selector)
 * See docs/epics/epic-70-fe-returns-analytics.md (Numbering History for rename trail).
 */

'use client'

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { ComparisonPeriodSelector } from '@/components/custom/ComparisonPeriodSelector'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportReturnsToCsv } from '@/lib/csv/returns-csv-export'
import { useReturnsBySku } from '@/hooks/use-return-analytics'
import type { DateRange } from '@/types/date-range'
import type { ComparisonPreset } from '@/components/custom/comparison-period/comparison-period-types'
import { ReturnsSummaryCards } from './ReturnsSummaryCards'
import { ReturnReasonsPieChart } from './ReturnReasonsPieChart'
import { ReturnTrendChart } from './ReturnTrendChart'
import { ReturnsTable } from './ReturnsTable'
import { calculatePreviousPeriod } from './returns-comparison-utils'

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

/** ISO week string for ComparisonPeriodSelector (mirrors buyout page pattern). */
function toIsoWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function ReturnsPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [anomalyOnly, setAnomalyOnly] = useState(false)
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPreset>('previous')
  const [compareStart, setCompareStart] = useState('')
  const [compareEnd, setCompareEnd] = useState('')

  const apiFrom = dateRange ? formatApi(dateRange.from) : undefined
  const apiTo = dateRange ? formatApi(dateRange.to) : undefined

  // CSV export: fetch all return items for download
  const { data: exportReturnsData } = useReturnsBySku(apiFrom, apiTo, { limit: 10000 })
  const exportItems = exportReturnsData?.data ?? []
  const csvContent = useMemo(() => exportReturnsToCsv(exportItems), [exportItems])
  const csvFileName = `returns-${apiFrom ?? 'all'}-${apiTo ?? 'all'}.csv`

  const comparePeriod = useMemo(() => {
    if (!comparisonEnabled || !apiFrom || !apiTo) return null
    return calculatePreviousPeriod(apiFrom, apiTo)
  }, [comparisonEnabled, apiFrom, apiTo])

  const handleCompareRangeChange = (start: string, end: string) => {
    setCompareStart(start)
    setCompareEnd(end)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Аналитика возвратов</h1>
        <p className="text-muted-foreground mt-1">Причины возвратов и аномалии по SKU</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
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
        <ExportCsvButton
          csvContent={csvContent}
          fileName={csvFileName}
          label="Скачать CSV"
          disabled={exportItems.length === 0}
        />
      </div>

      {/* Comparison Period Selector — Story 127.5-FE */}
      <ComparisonPeriodSelector
        enabled={comparisonEnabled}
        onEnabledChange={setComparisonEnabled}
        preset={comparisonPreset}
        onPresetChange={setComparisonPreset}
        compareStart={compareStart}
        compareEnd={compareEnd}
        onCompareRangeChange={handleCompareRangeChange}
        currentPeriodStart={dateRange ? toIsoWeek(dateRange.from) : ''}
        currentPeriodEnd={dateRange ? toIsoWeek(dateRange.to) : ''}
      />

      {/* Summary cards with optional comparison data */}
      <ReturnsSummaryCards
        from={apiFrom}
        to={apiTo}
        compareEnabled={comparisonEnabled}
        compareFrom={comparePeriod?.prevFrom ?? ''}
        compareTo={comparePeriod?.prevTo ?? ''}
      />

      {/* Daily return trend chart */}
      <ReturnTrendChart from={apiFrom} to={apiTo} />

      {/* Pie chart */}
      <ReturnReasonsPieChart from={apiFrom} to={apiTo} />

      {/* Per-SKU table */}
      <ReturnsTable from={apiFrom} to={apiTo} anomalyOnly={anomalyOnly} />
    </div>
  )
}
