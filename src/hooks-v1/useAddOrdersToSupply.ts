/**
 * useAddOrdersToSupply Hook
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Mutation hook for adding orders to a supply with partial success handling.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addOrders } from '@/lib/api/supplies'
import { suppliesQueryKeys } from '@/hooks/useSupplies'
import { ordersQueryKeys } from '@/hooks/useOrders'
import { ordersForSupplyQueryKeys } from '@/hooks/useOrdersForSupply'
import type { AddOrdersResponse } from '@/types/supplies'

// =============================================================================
// Types
// =============================================================================

export interface UseAddOrdersToSupplyOptions {
  /** Callback on successful add (at least 1 order added) */
  onSuccess?: (data: AddOrdersResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Callback on settled (success or error) */
  onSettled?: () => void
}

// =============================================================================
// Russian Pluralization Helper
// =============================================================================

function pluralizeOrders(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 14) {
    return 'заказов'
  }
  if (mod10 === 1) {
    return 'заказ'
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'заказа'
  }
  return 'заказов'
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to add orders to a supply
 * Handles partial success and shows appropriate toasts
 */
export function useAddOrdersToSupply(supplyId: string, options: UseAddOrdersToSupplyOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation<AddOrdersResponse, Error, string[]>({
    mutationFn: (orderIds: string[]) => {
      console.info('[Supply] Adding orders:', { supplyId, orderCount: orderIds.length })
      return addOrders(supplyId, orderIds)
    },

    onSuccess: data => {
      const { addedCount, failures } = data
      const failedCount = failures?.length ?? 0

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.detail(supplyId) })
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ordersForSupplyQueryKeys.all })

      // Show toasts based on result
      if (addedCount > 0) {
        toast.success(`Добавлено: ${addedCount} ${pluralizeOrders(addedCount)}`)
      }

      if (failedCount > 0 && addedCount > 0) {
        // Partial success - show warning
        toast.warning(`Не удалось добавить: ${failedCount} ${pluralizeOrders(failedCount)}`)
      } else if (failedCount > 0 && addedCount === 0) {
        // All failed
        toast.warning(`Не удалось добавить заказы: ${failedCount} ${pluralizeOrders(failedCount)}`)
      }

      // Call user callback only if at least one order was added
      if (addedCount > 0) {
        options.onSuccess?.(data)
      }
    },

    onError: error => {
      console.error('[Supply] Add orders failed:', supplyId, error)
      toast.error('Не удалось добавить заказы в поставку')
      options.onError?.(error)
    },

    onSettled: () => {
      options.onSettled?.()
    },
  })
}
