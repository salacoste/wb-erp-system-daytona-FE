'use client'

/**
 * Search Analytics page content
 * Story 71.4-FE: Page scaffold with RequireJam gating and 3-tab layout
 * Story 71.5-FE: Date range + SearchOrdersTab
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 * Story 71.7-FE: By-Query Product Ranking Tab
 * Story 117.3-FE: Seller profile badge in page header
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

export function SearchPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

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
        <Tabs defaultValue="orders">
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
            <SearchByQueryTab from={apiFrom} to={apiTo} />
          </TabsContent>
        </Tabs>
      </RequireJam>
    </div>
  )
}
