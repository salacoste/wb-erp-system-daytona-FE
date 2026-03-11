/**
 * Mutation hook for deleting COGS record (soft delete)
 * Story 5.3-fe: COGS Delete Confirmation Dialog
 *
 * AC: 13, 14, 15, 16, 17
 * Reference: frontend/docs/stories/epic-5/story-5.3-fe-cogs-delete-dialog.md
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { CogsHistoryItem, VersionChainInfo } from '@/types/cogs'

/**
 * Response from DELETE /v1/cogs/:cogsId
 */
export interface DeleteCogsResponse {
  deleted: boolean
  cogs_id: string
  nm_id: string
  deletion_type: 'soft'
  can_restore: boolean
  previous_version_reopened: boolean
  margin_recalculation: {
    triggered: boolean
    task_uuid: string
    affected_weeks: string[]
    estimated_time_sec: number
  }
  message: string
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
    }
  }
}

export interface UseCogsDeleteOptions {
  onSuccess?: (response: DeleteCogsResponse) => void
  onError?: (error: ApiError) => void
}

/**
 * Hook for soft-deleting COGS record
 *
 * Uses DELETE /v1/cogs/:cogsId endpoint which performs soft delete
 * (sets is_active=false, record can be restored by admin)
 *
 * @param cogsId - ID of COGS record to delete
 * @param options - Callbacks for success/error handling
 *
 * @example
 * const mutation = useCogsDelete(cogsId, {
 *   onSuccess: () => closeDialog(),
 * });
 * mutation.mutate();
 */
export function useCogsDelete(cogsId: string, options: UseCogsDeleteOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<DeleteCogsResponse> => {
      console.info(`[COGS Delete] Deleting COGS ${cogsId}`)

      const response = await apiClient.delete<DeleteCogsResponse>(
        `/v1/cogs/${cogsId}`
      )

      console.info('[COGS Delete] Deletion successful', {
        cogs_id: response.cogs_id,
        previous_version_reopened: response.previous_version_reopened,
        affected_weeks: response.margin_recalculation.affected_weeks.length,
      })

      return response
    },

    onSuccess: (response) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['cogs-history-full'] })
      queryClient.invalidateQueries({ queryKey: ['cogs-history'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })

      // Build description with version chain info (AC: 13, 14)
      let description =
        'При необходимости обратитесь к администратору для восстановления'
      if (response.previous_version_reopened) {
        description = 'Предыдущая версия COGS теперь активна. ' + description
      }

      // No undo option - soft delete allows admin recovery (AC: 14)
      toast.success('Запись COGS удалена', { description })

      options.onSuccess?.(response)
    },

    onError: (error: ApiError) => {
      console.error('[COGS Delete] Deletion failed', error)

      // Handle specific HTTP status codes (AC: 15, 16, 17)
      const status = error.status || error.response?.status

      if (status === 403) {
        // Forbidden (AC: 15)
        toast.error('Недостаточно прав для удаления')
      } else if (status === 404) {
        // Not found or already deleted (AC: 16)
        toast.error('Запись не найдена или уже удалена')
      } else {
        // Network or other errors (AC: 17)
        toast.error('Ошибка удаления', {
          description: 'Попробуйте ещё раз',
        })
      }

      options.onError?.(error)
    },
  })
}

/**
 * Analyzes version chain for delete confirmation logic
 * Story 5.3-fe: Determine what warnings to show
 *
 * @param record - The COGS record being deleted
 * @param history - All COGS history items for this product
 */
export function analyzeVersionChain(
  record: CogsHistoryItem,
  history: CogsHistoryItem[]
): VersionChainInfo {
  // Check if this is the current version (no end date)
  const isCurrentVersion = record.valid_to === null

  // Find previous version (valid_to === this record's valid_from)
  const previousVersion = history.find(
    (r) =>
      r.valid_to === record.valid_from &&
      r.is_active &&
      r.cogs_id !== record.cogs_id
  )
  const hasPreviousVersion = !!previousVersion

  // Check if this is the only active version
  const activeVersions = history.filter((r) => r.is_active)
  const isOnlyVersion = activeVersions.length === 1

  return {
    isCurrentVersion,
    hasPreviousVersion,
    isOnlyVersion,
    previousVersionCost: previousVersion?.unit_cost_rub,
    previousVersionDate: previousVersion?.valid_from,
  }
}

/**
 * Formats date for display in Russian locale
 */
export function formatDateForDelete(dateStr: string | null): string {
  if (!dateStr) return 'текущий'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/**
 * Formats currency for display in Russian locale
 */
export function formatCurrencyForDelete(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
