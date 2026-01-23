// ============================================================================
// Update Tariff Settings Hook
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Mutation hook for PUT/PATCH tariff settings updates
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  putTariffSettings,
  patchTariffSettings,
} from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from './tariff-query-keys'
import type {
  TariffSettingsDto,
  UpdateTariffSettingsDto,
} from '@/types/tariffs-admin'

interface UpdateTariffSettingsParams {
  data: UpdateTariffSettingsDto
  method: 'PUT' | 'PATCH'
}

interface ApiError {
  status?: number
  message?: string | string[]
  headers?: Headers
}

/**
 * Hook for updating tariff settings via PUT or PATCH
 *
 * Features:
 * - PUT for full replacement of all settings
 * - PATCH for partial updates (only changed fields)
 * - Success toast with Russian message
 * - Error handling: 400 validation, 403 forbidden, 429 rate limit
 * - Cache invalidation for settings and history
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateTariffSettings()
 *
 * // Full update
 * mutate({ data: allSettings, method: 'PUT' })
 *
 * // Partial update
 * mutate({ data: { storageFreeDays: 45 }, method: 'PATCH' })
 * ```
 */
export function useUpdateTariffSettings() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation<TariffSettingsDto, ApiError, UpdateTariffSettingsParams>({
    mutationFn: async ({ data, method }: UpdateTariffSettingsParams) => {
      if (method === 'PUT') {
        return putTariffSettings(data as TariffSettingsDto)
      }
      return patchTariffSettings(data)
    },
    onSuccess: () => {
      // Invalidate settings and history caches
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.settings() })
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.versionHistory() })
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.auditLog() })

      // Success toast (AC6)
      toast.success('Тарифы успешно обновлены')
    },
    onError: (error: ApiError) => {
      // Handle different error codes (AC7)
      if (error.status === 400) {
        // Validation errors - show inline (handled by form)
        const message = Array.isArray(error.message)
          ? error.message.join(', ')
          : error.message || 'Ошибка валидации'
        toast.error(message)
      } else if (error.status === 403) {
        toast.error('Требуется роль Admin')
        router.push('/dashboard')
      } else if (error.status === 429) {
        // Rate limit exceeded
        const resetHeader = error.headers?.get('X-RateLimit-Reset')
        const resetTime = resetHeader
          ? Math.ceil((Number(resetHeader) * 1000 - Date.now()) / 1000)
          : 60
        toast.error(`Превышен лимит запросов. Повторите через ${resetTime} сек.`)
      } else {
        toast.error('Ошибка при сохранении тарифов')
      }
    },
  })
}
