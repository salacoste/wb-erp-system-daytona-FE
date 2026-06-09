'use client'

import { logger } from '@/lib/logger'

/**
 * Hook combining COGS assignment with automatic margin polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 * Request #21: Updated to use lightweight margin-status endpoint (Epic 22)
 *
 * Split into:
 * - cogs-assignment-polling-types.ts: return type, mutation option types
 * - useCogsMutationHandlers.ts: polling event handlers, query invalidation
 * - this file: hook composition, mutation wrapper, polling orchestration
 */

import { useState, useEffect, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { useSingleCogsAssignment } from './useSingleCogsAssignment'
import { useMarginPollingWithQuery } from './useMarginPollingWithQuery'
import { getPollingStrategy, type PollingConfig } from '@/lib/margin-helpers'
import { formatPercentage } from '@/lib/utils'
import { useMarginPollingStore } from '@/stores/marginPollingStore'
import { usePollingHandlers, invalidateProductQueries } from './useCogsMutationHandlers'
import type { SingleCogsAssignmentParams } from './useSingleCogsAssignment'
import type { CogsMutationCallbackOptions } from './cogs-assignment-polling-types'

// Re-export types for backward compatibility
export type {
  CogsMutationCallbackOptions,
  UseSingleCogsAssignmentWithPollingResult,
} from './cogs-assignment-polling-types'

/**
 * Hook that combines COGS assignment with automatic margin polling
 * Automatically starts polling after successful COGS assignment
 */
export function useSingleCogsAssignmentWithPolling() {
  const [pollingConfig, setPollingConfig] = useState<PollingConfig | null>(null)
  const [pollingNmId, setPollingNmId] = useState<string | null>(null)
  const { addPollingProduct, removePollingProduct } = useMarginPollingStore()

  const assignmentMutation = useSingleCogsAssignment()

  // Memoize strategy (Request #21: 2.5s interval, 60s timeout)
  const pollingStrategy = useMemo(() => {
    return pollingConfig || { interval: 2500, maxAttempts: 24, estimatedTime: 10000 }
  }, [pollingConfig])

  // Polling event handlers from extracted hook
  const { queryClient, handlePollingSuccess, handlePollingTimeout, handlePollingError } =
    usePollingHandlers(pollingNmId, removePollingProduct, setPollingConfig, setPollingNmId)

  // Memoize polling options for useMarginPollingWithQuery
  const pollingOptions = useMemo(() => {
    const enabled = pollingConfig !== null && pollingNmId !== null && pollingNmId.trim() !== ''
    return {
      nmId: pollingNmId || '',
      enabled,
      strategy: pollingStrategy,
      onSuccess: handlePollingSuccess,
      onTimeout: handlePollingTimeout,
      onError: handlePollingError,
    }
  }, [
    pollingNmId,
    pollingConfig,
    pollingStrategy,
    handlePollingSuccess,
    handlePollingTimeout,
    handlePollingError,
  ])

  const polling = useMarginPollingWithQuery(pollingOptions)

  // Handle "completed without margin" case (no sales data, COGS date mismatch)
  useEffect(() => {
    if (polling.completedWithoutMargin && pollingNmId) {
      logger.debug(
        '[Polling Hook] Polling completed without margin (no sales data or COGS date mismatch)'
      )
      toast.info('Маржа не может быть рассчитана', {
        description:
          'Возможные причины: нет данных о продажах или дата себестоимости не применима к текущей неделе',
      })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', pollingNmId] })
      queryClient
        .refetchQueries({ queryKey: ['products'], exact: false, type: 'active' })
        .catch(error => {
          logger.error('[Polling Hook] Refetch error:', error)
        })
      removePollingProduct(pollingNmId)
      setPollingConfig(null)
      setPollingNmId(null)
    }
  }, [polling.completedWithoutMargin, pollingNmId, queryClient, removePollingProduct])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingNmId) {
        removePollingProduct(pollingNmId)
      }
    }
  }, [pollingNmId, removePollingProduct])

  // Wrapper for mutate that starts polling after success
  const mutate = (params: SingleCogsAssignmentParams, options?: CogsMutationCallbackOptions) => {
    assignmentMutation.mutate(params, {
      onSuccess: response => {
        toast.success('Себестоимость назначена успешно', {
          description: `${params.nmId}: ${params.cogs.unit_cost_rub.toFixed(2)} ₽`,
        })

        // Check if margin is already available
        const marginPct = response.current_margin_pct
        if (marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)) {
          logger.debug('[Polling Hook] Margin available immediately, skipping polling')
          toast.success('Маржа рассчитана', {
            description: `Маржинальность: ${formatPercentage(marginPct, 2)}`,
          })
          invalidateProductQueries(queryClient, params.nmId)
          options?.onSuccess?.(response)
          return
        }

        // Skip polling for orphan products (not in WB API)
        if (response.is_orphan === true) {
          logger.debug('[Polling Hook] Skipping polling for orphan product (not in WB API)')
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['products', params.nmId] })
          options?.onSuccess?.(response)
          return
        }

        // Start polling if COGS assigned
        if (response.has_cogs) {
          logger.debug('[Polling Hook] Starting polling for margin calculation...')
          const strategy = getPollingStrategy(params.cogs.valid_from, false)
          const estimatedSeconds = Math.round(strategy.estimatedTime / 1000)
          toast.info('Расчёт маржи начат...', {
            description: `Ожидаемое время: ~${estimatedSeconds}с`,
          })

          // CRITICAL: flushSync ensures useMarginPollingWithQuery sees changes immediately
          flushSync(() => {
            setPollingNmId(params.nmId)
            setPollingConfig(strategy)
          })
          addPollingProduct(params.nmId)
        }

        options?.onSuccess?.(response)
      },
      onError: error => {
        toast.error('Ошибка при назначении себестоимости', {
          description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        })
        options?.onError?.(error)
      },
    })
  }

  return {
    mutate,
    isPending: assignmentMutation.isPending,
    isSuccess: assignmentMutation.isSuccess,
    isError: assignmentMutation.isError,
    error: assignmentMutation.error,
    data: assignmentMutation.data,
    isPolling: polling.isPolling,
    pollingAttempts: polling.attempts,
    pollingTimeout: polling.timeout,
    margin: polling.margin,
    completedWithoutMargin: polling.completedWithoutMargin,
  }
}
