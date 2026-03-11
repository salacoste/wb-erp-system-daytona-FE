'use client'

/**
 * Shipments list page state management
 * Epic 76-FE, Story 76.1: Filters, pagination, sort, dialogs
 */

import { useState, useCallback, useMemo } from 'react'
import { useShipments } from '@/hooks/use-shipments'
import type { ShipmentStatus, ShipmentListParams } from '@/types/shipment-cost'
import type { SortOrder } from '@/components/custom/shipments/ShipmentsTable'

export function useShipmentsPageState() {
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const params = useMemo<ShipmentListParams>(
    () => ({ status: statusFilter, page, limit }),
    [statusFilter, page, limit]
  )

  const { data, isLoading, isError, error, refetch } = useShipments(params)

  const sortedShipments = useMemo(() => {
    const items = data?.data ?? []
    if (sortOrder === 'asc') return [...items].reverse()
    return items
  }, [data?.data, sortOrder])

  const handleStatusChange = useCallback((status: ShipmentStatus | undefined) => {
    setStatusFilter(status)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
  }, [])

  return {
    shipments: sortedShipments,
    total: data?.total ?? 0,
    page,
    limit,
    statusFilter,
    sortOrder,
    isLoading,
    isError,
    error,
    refetch,
    isCreateOpen,
    setIsCreateOpen,
    handleStatusChange,
    handlePageChange,
    handleLimitChange,
    handleSortToggle,
  }
}
