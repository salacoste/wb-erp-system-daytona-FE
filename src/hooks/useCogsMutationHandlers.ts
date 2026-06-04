'use client'

/**
 * Callback handlers for COGS assignment mutation with margin polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 *
 * Extracted from useSingleCogsAssignmentWithPolling.ts (Epic 74, Story 74.4)
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { formatPercentage } from '@/lib/utils'

/**
 * Invalidate and refetch all product-related queries
 * Used after margin is calculated or COGS assignment succeeds with immediate margin
 */
export function invalidateProductQueries(queryClient: QueryClient, nmId?: string | null) {
  queryClient.invalidateQueries({ queryKey: ['products'] })
  if (nmId) {
    queryClient.invalidateQueries({ queryKey: ['products', nmId] })
  }
  queryClient.invalidateQueries({ queryKey: ['analytics'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })

  // Force immediate refetch of active product queries
  queryClient
    .refetchQueries({
      queryKey: ['products'],
      exact: false,
      type: 'active',
    })
    .catch(error => {
      console.error('[COGS Polling] Refetch error:', error)
    })
}

/**
 * Hook that provides memoized polling event handlers.
 *
 * Returns success, timeout, and error handlers for margin polling.
 * Each handler manages toast notifications, query invalidation, and polling state cleanup.
 */
export function usePollingHandlers(
  pollingNmId: string | null,
  removePollingProduct: (nmId: string) => void,
  setPollingConfig: (config: null) => void,
  setPollingNmId: (nmId: null) => void
) {
  const queryClient = useQueryClient()

  const handlePollingSuccess = useCallback(
    (marginPct: number) => {
      const marginText =
        marginPct != null && typeof marginPct === 'number'
          ? formatPercentage(marginPct, 2)
          : 'рассчитана'

      toast.success('Маржа рассчитана', {
        description: `Маржинальность: ${marginText}`,
      })

      invalidateProductQueries(queryClient, pollingNmId)

      // Stop polling
      if (pollingNmId) {
        removePollingProduct(pollingNmId)
      }
      setPollingConfig(null)
      setPollingNmId(null)
    },
    [pollingNmId, queryClient, removePollingProduct, setPollingConfig, setPollingNmId]
  )

  const handlePollingTimeout = useCallback(() => {
    toast.warning('Расчёт маржи занимает больше времени', {
      description: 'Обновите страницу через минуту, чтобы увидеть результат',
    })

    if (pollingNmId) {
      removePollingProduct(pollingNmId)
    }
    setPollingConfig(null)
    setPollingNmId(null)
  }, [pollingNmId, removePollingProduct, setPollingConfig, setPollingNmId])

  const handlePollingError = useCallback(
    (error: Error) => {
      console.error('[Margin Polling] Error:', error)
      if (pollingNmId) {
        removePollingProduct(pollingNmId)
      }
    },
    [pollingNmId, removePollingProduct]
  )

  return { queryClient, handlePollingSuccess, handlePollingTimeout, handlePollingError }
}
