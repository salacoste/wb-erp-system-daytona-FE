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

/**
 * Request DTO for updating COGS record
 * At least one field must be provided
 */
export interface UpdateCogsRecordDto {
  unit_cost_rub?: number
  notes?: string
}

/**
 * Response from PATCH /v1/cogs/:cogsId
 */
export interface EditCogsResponse {
  cogs_id: string
  nm_id: string
  unit_cost_rub: number
  currency: string
  valid_from: string
  valid_to: string | null
  source: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  margin_recalculation: {
    triggered: boolean
    task_uuid: string
    affected_weeks: string[]
    estimated_time_sec: number
  }
}

/**
 * API Error with status code
 */
interface ApiError extends Error {
  status?: number
  response?: {
    status: number
    data?: {
      message?: string
      errors?: Array<{ field: string; message: string }>
    }
  }
}

export interface UseCogsEditOptions {
  onSuccess?: (response: EditCogsResponse) => void
  onError?: (error: ApiError) => void
}

/**
 * Hook for editing existing COGS record
 *
 * Uses PATCH /v1/cogs/:cogsId endpoint which modifies existing record
 * (unlike POST which creates a new version)
 *
 * @param cogsId - ID of COGS record to edit
 * @param options - Callbacks for success/error handling
 *
 * @example
 * const mutation = useCogsEdit(cogsId, {
 *   onSuccess: () => closeDialog(),
 * });
 * mutation.mutate({ unit_cost_rub: 500.50 });
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
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['cogs-history-full'] })
      queryClient.invalidateQueries({ queryKey: ['cogs-history'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })

      // Show success toast with margin recalculation info (AC: 19, 20)
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

      // Handle specific HTTP status codes (AC: 21, 22, 23, 24)
      const status = error.status || error.response?.status

      if (status === 400) {
        // Validation errors (AC: 21)
        const errorMessage =
          error.response?.data?.message || 'Проверьте введённые данные'
        toast.error('Ошибка валидации', {
          description: errorMessage,
        })
      } else if (status === 403) {
        // Forbidden (AC: 22)
        toast.error('Недостаточно прав для редактирования')
      } else if (status === 404) {
        // Not found (AC: 23)
        toast.error('Запись не найдена', {
          description: 'Возможно, была удалена другим пользователем',
        })
      } else {
        // Network or other errors (AC: 24)
        toast.error('Ошибка сохранения', {
          description: 'Попробуйте ещё раз',
        })
      }

      options.onError?.(error)
    },
  })
}

/**
 * Validates if at least one field has changed (AC: 12)
 */
export function hasCogsChanges(
  original: { unit_cost_rub: number; notes: string | null },
  edited: { unit_cost_rub: number; notes: string }
): boolean {
  const costChanged = edited.unit_cost_rub !== original.unit_cost_rub
  const notesChanged = edited.notes !== (original.notes || '')
  return costChanged || notesChanged
}

/**
 * Builds the update payload, only including changed fields
 */
export function buildUpdatePayload(
  original: { unit_cost_rub: number; notes: string | null },
  edited: { unit_cost_rub: number; notes: string }
): UpdateCogsRecordDto {
  const payload: UpdateCogsRecordDto = {}

  if (edited.unit_cost_rub !== original.unit_cost_rub) {
    payload.unit_cost_rub = edited.unit_cost_rub
  }

  if (edited.notes !== (original.notes || '')) {
    payload.notes = edited.notes
  }

  return payload
}

/**
 * Validation helper for unit_cost_rub (AC: 10)
 */
export function validateUnitCost(value: string): string | null {
  if (!value.trim()) {
    return 'Себестоимость обязательна для заполнения'
  }

  // Check if the entire string is a valid number
  // parseFloat('12abc') returns 12, so we need strict check
  const trimmed = value.trim()
  const numValue = Number(trimmed)

  if (isNaN(numValue) || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return 'Введите числовое значение'
  }

  if (numValue <= 0) {
    return 'Себестоимость должна быть положительным числом'
  }

  return null
}

/**
 * Validation helper for notes (AC: 11)
 */
export function validateNotes(value: string): string | null {
  if (value.length > 1000) {
    return 'Максимум 1000 символов'
  }
  return null
}
