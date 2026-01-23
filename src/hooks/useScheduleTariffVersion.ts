/**
 * useScheduleTariffVersion Hook
 * Story 52-FE.3: Schedule Future Version
 * Epic 52-FE: Tariff Settings Admin UI
 *
 * React Query mutation hook for scheduling future tariff versions
 * Handles API calls, error handling, and cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { scheduleTariffVersion } from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from '@/hooks/tariff-query-keys'
import { handleTariffApiError } from '@/lib/tariff-error-handler'
import type { ScheduleTariffVersionDto, TariffVersion } from '@/types/tariffs-admin'

export interface UseScheduleTariffVersionOptions {
  /** Called on successful scheduling */
  onSuccess?: (data: TariffVersion, effectiveFrom: string) => void
  /** Called on error */
  onError?: (error: unknown) => void
}

/**
 * Format date for display in Russian locale
 */
function formatDateRu(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Hook for scheduling future tariff versions
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useScheduleTariffVersion({
 *   onSuccess: () => setModalOpen(false),
 * })
 *
 * mutate({
 *   effective_from: '2026-02-01',
 *   ...tariffSettings,
 * })
 * ```
 */
export function useScheduleTariffVersion(
  options?: UseScheduleTariffVersionOptions
) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: ScheduleTariffVersionDto) => scheduleTariffVersion(data),

    onSuccess: (data, variables) => {
      // Show success toast with formatted date
      const formattedDate = formatDateRu(variables.effective_from)
      toast.success(`Версия запланирована на ${formattedDate}`)

      // Invalidate history query to refresh the list
      queryClient.invalidateQueries({
        queryKey: tariffQueryKeys.versionHistory(),
      })

      // Call custom success handler
      options?.onSuccess?.(data, variables.effective_from)
    },

    onError: (error) => {
      // Use centralized error handler
      handleTariffApiError(error, router)

      // Call custom error handler
      options?.onError?.(error)
    },
  })
}
