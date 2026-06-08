'use client'

/**
 * Order picker selection state and handlers
 * Epic 53-FE: Extracted from OrderPickerDrawer for file size compliance
 * Manages selected IDs set with max limit enforcement
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { MAX_SELECTION, NEAR_LIMIT_THRESHOLD } from './order-picker-constants'

export interface OrderPickerSelection {
  selectedIds: Set<string>
  selectedCount: number
  isNearLimit: boolean
  isAtLimit: boolean
  isAllSelected: boolean
  isIndeterminate: boolean
  handleToggleOrder: (orderId: string) => void
  handleToggleAll: () => void
  handleClearSelection: () => void
}

/**
 * Manages selection state for order picker with max limit and auto-reset
 * @param orders - Current list of visible orders
 * @param isOpen - Drawer open state; resets selection when closed
 */
export function useOrderPickerSelection(
  orders: { orderId: string }[],
  isOpen: boolean
): OrderPickerSelection {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Reset selection when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
    }
  }, [isOpen])

  const selectedCount = selectedIds.size
  const isNearLimit = selectedCount > NEAR_LIMIT_THRESHOLD
  const isAtLimit = selectedCount >= MAX_SELECTION

  const isAllSelected = useMemo(() => {
    if (orders.length === 0) return false
    return orders.every(order => selectedIds.has(order.orderId))
  }, [orders, selectedIds])

  const isIndeterminate = useMemo(() => {
    if (orders.length === 0) return false
    const selectedVisible = orders.filter(o => selectedIds.has(o.orderId)).length
    return selectedVisible > 0 && selectedVisible < orders.length
  }, [orders, selectedIds])

  const handleToggleOrder = useCallback((orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else if (next.size < MAX_SELECTION) {
        next.add(orderId)
      }
      return next
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        orders.forEach(order => next.delete(order.orderId))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        for (const order of orders) {
          if (next.size >= MAX_SELECTION) break
          next.add(order.orderId)
        }
        return next
      })
    }
  }, [isAllSelected, orders])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    selectedCount,
    isNearLimit,
    isAtLimit,
    isAllSelected,
    isIndeterminate,
    handleToggleOrder,
    handleToggleAll,
    handleClearSelection,
  }
}
