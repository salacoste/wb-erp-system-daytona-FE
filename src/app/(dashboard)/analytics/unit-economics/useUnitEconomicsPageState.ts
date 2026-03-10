'use client'

import { useState, useCallback, useMemo } from 'react'
import { useUnitEconomics } from '@/hooks/useUnitEconomics'
import type { UnitEconomicsQueryParams, UnitEconomicsViewBy } from '@/types/unit-economics'
import { WEEK_OPTIONS } from './unit-economics-config'

const VALID_VIEWS: readonly UnitEconomicsViewBy[] = ['sku', 'category', 'brand', 'total']

/**
 * Page state and handlers for Unit Economics page.
 * Encapsulates all state management, data fetching, sorting, and CSV export.
 */
export function useUnitEconomicsPageState() {
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
    (field: 'revenue' | 'net_margin_pct') => {
      if (sortBy === field) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
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

    const rows = data.data.map(item => [
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
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `unit-economics-${selectedWeek}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [data, selectedWeek])

  return {
    selectedWeek,
    viewBy,
    sortBy,
    sortOrder,
    selectedSku,
    data,
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
