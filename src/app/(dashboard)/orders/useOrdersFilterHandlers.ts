'use client'

/**
 * Orders filter change handlers with page reset
 * Extracted from orders/page.tsx for file-size compliance.
 * Story 40.3-FE: Orders List Page
 */

import { useCallback } from 'react'
import type { SupplierStatus, WbStatus } from '@/types/orders'

interface UseOrdersFilterHandlersProps {
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  setSupplierStatus: (v: SupplierStatus | null) => void
  setWbStatus: (v: WbStatus | null) => void
  setSearchInput: (v: string) => void
  setPage: (p: number) => void
}

export function useOrdersFilterHandlers({
  setDateFrom,
  setDateTo,
  setSupplierStatus,
  setWbStatus,
  setSearchInput,
  setPage,
}: UseOrdersFilterHandlersProps) {
  const onDateFromChange = useCallback(
    (v: string) => {
      setDateFrom(v)
      setPage(1)
    },
    [setDateFrom, setPage]
  )

  const onDateToChange = useCallback(
    (v: string) => {
      setDateTo(v)
      setPage(1)
    },
    [setDateTo, setPage]
  )

  const onSupplierStatusChange = useCallback(
    (v: SupplierStatus | null) => {
      setSupplierStatus(v)
      setPage(1)
    },
    [setSupplierStatus, setPage]
  )

  const onWbStatusChange = useCallback(
    (v: WbStatus | null) => {
      setWbStatus(v)
      setPage(1)
    },
    [setWbStatus, setPage]
  )

  const onSearchChange = useCallback(
    (v: string) => {
      setSearchInput(v)
      setPage(1)
    },
    [setSearchInput, setPage]
  )

  return {
    onDateFromChange,
    onDateToChange,
    onSupplierStatusChange,
    onWbStatusChange,
    onSearchChange,
  }
}
