/**
 * FBS Orders Analytics Page
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Main analytics page with tab navigation and date range picker.
 * Integrates components from Stories 51.4-51.7.
 *
 * @see docs/stories/epic-51/story-51.8-fe-fbs-analytics-page.md
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { subDays } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import type { DateRange } from '@/types/date-range'
import { OrdersPageHeader } from './components/OrdersPageHeader'
import { OverviewTab } from './components/OverviewTab'
import { TrendsTab } from './components/TrendsTab'
import { SeasonalityTab } from './components/SeasonalityTab'
import { ComparisonTab } from './components/ComparisonTab'

/** Tab type definition */
type TabValue = 'overview' | 'trends' | 'seasonality' | 'comparison'

/** Default to last 30 days */
function getDefaultDateRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

/** Convert DateRange to API format strings */
function formatDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Parse date from URL param */
function parseDateParam(param: string | null): Date | null {
  if (!param) return null
  const date = new Date(param)
  return isNaN(date.getTime()) ? null : date
}

export default function OrdersAnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize date range from URL or defaults
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromParam = parseDateParam(searchParams.get('from'))
    const toParam = parseDateParam(searchParams.get('to'))
    if (fromParam && toParam) {
      return { from: fromParam, to: toParam }
    }
    return getDefaultDateRange()
  })

  // Initialize active tab from URL or default to overview
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'trends', 'seasonality', 'comparison'].includes(tabParam)) {
      return tabParam as TabValue
    }
    return 'overview'
  })

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (dateRange) {
      params.set('from', formatDateForApi(dateRange.from))
      params.set('to', formatDateForApi(dateRange.to))
    }
    params.set('tab', activeTab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [dateRange, activeTab, router])

  // Convert to API format for child components
  const apiDateRange = dateRange
    ? { from: formatDateForApi(dateRange.from), to: formatDateForApi(dateRange.to) }
    : { from: '', to: '' }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <OrdersPageHeader />

      {/* Date Range Picker - shown for Overview and Trends tabs */}
      {(activeTab === 'overview' || activeTab === 'trends') && (
        <div className="flex items-start">
          <DateRangePickerExtended
            value={dateRange}
            onChange={setDateRange}
            maxDays={365}
            showAggregationSuggestion
            placeholder="Выберите период"
            id="orders-date-range"
          />
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as TabValue)}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-4 h-11">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10">
            Обзор
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary/10">
            Тренды
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="data-[state=active]:bg-primary/10">
            Сезонность
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-primary/10">
            Сравнение
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" role="tabpanel" aria-labelledby="overview-tab">
          <OverviewTab from={apiDateRange.from} to={apiDateRange.to} />
        </TabsContent>

        <TabsContent value="trends" role="tabpanel" aria-labelledby="trends-tab">
          <TrendsTab from={apiDateRange.from} to={apiDateRange.to} />
        </TabsContent>

        <TabsContent value="seasonality" role="tabpanel" aria-labelledby="seasonality-tab">
          <SeasonalityTab />
        </TabsContent>

        <TabsContent value="comparison" role="tabpanel" aria-labelledby="comparison-tab">
          <ComparisonTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
