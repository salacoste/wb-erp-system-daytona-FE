/**
 * Hook for manually triggering margin recalculation
 * Request #17: COGS Assigned After Completed Week - Manual Recalculation Required
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export interface ManualRecalculationPayload {
  weeks: string[] // ISO weeks (e.g., ["2025-W46"])
  nm_ids?: string[] // Optional: specific products
}

export interface ManualRecalculationResponse {
  task_uuid: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  enqueued_at: string
}

/**
 * Hook to manually trigger margin recalculation for specific weeks
 * 
 * @example
 * const { mutate: recalculate, isPending } = useManualMarginRecalculation();
 * 
 * recalculate({
 *   weeks: ["2025-W46"],
 *   nm_ids: ["321678606"] // Optional
 * });
 */
export function useManualMarginRecalculation() {
  const queryClient = useQueryClient()
  const { cabinetId } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: ManualRecalculationPayload): Promise<ManualRecalculationResponse> => {
      if (!cabinetId) {
        throw new Error('Cabinet ID is required')
      }

      try {
        console.info('[Manual Recalculation] Triggering recalculation:', payload)

        const response = await apiClient.post<ManualRecalculationResponse>(
          '/v1/tasks/enqueue',
          {
            task_type: 'recalculate_weekly_margin',
            payload: {
              cabinet_id: cabinetId,
              weeks: payload.weeks,
              nm_ids: payload.nm_ids || undefined,
            },
          }
        )

        console.info('[Manual Recalculation] Task enqueued:', response.task_uuid)

        return response
      } catch (error) {
        console.error('[Manual Recalculation] Failed to enqueue task:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      toast.success('Пересчет маржи запущен', {
        description: `Задача ${data.task_uuid.substring(0, 8)}... поставлена в очередь. Ожидайте 5-30 секунд.`,
      })

      // Invalidate product queries to refresh margin data after recalculation
      // Note: We don't know exactly when recalculation will complete, so we'll rely on polling
      // or user refresh. But we can invalidate to ensure fresh data on next fetch.
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: Error) => {
      toast.error('Ошибка запуска пересчета', {
        description: error.message || 'Не удалось запустить пересчет маржи. Попробуйте позже.',
      })
    },
  })
}

