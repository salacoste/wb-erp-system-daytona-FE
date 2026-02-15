/**
 * useCloseSupply Mutation Hook
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Mutation hook for closing supplies with cache invalidation.
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { closeSupply, suppliesQueryKeys } from '@/lib/api/supplies'
import type { CloseSupplyResponse } from '@/types/supplies'

/** API Error interface for error handling */
interface ApiError extends Error {
  status?: number
  code?: string
}

/** Error codes from backend */
const ERROR_CODES = {
  EMPTY_SUPPLY: 'EMPTY_SUPPLY',
  ALREADY_CLOSED: 'ALREADY_CLOSED',
} as const

/** Error message mapping by code/status */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const apiError = error as ApiError

    // Check for specific error codes
    if (apiError.code === ERROR_CODES.EMPTY_SUPPLY) {
      return 'Невозможно закрыть пустую поставку'
    }
    if (apiError.code === ERROR_CODES.ALREADY_CLOSED) {
      return 'Поставка уже закрыта'
    }

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
    if (apiError.status === 404) {
      return 'Поставка не найдена'
    }
    if (apiError.status === 409) {
      return 'Поставка уже закрыта'
    }
    if (apiError.status === 500) {
      return 'Ошибка сервера. Попробуйте позже.'
    }

    return apiError.message
  }

  return 'Не удалось закрыть поставку'
}

/** Options for the useCloseSupply hook */
interface UseCloseSupplyOptions {
  /** Callback on successful close */
  onSuccess?: (data: CloseSupplyResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook for closing a supply
 *
 * @param options - Hook options
 * @returns Mutation object with mutate, mutateAsync, isPending, error
 *
 * @example
 * const { mutate, isPending } = useCloseSupply({
 *   onSuccess: () => console.log('Closed!'),
 * })
 * mutate('supply-001')
 */
export function useCloseSupply(options: UseCloseSupplyOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (supplyId: string) => {
      console.info('[useCloseSupply] Closing supply:', supplyId)
      return closeSupply(supplyId)
    },

    onSuccess: (data, supplyId) => {
      console.info('[useCloseSupply] Supply closed successfully:', supplyId)

      // Show success toast
      toast.success('Поставка закрыта')

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.detail(supplyId) })

      // Call user's onSuccess callback
      options.onSuccess?.(data)
    },

    onError: (error: Error, supplyId) => {
      console.error('[useCloseSupply] Failed to close supply:', supplyId, error)

      // Show error toast
      const message = getErrorMessage(error)
      toast.error(message)

      // Call user's onError callback
      options.onError?.(error)
    },
  })
}
