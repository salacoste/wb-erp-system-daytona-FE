/**
 * useCreateSupply Mutation Hook
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Mutation hook for creating new supplies with optimistic updates.
 * Handles cache management, navigation, and error handling.
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupply, suppliesQueryKeys } from '@/lib/api/supplies'
import type { CreateSupplyRequest, SuppliesListResponse, SupplyListItem } from '@/types/supplies'

/** API Error interface for error handling */
interface ApiError extends Error {
  status?: number
  code?: string
}

/** Error message mapping by status code */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const apiError = error as ApiError

    // Check for network error
    if (apiError.status === 0 || apiError.message === 'Failed to fetch') {
      return 'Проверьте соединение и попробуйте снова'
    }

    // Map status codes to Russian error messages
    if (apiError.status === 400) {
      return 'Неверные данные запроса'
    }
    if (apiError.status === 403) {
      return 'Нет доступа к этому кабинету'
    }
    if (apiError.status === 429) {
      return 'Слишком много запросов. Подождите.'
    }
    if (apiError.status === 500) {
      return 'Ошибка сервера. Попробуйте позже.'
    }

    return apiError.message
  }

  return 'Проверьте соединение и попробуйте снова'
}

/**
 * Hook for creating new supplies with optimistic updates
 *
 * @returns Mutation object with mutate, mutateAsync, isPending, error, data
 *
 * @example
 * const { mutate, isPending } = useCreateSupply()
 * mutate({ name: 'Моя поставка' })
 */
export function useCreateSupply() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: CreateSupplyRequest) => {
      // Normalize empty string to undefined
      const normalizedData: CreateSupplyRequest = {
        name: data.name?.trim() || undefined,
      }
      return createSupply(normalizedData)
    },

    onMutate: async variables => {
      // Cancel outgoing refetches to avoid optimistic update being overwritten
      await queryClient.cancelQueries({ queryKey: suppliesQueryKeys.all })

      // Snapshot previous value for rollback
      const previousSupplies = queryClient.getQueryData<SuppliesListResponse>(
        suppliesQueryKeys.list({})
      )

      // Create optimistic supply
      const optimisticSupply: SupplyListItem = {
        id: `temp-${Date.now()}`,
        wbSupplyId: null,
        name: variables.name?.trim() || 'Новая поставка...',
        status: 'OPEN',
        ordersCount: 0,
        totalValue: 0,
        createdAt: new Date().toISOString(),
        closedAt: null,
        syncedAt: null,
      }

      // Optimistically add new supply to list
      queryClient.setQueryData<SuppliesListResponse>(suppliesQueryKeys.list({}), old => {
        if (!old) {
          return {
            items: [optimisticSupply],
            pagination: { total: 1, limit: 20, offset: 0 },
            filters: { status: null, from: null, to: null },
          }
        }

        return {
          ...old,
          items: [optimisticSupply, ...old.items],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1,
          },
        }
      })

      return { previousSupplies }
    },

    onSuccess: data => {
      console.info('[useCreateSupply] Supply created successfully:', data.id)

      // Navigate to supply detail page
      router.push(`/supplies/${data.id}`)
    },

    onError: (error, _variables, context) => {
      console.error('[useCreateSupply] Failed to create supply:', error)

      // Rollback optimistic update
      if (context?.previousSupplies) {
        queryClient.setQueryData(suppliesQueryKeys.list({}), context.previousSupplies)
      }

      // Show error toast
      const message = getErrorMessage(error)
      toast.error(`Не удалось создать поставку: ${message}`)
    },

    onSettled: () => {
      // Always refetch to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })
    },
  })
}
