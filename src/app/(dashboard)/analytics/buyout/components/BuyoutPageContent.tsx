/**
 * Buyout Page orchestrator
 * Epic 69: Buyout Rate Analytics
 * Story 127.4-FE: Added comparison period support
 */

'use client'

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { ComparisonPeriodSelector } from '@/components/custom/ComparisonPeriodSelector'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportBuyoutToCsv } from '@/lib/csv/buyout-csv-export'
import { useFulfillmentSummary } from '@/hooks/useFulfillment'
import { useBuyoutBySku } from '@/hooks/use-buyout-analytics'
import type { DateRange } from '@/types/date-range'
import type { BuyoutSource } from '@/types/analytics-buyout'
import type { ComparisonPreset } from '@/components/custom/comparison-period/comparison-period-types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BuyoutSummaryWidget } from './BuyoutSummaryWidget'
import { BuyoutTable } from './BuyoutTable'
import { BuyoutTrendChart } from './BuyoutTrendChart'
import { calculatePreviousPeriod } from './buyout-comparison-utils'

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

function toIsoWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

const SOURCE_OPTIONS: { value: BuyoutSource; label: string }[] = [
  { value: 'blended', label: 'Комбинированный' },
  { value: 'weekly', label: 'Еженедельный отчёт' },
  { value: 'realtime', label: 'Реалтайм' },
]

export function BuyoutPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [source, setSource] = useState<BuyoutSource>('blended')
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPreset>('previous')
  const [compareStart, setCompareStart] = useState('')
  const [compareEnd, setCompareEnd] = useState('')

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  // CSV export: fetch all buyout items (no pagination) for download
  const { data: exportBuyoutData } = useBuyoutBySku(apiFrom, apiTo, {
    source,
    limit: 10000,
  })
  const exportItems = exportBuyoutData?.data ?? []
  const csvContent = useMemo(() => exportBuyoutToCsv(exportItems), [exportItems])
  const csvFileName = `buyout-${apiFrom}-${apiTo}.csv`

  // Calculate comparison period
  const comparePeriod = useMemo(() => {
    if (!comparisonEnabled || !apiFrom || !apiTo) return null
    return calculatePreviousPeriod(apiFrom, apiTo)
  }, [comparisonEnabled, apiFrom, apiTo])

  const handleCompareRangeChange = (start: string, end: string) => {
    setCompareStart(start)
    setCompareEnd(end)
  }

  // Fulfillment summary for FBS return breakdown
  const { data: fulfillmentData } = useFulfillmentSummary(apiFrom, apiTo)
  const returnBreakdown = fulfillmentData?.summary?.fbs?.returnBreakdown ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Аналитика выкупов</h1>
        <p className="text-muted-foreground mt-1">Процент выкупа и тренды по SKU</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="buyout-date-range"
        />
        <Select value={source} onValueChange={val => setSource(val as BuyoutSource)}>
          <SelectTrigger className="w-[200px]" aria-label="Источник данных">
            <SelectValue placeholder="Источник данных" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ExportCsvButton
          csvContent={csvContent}
          fileName={csvFileName}
          label="Скачать CSV"
          disabled={exportItems.length === 0}
        />
      </div>

      {/* Comparison Period Selector — Story 127.4-FE */}
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

      {/* Summary widget with optional comparison data */}
      <BuyoutSummaryWidget
        from={apiFrom}
        to={apiTo}
        source={source}
        returnBreakdown={returnBreakdown}
        compareEnabled={comparisonEnabled}
        compareFrom={comparePeriod?.prevFrom ?? ''}
        compareTo={comparePeriod?.prevTo ?? ''}
      />

      {/* Buyout rate trend chart (buyout daily API) */}
      <BuyoutTrendChart from={apiFrom} to={apiTo} />

      {/* Per-SKU table */}
      <BuyoutTable from={apiFrom} to={apiTo} source={source} />
    </div>
  )
}
