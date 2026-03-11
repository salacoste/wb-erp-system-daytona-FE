// ============================================================================
// Delete Tariff Version Hook
// Epic 52-FE: Story 52-FE.5 - Delete Scheduled Version
// Mutation hook for deleting scheduled tariff versions
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteTariffVersion } from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from '@/hooks/tariff-query-keys'

/**
 * Custom error interface for API errors with status
 */
interface ApiError extends Error {
  status?: number
}

/**
 * Hook for deleting scheduled tariff versions
 *
 * Features:
 * - Automatically invalidates version history cache on success
 * - Shows success/error toasts
 * - Handles specific error codes (400, 404)
 *
 * @returns Mutation object with mutate function and status
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteTariffVersion()
 *
 * const handleDelete = (versionId: number) => {
 *   mutate(versionId, {
 *     onSuccess: () => setDialogOpen(false),
 *   })
 * }
 * ```
 */
export function useDeleteTariffVersion() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, number>({
    mutationFn: (versionId: number) => deleteTariffVersion(versionId),
    onSuccess: () => {
      // Invalidate version history to trigger refetch
      queryClient.invalidateQueries({
        queryKey: tariffQueryKeys.versionHistory(),
      })
      // Also invalidate audit log as delete is recorded there
      queryClient.invalidateQueries({
        queryKey: tariffQueryKeys.all,
      })
      toast.success('Запланированная версия удалена')
    },
    onError: (error: ApiError) => {
      // Handle specific error codes with Russian messages
      if (error.status === 400) {
        toast.error('Нельзя удалить активную или истекшую версию')
      } else if (error.status === 404) {
        toast.error('Версия не найдена')
      } else if (error.status === 403) {
        toast.error('Недостаточно прав для удаления версии')
      } else {
        toast.error('Ошибка при удалении версии')
      }
    },
  })
}
