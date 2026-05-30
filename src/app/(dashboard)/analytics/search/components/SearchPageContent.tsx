'use client'

/**
 * Search Analytics page content
 * Story 71.4-FE: Page scaffold with RequireJam gating and 3-tab layout
 * Story 71.5-FE: Date range + SearchOrdersTab
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 * Story 71.7-FE: By-Query Product Ranking Tab
 * Story 117.3-FE: Seller profile badge in page header
 * Story 119.2-FE Pass-1 F-1: optional `initialQuery` from `?query=` URL param —
 * when present, defaults to the by-query tab and pre-populates the query input
 * (closes the silent-drop on Funnel "Топ поисковых запросов" cross-page links).
 */

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { RequireJam } from '@/components/custom/jam/RequireJam'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import type { DateRange } from '@/types/date-range'
import { SearchOrdersTab } from './SearchOrdersTab'
import { SearchByProductTab } from './SearchByProductTab'
import { SearchByQueryTab } from './SearchByQueryTab'
import { SearchSellerBadge } from './SearchSellerBadge'

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

interface SearchPageContentProps {
  /** Story 119.2-FE Pass-1 F-1: when provided (via `?query=` URL param), the
   * by-query tab is the default and the query input is pre-populated. */
  initialQuery?: string
}

export function SearchPageContent({ initialQuery }: SearchPageContentProps = {}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const hasInitialQuery = typeof initialQuery === 'string' && initialQuery.length > 0
  const defaultTab = hasInitialQuery ? 'by-query' : 'orders'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Поисковая аналитика</h1>
        <p className="text-muted-foreground mt-1">Анализ поисковых запросов, позиций и заказов</p>
        <div className="mt-2">
          <SearchSellerBadge />
        </div>
      </div>

      <DateRangePickerExtended
        value={dateRange}
        onChange={setDateRange}
        maxDays={365}
        placeholder="Выберите период"
        id="search-date-range"
      />

      <RequireJam requiredTier="standard">
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="by-product">По товарам</TabsTrigger>
            <TabsTrigger value="by-query">По запросам</TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <SearchOrdersTab from={apiFrom} to={apiTo} />
          </TabsContent>
          <TabsContent value="by-product">
            <SearchByProductTab from={apiFrom} to={apiTo} />
          </TabsContent>
          <TabsContent value="by-query">
            <SearchByQueryTab from={apiFrom} to={apiTo} initialQuery={initialQuery} />
          </TabsContent>
        </Tabs>
      </RequireJam>
    </div>
  )
}
