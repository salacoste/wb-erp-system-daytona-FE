/**
 * useGenerateStickers Mutation Hook
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Mutation hook for generating stickers with cache invalidation.
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { generateStickers, suppliesQueryKeys } from '@/lib/api/supplies'
import type { StickerFormat, GenerateStickersResponse } from '@/types/supplies'

/** API Error interface for error handling */
interface ApiError extends Error {
  status?: number
  code?: string
}

/** Error codes from backend */
const ERROR_CODES = {
  INVALID_FORMAT: 'INVALID_FORMAT',
  WRONG_STATUS: 'WRONG_STATUS',
  GENERATION_FAILED: 'GENERATION_FAILED',
} as const

/** Error message mapping by code/status */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const apiError = error as ApiError

    // Check for specific error codes
    if (apiError.code === ERROR_CODES.INVALID_FORMAT) {
      return 'Неверный формат стикеров'
    }
    if (apiError.code === ERROR_CODES.WRONG_STATUS) {
      return 'Стикеры доступны только для закрытых поставок'
    }
    if (apiError.code === ERROR_CODES.GENERATION_FAILED) {
      return 'Ошибка генерации стикеров'
    }

    // Check for network error
    if (apiError.status === 0 || apiError.message === 'Failed to fetch') {
      return 'Проверьте соединение и попробуйте снова'
    }

    // Map status codes
    if (apiError.status === 400) {
      return 'Неверный формат стикеров'
    }
    if (apiError.status === 403) {
      return 'Нет доступа к этой поставке'
    }
    if (apiError.status === 404) {
      return 'Поставка не найдена'
    }
    if (apiError.status === 500) {
      return 'Ошибка сервера. Попробуйте позже.'
    }

    return apiError.message
  }

  return 'Не удалось сгенерировать стикеры'
}

/** Request parameters for generating stickers */
interface GenerateStickersParams {
  supplyId: string
  format: StickerFormat
}

/** Options for the useGenerateStickers hook */
interface UseGenerateStickersOptions {
  /** Callback on successful generation */
  onSuccess?: (data: GenerateStickersResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook for generating stickers for a supply
 *
 * @param options - Hook options
 * @returns Mutation object with mutate, mutateAsync, isPending, error, data
 *
 * @example
 * const { mutate, isPending, data } = useGenerateStickers({
 *   onSuccess: (data) => downloadStickers(data),
 * })
 * mutate({ supplyId: 'supply-001', format: 'png' })
 */
export function useGenerateStickers(options: UseGenerateStickersOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ supplyId, format }: GenerateStickersParams) => {
      console.info('[useGenerateStickers] Generating stickers:', { supplyId, format })
      return generateStickers(supplyId, format)
    },

    onSuccess: (data, { supplyId }) => {
      console.info('[useGenerateStickers] Stickers generated successfully:', supplyId)

      // Invalidate supply detail to refresh documents list
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.detail(supplyId) })
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.documents(supplyId) })

      // Call user's onSuccess callback
      options.onSuccess?.(data)
    },

    onError: (error: Error, { supplyId, format }) => {
      console.error(
        '[useGenerateStickers] Failed to generate stickers:',
        { supplyId, format },
        error
      )

      // Show error toast
      const message = getErrorMessage(error)
      toast.error(message)

      // Call user's onError callback
      options.onError?.(error)
    },
  })
}
