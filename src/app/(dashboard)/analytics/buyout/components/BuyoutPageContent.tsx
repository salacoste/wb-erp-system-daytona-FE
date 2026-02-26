/**
 * Buyout Page orchestrator
 * Epic 69: Buyout Rate Analytics
 */

'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { useFulfillmentSummary } from '@/hooks/useFulfillment'
import type { DateRange } from '@/types/date-range'
import type { BuyoutSource } from '@/types/analytics-buyout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BuyoutSummaryWidget } from './BuyoutSummaryWidget'
import { BuyoutTable } from './BuyoutTable'

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

const SOURCE_OPTIONS: { value: BuyoutSource; label: string }[] = [
  { value: 'blended', label: 'Комбинированный' },
  { value: 'weekly', label: 'Еженедельный отчёт' },
  { value: 'realtime', label: 'Реалтайм' },
]

export function BuyoutPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [source, setSource] = useState<BuyoutSource>('blended')

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

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
      <div className="flex items-center gap-4 flex-wrap">
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
      </div>

      {/* Summary widget */}
      <BuyoutSummaryWidget
        from={apiFrom}
        to={apiTo}
        source={source}
        returnBreakdown={returnBreakdown}
      />

      {/* Per-SKU table */}
      <BuyoutTable from={apiFrom} to={apiTo} source={source} />
    </div>
  )
}
