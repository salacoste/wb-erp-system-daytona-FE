'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { formatIsoWeek } from '@/lib/utils'
import { fillMissingWeeks } from '@/lib/analytics-utils'
import {
  useStorageBySku,
  useStorageTopConsumers,
  useStorageTrends,
} from '@/hooks/useStorageAnalytics'
import { useStorageUrlSync } from './useStorageUrlSync'

/** Storage Analytics Page State — Story 24.2-FE, 24.9-FE, 24.10-FE */
export function useStoragePageState() {
  const searchParams = useSearchParams()

  // Calculate default week range (last 4 weeks)
  const lastCompletedWeek = useMemo(() => getLastCompletedWeek(), [])
  const defaultFourWeeksAgo = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 28)
    return formatIsoWeek(date)
  }, [])

  // Initialize state from URL params or defaults - Story 24.9-FE AC3
  const [weekStart, setWeekStart] = useState(
    () => searchParams.get('weekStart') || defaultFourWeeksAgo
  )
  const [weekEnd, setWeekEnd] = useState(() => searchParams.get('weekEnd') || lastCompletedWeek)
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const brands = searchParams.get('brands')
    return brands ? brands.split(',').filter(Boolean) : []
  })
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>(() => {
    const warehouses = searchParams.get('warehouses')
    return warehouses ? warehouses.split(',').filter(Boolean) : []
  })

  // Story 24.10: Selected week for click-to-filter interaction
  const [selectedWeek, setSelectedWeek] = useState<string | null>(() => {
    return searchParams.get('week') || null
  })

  // Story 24.10: When a specific week is selected, use it for table/widget filtering
  const effectiveWeekStart = selectedWeek || weekStart
  const effectiveWeekEnd = selectedWeek || weekEnd

  // Fetch unfiltered data for filter options (backend max limit=200, SEC-001)
  const { data: unfilteredData, isLoading: isLoadingUnfiltered } = useStorageBySku(
    weekStart,
    weekEnd,
    { limit: 200 }
  )

  // Fetch filtered storage data — Story 24.10: uses effective week range
  const {
    data: bySkuData,
    isLoading: isLoadingBySku,
    error: bySkuError,
  } = useStorageBySku(effectiveWeekStart, effectiveWeekEnd, {
    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    warehouse: selectedWarehouses.length > 0 ? selectedWarehouses.join(',') : undefined,
    limit: 20,
  })

  // Story 24.9/24.10: Top consumers with brand/warehouse filters + effective week range
  // Story 169.12 (AC-2): surface the per-section error (previously silently dropped)
  const {
    data: topConsumersData,
    isLoading: isLoadingTopConsumers,
    error: topConsumersError,
  } = useStorageTopConsumers(effectiveWeekStart, effectiveWeekEnd, {
    limit: 5,
    include_revenue: true,
    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    warehouse: selectedWarehouses.length > 0 ? selectedWarehouses.join(',') : undefined,
  })

  // Story 24.9: Pass brand/warehouse filters to trends API
  // Story 169.12 (AC-2): surface the per-section error (previously silently dropped)
  const {
    data: trendsData,
    isLoading: isLoadingTrends,
    error: trendsError,
  } = useStorageTrends(weekStart, weekEnd, {
    metrics: ['storage_cost'],
    brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
    warehouse: selectedWarehouses.length > 0 ? selectedWarehouses.join(',') : undefined,
  })

  // Extract unique brands and warehouses from unfiltered data - Story 24.9-FE
  const availableBrands = useMemo(() => {
    if (!unfilteredData?.data) return []
    const brands = unfilteredData.data
      .map(item => item.brand)
      .filter((brand): brand is string => brand !== null && brand !== undefined)
    return [...new Set(brands)].sort()
  }, [unfilteredData])

  const availableWarehouses = useMemo(() => {
    if (!unfilteredData?.data) return []
    const warehouses = unfilteredData.data.flatMap(item => item.warehouses || []).filter(Boolean)
    return [...new Set(warehouses)].sort()
  }, [unfilteredData])

  // Fill missing weeks in trends data to show complete range on chart
  const filledTrendsData = useMemo(() => {
    if (!trendsData?.data || trendsData.data.length === 0) return []
    return fillMissingWeeks(trendsData.data, weekStart, weekEnd)
  }, [trendsData?.data, weekStart, weekEnd])

  // URL sync (extracted for max-lines compliance)
  useStorageUrlSync(weekStart, weekEnd, selectedBrands, selectedWarehouses, selectedWeek)

  // Handle filter changes
  const handleWeekRangeChange = (start: string, end: string) => {
    setWeekStart(start)
    setWeekEnd(end)
    setSelectedWeek(null) // Story 24.10 AC4: Clear week filter when week range changes
  }

  // Story 24.10: Handle week click in trends chart
  const handleWeekClick = (week: string) => {
    setSelectedWeek(prev => (prev === week ? null : week)) // Toggle (AC4)
  }

  const handleClearWeekFilter = () => setSelectedWeek(null)
  const handleBrandsChange = (brands: string[]) => setSelectedBrands(brands)
  const handleWarehousesChange = (warehouses: string[]) => setSelectedWarehouses(warehouses)

  return {
    weekStart,
    weekEnd,
    selectedBrands,
    selectedWarehouses,
    selectedWeek,
    bySkuData,
    isLoadingBySku,
    bySkuError,
    topConsumersData,
    isLoadingTopConsumers,
    topConsumersError,
    filledTrendsData,
    trendsData,
    isLoadingTrends,
    trendsError,
    unfilteredData,
    isLoadingUnfiltered,
    availableBrands,
    availableWarehouses,
    handleWeekRangeChange,
    handleWeekClick,
    handleClearWeekFilter,
    handleBrandsChange,
    handleWarehousesChange,
  }
}
