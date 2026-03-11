/**
 * Mutation hook for editing existing COGS record
 * Story 5.2-fe: COGS Edit Dialog
 *
 * AC: 12, 19, 20, 21, 22, 23, 24
 * Reference: frontend/docs/stories/epic-5/story-5.2-fe-cogs-edit-dialog.md
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type {
  UpdateCogsRecordDto,
  EditCogsResponse,
  ApiError,
  UseCogsEditOptions,
} from './useCogsEdit-utils'

// Re-export types and validation utils for consumers
export type {
  UpdateCogsRecordDto,
  EditCogsResponse,
  ApiError,
  UseCogsEditOptions,
} from './useCogsEdit-utils'
export {
  hasCogsChanges,
  buildUpdatePayload,
  validateUnitCost,
  validateNotes,
} from './useCogsEdit-utils'

/**
 * Hook for editing existing COGS record
 *
 * Uses PATCH /v1/cogs/:cogsId endpoint which modifies existing record
 * (unlike POST which creates a new version)
 *
 * @param cogsId - ID of COGS record to edit
 * @param options - Callbacks for success/error handling
 */
export function useCogsEdit(cogsId: string, options: UseCogsEditOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateCogsRecordDto): Promise<EditCogsResponse> => {
      console.info(`[COGS Edit] Updating COGS ${cogsId}`, data)

      const response = await apiClient.patch<EditCogsResponse>(
        `/v1/cogs/${cogsId}`,
        data
      )

      console.info('[COGS Edit] Update successful', {
        cogs_id: response.cogs_id,
        margin_recalculation: response.margin_recalculation.triggered,
        affected_weeks: response.margin_recalculation.affected_weeks.length,
      })

      return response
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cogs-history-full'] })
      queryClient.invalidateQueries({ queryKey: ['cogs-history'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })

      const weeksCount = response.margin_recalculation.affected_weeks.length
      const estimatedTime = response.margin_recalculation.estimated_time_sec

      toast.success('COGS обновлён', {
        description:
          weeksCount > 0
            ? `Маржа будет пересчитана для ${weeksCount} недель (~${estimatedTime} сек)`
            : 'Изменения сохранены',
      })

      options.onSuccess?.(response)
    },

    onError: (error: ApiError) => {
      console.error('[COGS Edit] Update failed', error)

      const status = error.status || error.response?.status

      if (status === 400) {
        const errorMessage =
          error.response?.data?.message || 'Проверьте введённые данные'
        toast.error('Ошибка валидации', { description: errorMessage })
      } else if (status === 403) {
        toast.error('Недостаточно прав для редактирования')
      } else if (status === 404) {
        toast.error('Запись не найдена', {
          description: 'Возможно, была удалена другим пользователем',
        })
      } else {
        toast.error('Ошибка сохранения', { description: 'Попробуйте ещё раз' })
      }

      options.onError?.(error)
    },
  })
}
