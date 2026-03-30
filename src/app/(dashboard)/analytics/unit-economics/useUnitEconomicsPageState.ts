'use client'

import { useState, useCallback, useMemo } from 'react'
import { useUnitEconomics } from '@/hooks/useUnitEconomics'
import { useFcuBySku } from '@/hooks/use-fcu-aggregation'
import type {
  UnitEconomicsQueryParams,
  UnitEconomicsViewBy,
  UnitEconomicsResponse,
} from '@/types/unit-economics'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import type { FcuBySkuItem } from '@/lib/api/shipment-cost/fcu-aggregation-api'
import { WEEK_OPTIONS } from './unit-economics-config'
import { exportUnitEconomicsCsv } from './unit-economics-csv-export'

const VALID_VIEWS: readonly UnitEconomicsViewBy[] = ['sku', 'category', 'brand', 'total']

/** Sort fields: revenue/net_margin_pct are server-side; delivery_to_warehouse is client-side (Story 77.5) */
export type UeTableSortField = 'revenue' | 'net_margin_pct' | 'delivery_to_warehouse'

/** Nulls-last comparator for delivery_to_warehouse sort (Story 77.5). */
export function deliveryNullsLastSort(
  a: UnitEconomicsItem,
  b: UnitEconomicsItem,
  order: 'asc' | 'desc'
): number {
  const aVal = a.costs_pct.delivery_to_warehouse
  const bVal = b.costs_pct.delivery_to_warehouse
  if (aVal == null && bVal == null) return 0
  if (aVal == null) return 1
  if (bVal == null) return -1
  return order === 'asc' ? aVal - bVal : bVal - aVal
}

/** Compute avg delivery cost per unit and coverage ratio (Story 77.5). */
export function computeDeliveryMetrics(items: UnitEconomicsItem[] | undefined) {
  if (!items?.length)
    return {
      avgDeliveryCost: undefined as number | undefined,
      deliverySkuCount: 0,
      deliveryCoverageRatio: undefined as number | undefined,
    }
  const revenueItems = items.filter(i => i.revenue > 0)
  const withDelivery = revenueItems.filter(
    i => i.costs_rub.delivery_to_warehouse != null && i.units_sold && i.units_sold > 0
  )
  const ratio = revenueItems.length > 0 ? withDelivery.length / revenueItems.length : undefined
  if (withDelivery.length === 0)
    return {
      avgDeliveryCost: undefined as number | undefined,
      deliverySkuCount: 0,
      deliveryCoverageRatio: ratio,
    }
  const sum = withDelivery.reduce(
    (acc, i) => acc + i.costs_rub.delivery_to_warehouse! / i.units_sold!,
    0
  )
  return {
    avgDeliveryCost: sum / withDelivery.length,
    deliverySkuCount: withDelivery.length,
    deliveryCoverageRatio: ratio,
  }
}

/** Merge FCU delivery costs into unit economics items (Story 77.4) */
export function mergeDeliveryCosts(
  ueData: UnitEconomicsResponse,
  fcuItems: FcuBySkuItem[]
): UnitEconomicsResponse {
  const fcuMap = new Map(fcuItems.map(f => [String(f.nmId), f]))
  const merged = ueData.data.map(item => {
    const fcu = fcuMap.get(item.sku_id)
    if (!fcu || !item.units_sold || item.revenue <= 0) return item
    const deliveryRub = fcu.latestDcu * item.units_sold
    const deliveryPct = (deliveryRub / item.revenue) * 100
    return {
      ...item,
      costs_rub: { ...item.costs_rub, delivery_to_warehouse: deliveryRub },
      costs_pct: { ...item.costs_pct, delivery_to_warehouse: deliveryPct },
    }
  })
  return { ...ueData, data: merged }
}

/**
 * Page state and handlers for Unit Economics page.
 * Encapsulates all state management, data fetching, sorting, and CSV export.
 */
export function useUnitEconomicsPageState() {
  // State
  const [selectedWeek, setSelectedWeek] = useState(WEEK_OPTIONS[0]?.value ?? '')
  const [viewBy, setViewBy] = useState<UnitEconomicsViewBy>('sku')
  const [sortBy, setSortBy] = useState<UeTableSortField>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedSku, setSelectedSku] = useState<string | undefined>(undefined)

  // Build query params — only pass server-side sort fields to backend
  const serverSortBy = sortBy === 'delivery_to_warehouse' ? 'revenue' : sortBy
  const queryParams: UnitEconomicsQueryParams = useMemo(
    () => ({
      week: selectedWeek,
      view_by: viewBy,
      sort_by: serverSortBy,
      sort_order: sortOrder,
      limit: 200,
    }),
    [selectedWeek, viewBy, serverSortBy, sortOrder]
  )

  // Fetch unit economics + FCU delivery costs
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useUnitEconomics(queryParams, { staleTime: 60000, refetchInterval: 300000 })
  const { data: fcuData } = useFcuBySku(viewBy === 'sku' ? selectedWeek : undefined)

  // Merge FCU delivery costs into unit economics (graceful: no FCU = no delivery_to_warehouse)
  const mergedData = useMemo(() => {
    if (!rawData) return rawData
    if (!fcuData?.length) return rawData
    return mergeDeliveryCosts(rawData, fcuData)
  }, [rawData, fcuData])

  // Client-side sort for delivery_to_warehouse (nulls-last), passthrough for server-sorted fields
  const data = useMemo(() => {
    if (!mergedData || sortBy !== 'delivery_to_warehouse') return mergedData
    const sorted = [...mergedData.data].sort((a, b) => deliveryNullsLastSort(a, b, sortOrder))
    return { ...mergedData, data: sorted }
  }, [mergedData, sortBy, sortOrder])

  // Avg delivery cost + coverage ratio — pre-wired for calculateHealthScore() (Story 77.5)
  const { avgDeliveryCost, deliverySkuCount, deliveryCoverageRatio } = useMemo(() => {
    if (!data)
      return {
        avgDeliveryCost: undefined as number | undefined,
        deliverySkuCount: 0,
        deliveryCoverageRatio: undefined as number | undefined,
      }
    return computeDeliveryMetrics(data.data)
  }, [data])

  // Handlers
  const handleWeekChange = useCallback((week: string) => {
    setSelectedWeek(week)
  }, [])

  const handleViewByChange = useCallback((view: string) => {
    if (VALID_VIEWS.includes(view as UnitEconomicsViewBy)) {
      setViewBy(view as UnitEconomicsViewBy)
    } else {
      setViewBy('sku')
    }
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleSort = useCallback(
    (field: UeTableSortField) => {
      if (sortBy === field) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(field)
        setSortOrder('desc')
      }
    },
    [sortBy]
  )

  // Export CSV (extracted to unit-economics-csv-export.ts — Story 77.5)
  const handleExportCSV = useCallback(() => {
    if (!data) return
    exportUnitEconomicsCsv(data, selectedWeek)
  }, [data, selectedWeek])

  return {
    selectedWeek,
    viewBy,
    sortBy,
    sortOrder,
    selectedSku,
    data,
    avgDeliveryCost,
    deliverySkuCount,
    deliveryCoverageRatio,
    isLoading,
    error,
    dataUpdatedAt,
    handleWeekChange,
    handleViewByChange,
    handleRefresh,
    handleSort,
    handleExportCSV,
    setSelectedSku,
  }
}
