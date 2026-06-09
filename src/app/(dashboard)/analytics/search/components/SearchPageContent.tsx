'use client'

/**
 * Search Analytics page content
 * Story 71.4-FE: Page scaffold with RequireJam gating and 4-tab layout
 * Story 71.5-FE: Date range + SearchOrdersTab
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 * Story 71.7-FE: By-Query Product Ranking Tab
 * Story 117.3-FE: Seller profile badge in page header
 * Story 119.2-FE Pass-1 F-1: optional `initialQuery` from `?query=` URL param —
 * when present, defaults to the by-query tab and pre-populates the query input
 * (closes the silent-drop on Funnel "Топ поисковых запросов" cross-page links).
 */

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { RequireJam } from '@/components/custom/jam/RequireJam'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { ComparisonPeriodSelector } from '@/components/custom/ComparisonPeriodSelector'
import type { DateRange } from '@/types/date-range'
import type { ComparisonPreset } from '@/components/custom/comparison-period/comparison-period-types'
import { SearchOrdersTab } from './SearchOrdersTab'
import { SearchByProductTab } from './SearchByProductTab'
import { SearchByQueryTab } from './SearchByQueryTab'
import { SearchPositionTrendsTab } from './SearchPositionTrendsTab'
import { SearchSellerBadge } from './SearchSellerBadge'
import { calculatePreviousPeriod } from './search-comparison-utils'

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

/** ISO week string for ComparisonPeriodSelector (mirrors buyout/returns pattern). */
function toIsoWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

interface SearchPageContentProps {
  /** Story 119.2-FE Pass-1 F-1: when provided (via `?query=` URL param), the
   * by-query tab is the default and the query input is pre-populated. */
  initialQuery?: string
}

export function SearchPageContent({ initialQuery }: SearchPageContentProps = {}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPreset>('previous')
  const [compareStart, setCompareStart] = useState('')
  const [compareEnd, setCompareEnd] = useState('')

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  // Calculate comparison period
  const comparePeriod = useMemo(() => {
    if (!comparisonEnabled || !apiFrom || !apiTo) return null
    return calculatePreviousPeriod(apiFrom, apiTo)
  }, [comparisonEnabled, apiFrom, apiTo])

  const handleCompareRangeChange = (start: string, end: string) => {
    setCompareStart(start)
    setCompareEnd(end)
  }

  const hasInitialQuery = typeof initialQuery === 'string' && initialQuery.length > 0
  const defaultTab = hasInitialQuery ? 'by-query' : 'orders'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Поисковая аналитика</h1>
        <p className="text-muted-foreground mt-1">Анализ поисковых запросов, позиций и заказов</p>
        <div className="mt-2">
          <SearchSellerBadge />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="search-date-range"
        />

        {/* Comparison Period Selector — mirrors buyout (127.4-FE) / returns (127.5-FE) */}
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
      </div>

      <RequireJam requiredTier="standard">
        <Tabs defaultValue={defaultTab}>
          <TabsList aria-label="Разделы поисковой аналитики">
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="by-product">По товарам</TabsTrigger>
            <TabsTrigger value="by-query">По запросам</TabsTrigger>
            <TabsTrigger value="position-trends">Позиции</TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <SearchOrdersTab
              from={apiFrom}
              to={apiTo}
              compareEnabled={comparisonEnabled}
              compareFrom={comparePeriod?.prevFrom ?? ''}
              compareTo={comparePeriod?.prevTo ?? ''}
            />
          </TabsContent>
          <TabsContent value="by-product">
            <SearchByProductTab from={apiFrom} to={apiTo} />
          </TabsContent>
          <TabsContent value="by-query">
            <SearchByQueryTab from={apiFrom} to={apiTo} initialQuery={initialQuery} />
          </TabsContent>
          <TabsContent value="position-trends">
            <SearchPositionTrendsTab />
          </TabsContent>
        </Tabs>
      </RequireJam>
    </div>
  )
}
