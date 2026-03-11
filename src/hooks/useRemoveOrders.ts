/**
 * Hook for removing orders from a supply
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Implements optimistic updates for better UX.
 * Reference: docs/stories/epic-53/story-53.4-fe-supply-detail-page.md
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { removeOrdersFromSupply, suppliesQueryKeys } from '@/lib/api/supplies'
import type { SupplyDetailResponse, RemoveOrdersResponse } from '@/types/supplies'

interface RemoveOrdersContext {
  previousSupply: SupplyDetailResponse | undefined
}

/**
 * Hook to remove orders from a supply with optimistic updates
 *
 * @param supplyId - Supply ID to remove orders from
 * @returns Mutation object with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useRemoveOrders('supply-001')
 *
 * // Remove single order
 * mutate(['order-123'])
 *
 * // Remove multiple orders
 * mutate(['order-123', 'order-456'])
 */
export function useRemoveOrders(supplyId: string) {
  const queryClient = useQueryClient()

  return useMutation<RemoveOrdersResponse, Error, string[], RemoveOrdersContext>({
    mutationFn: (orderIds: string[]) => removeOrdersFromSupply(supplyId, orderIds),

    onMutate: async orderIds => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: suppliesQueryKeys.detail(supplyId),
      })

      // Snapshot the previous value
      const previousSupply = queryClient.getQueryData<SupplyDetailResponse>(
        suppliesQueryKeys.detail(supplyId)
      )

      // Optimistically update the cache
      if (previousSupply) {
        const updatedSupply: SupplyDetailResponse = {
          ...previousSupply,
          ordersCount: previousSupply.ordersCount - orderIds.length,
          orders: previousSupply.orders.filter(order => !orderIds.includes(order.orderId)),
          // Recalculate total value
          totalValue: previousSupply.orders
            .filter(order => !orderIds.includes(order.orderId))
            .reduce((sum, order) => sum + order.salePrice, 0),
        }

        queryClient.setQueryData<SupplyDetailResponse>(
          suppliesQueryKeys.detail(supplyId),
          updatedSupply
        )
      }

      return { previousSupply }
    },

    onSuccess: data => {
      const count = data.removedCount
      toast.success(count === 1 ? 'Заказ удалён из поставки' : `Удалено заказов: ${count}`)
    },

    onError: (error, _orderIds, context) => {
      // Rollback to previous value on error
      if (context?.previousSupply) {
        queryClient.setQueryData<SupplyDetailResponse>(
          suppliesQueryKeys.detail(supplyId),
          context.previousSupply
        )
      }

      toast.error(error.message || 'Не удалось удалить заказы')
    },

    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: suppliesQueryKeys.detail(supplyId),
      })
      // Also invalidate the supplies list
      queryClient.invalidateQueries({
        queryKey: suppliesQueryKeys.all,
      })
    },
  })
}
