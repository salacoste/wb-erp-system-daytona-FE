'use client'

import { useState, useCallback, useMemo } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useUnitEconomics } from '@/hooks/useUnitEconomics'
import type { UnitEconomicsQueryParams, UnitEconomicsViewBy } from '@/types/unit-economics'
import { UnitEconomicsHeader } from './components/UnitEconomicsHeader'
import { UnitEconomicsSummaryCards } from './components/UnitEconomicsSummaryCards'
import { UnitEconomicsTable } from './components/UnitEconomicsTable'
import { UnitEconomicsLoading } from './components/UnitEconomicsLoading'
import { UnitEconomicsEmpty } from './components/UnitEconomicsEmpty'
import { UnitEconomicsWaterfall } from './components/UnitEconomicsWaterfall'

/**
 * Unit Economics Analytics Page
 * Story 5.2: Unit Economics Page Structure
 * Epic 5: Unit Economics Analytics
 *
 * Displays cost breakdown, profitability analysis, and waterfall visualization.
 */

// Generate last 12 weeks for selector
function generateWeekOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  const now = new Date()

  for (let i = 1; i <= 12; i++) {
    const weekDate = new Date(now)
    weekDate.setDate(weekDate.getDate() - i * 7)

    // Get ISO week number
    const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
    const days = Math.floor((weekDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)

    const weekStr = `${weekDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`

    // Format date range for display
    const weekStart = new Date(weekDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const formatDate = (d: Date) =>
      d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

    options.push({
      value: weekStr,
      label: `${weekStr} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
    })
  }

  return options
}

const WEEK_OPTIONS = generateWeekOptions()

export default function UnitEconomicsPage() {
  // State
  const [selectedWeek, setSelectedWeek] = useState(WEEK_OPTIONS[0]?.value ?? '')
  const [viewBy, setViewBy] = useState<UnitEconomicsViewBy>('sku')
  const [sortBy, setSortBy] = useState<'revenue' | 'net_margin_pct'>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedSku, setSelectedSku] = useState<string | undefined>(undefined)

  // Build query params
  const queryParams: UnitEconomicsQueryParams = useMemo(
    () => ({
      week: selectedWeek,
      view_by: viewBy,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: 200,
    }),
    [selectedWeek, viewBy, sortBy, sortOrder]
  )

  // Fetch data
  const { data, isLoading, error, refetch, dataUpdatedAt } = useUnitEconomics(queryParams, {
    staleTime: 60000,
    refetchInterval: 300000,
  })

  // Handlers
  const handleWeekChange = useCallback((week: string) => {
    setSelectedWeek(week)
  }, [])

  const handleViewByChange = useCallback((view: string) => {
    setViewBy(view as UnitEconomicsViewBy)
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleSort = useCallback(
    (field: 'revenue' | 'net_margin_pct') => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(field)
        setSortOrder('desc')
      }
    },
    [sortBy]
  )

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!data) return

    const headers = [
      'SKU',
      'Название',
      'Выручка',
      'COGS %',
      'Комиссия %',
      'Логистика %',
      'Хранение %',
      'Маржа %',
      'Прибыль',
      'Статус',
    ]

    const rows = data.data.map((item) => [
      item.sku_id,
      item.product_name,
      item.revenue,
      item.costs_pct.cogs.toFixed(1),
      item.costs_pct.commission.toFixed(1),
      (item.costs_pct.logistics_delivery + item.costs_pct.logistics_return).toFixed(1),
      item.costs_pct.storage.toFixed(1),
      item.net_margin_pct.toFixed(1),
      item.net_profit,
      item.profitability_status,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `unit-economics-${selectedWeek}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [data, selectedWeek])

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <UnitEconomicsHeader
          selectedWeek={selectedWeek}
          weekOptions={WEEK_OPTIONS}
          viewBy={viewBy}
          onWeekChange={handleWeekChange}
          onViewByChange={handleViewByChange}
          onRefresh={handleRefresh}
          onExport={handleExportCSV}
          isRefreshing={isLoading}
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные. Попробуйте ещё раз.</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <UnitEconomicsHeader
          selectedWeek={selectedWeek}
          weekOptions={WEEK_OPTIONS}
          viewBy={viewBy}
          onWeekChange={handleWeekChange}
          onViewByChange={handleViewByChange}
          onRefresh={handleRefresh}
          onExport={handleExportCSV}
          isRefreshing={true}
        />
        <UnitEconomicsLoading />
      </div>
    )
  }

  // Empty state
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="space-y-6">
        <UnitEconomicsHeader
          selectedWeek={selectedWeek}
          weekOptions={WEEK_OPTIONS}
          viewBy={viewBy}
          onWeekChange={handleWeekChange}
          onViewByChange={handleViewByChange}
          onRefresh={handleRefresh}
          onExport={handleExportCSV}
          isRefreshing={isLoading}
        />
        <UnitEconomicsEmpty onSelectWeek={() => {}} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <UnitEconomicsHeader
        selectedWeek={selectedWeek}
        weekOptions={WEEK_OPTIONS}
        viewBy={viewBy}
        onWeekChange={handleWeekChange}
        onViewByChange={handleViewByChange}
        onRefresh={handleRefresh}
        onExport={handleExportCSV}
        isRefreshing={isLoading}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
      />

      {/* Summary Cards (6 metrics) */}
      <UnitEconomicsSummaryCards summary={data.summary} />

      {/* Waterfall Chart (Story 5.3) */}
      <UnitEconomicsWaterfall
        data={data.data}
        summary={data.summary}
        selectedSku={selectedSku}
        onSelectSku={setSelectedSku}
      />

      {/* Data Table */}
      <UnitEconomicsTable
        data={data.data}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        selectedSku={selectedSku}
        onSelectSku={setSelectedSku}
      />
    </div>
  )
}
