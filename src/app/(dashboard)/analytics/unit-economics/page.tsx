'use client'

import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { UnitEconomicsHeader } from './components/UnitEconomicsHeader'
import { UnitEconomicsSummaryCards } from './components/UnitEconomicsSummaryCards'
import { UnitEconomicsTable } from './components/UnitEconomicsTable'
import { UnitEconomicsLoading } from './components/UnitEconomicsLoading'
import { UnitEconomicsEmpty } from './components/UnitEconomicsEmpty'
import { UnitEconomicsWaterfall } from './components/UnitEconomicsWaterfall'
import { WEEK_OPTIONS } from './unit-economics-config'
import { useUnitEconomicsPageState } from './useUnitEconomicsPageState'

/**
 * Unit Economics Analytics Page
 * Story 5.2: Unit Economics Page Structure
 * Epic 5: Unit Economics Analytics
 *
 * Displays cost breakdown, profitability analysis, and waterfall visualization.
 */
export default function UnitEconomicsPage() {
  const {
    selectedWeek,
    viewBy,
    sortBy,
    sortOrder,
    selectedSku,
    data,
    avgDeliveryCost,
    deliverySkuCount,
    isLoading,
    error,
    dataUpdatedAt,
    handleWeekChange,
    handleViewByChange,
    handleRefresh,
    handleSort,
    handleExportCSV,
    setSelectedSku,
  } = useUnitEconomicsPageState()

  const headerProps = {
    selectedWeek,
    weekOptions: WEEK_OPTIONS,
    viewBy,
    onWeekChange: handleWeekChange,
    onViewByChange: handleViewByChange,
    onRefresh: handleRefresh,
    onExport: handleExportCSV,
    isRefreshing: isLoading,
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <UnitEconomicsHeader {...headerProps} />
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
        <UnitEconomicsHeader {...headerProps} isRefreshing={true} />
        <UnitEconomicsLoading />
      </div>
    )
  }

  // Empty state
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="space-y-6">
        <UnitEconomicsHeader {...headerProps} />
        <UnitEconomicsEmpty onSelectWeek={() => {}} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <UnitEconomicsHeader
        {...headerProps}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
      />

      {/* Summary Cards (7 metrics — Story 77.5 added delivery) */}
      <UnitEconomicsSummaryCards
        summary={data.summary}
        avgDeliveryCost={avgDeliveryCost}
        deliverySkuCount={deliverySkuCount}
      />

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
