/**
 * Hook combining COGS assignment with automatic margin polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 * Request #21: Updated to use lightweight margin-status endpoint (Epic 22)
 * 
 * Uses GET /v1/products/:nmId/margin-status for efficient polling
 * Polling strategy: 2.5s interval, 60s timeout (24 attempts)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useSingleCogsAssignment } from './useSingleCogsAssignment'
import { useMarginPollingWithQuery } from './useMarginPollingWithQuery'
import {
  getPollingStrategy,
  type PollingConfig,
} from '@/lib/margin-helpers'
import { useMarginPollingStore } from '@/stores/marginPollingStore'
import type { SingleCogsAssignmentParams } from './useSingleCogsAssignment'

/**
 * Hook that combines COGS assignment with automatic margin polling
 * Automatically starts polling after successful COGS assignment
 *
 * @example
 * const { mutate, isPending, isPolling } = useSingleCogsAssignmentWithPolling();
 *
 * mutate({
 *   nmId: '12345678',
 *   cogs: {
 *     unit_cost_rub: 1250.50,
 *     valid_from: '2025-11-23',
 *   }
 * });
 */
export function useSingleCogsAssignmentWithPolling() {
  const queryClient = useQueryClient()
  const [pollingConfig, setPollingConfig] = useState<PollingConfig | null>(null)
  const [pollingNmId, setPollingNmId] = useState<string | null>(null)
  const { addPollingProduct, removePollingProduct } = useMarginPollingStore()
  
  // DEBUG: Log state changes
  useEffect(() => {
    console.log('🔄 [Polling Hook] State changed:', {
      pollingNmId,
      pollingConfig,
      hasNmId: pollingNmId !== null && pollingNmId.trim() !== '',
      hasConfig: pollingConfig !== null,
    })
  }, [pollingNmId, pollingConfig])

  // COGS assignment mutation
  const assignmentMutation = useSingleCogsAssignment()

  // CRITICAL: Memoize strategy to prevent unnecessary useEffect re-runs in useMarginPolling
  // Only create new strategy object when pollingConfig actually changes
  // This ensures useMarginPolling's useEffect doesn't restart unnecessarily
  // Request #21: Updated polling strategy based on backend recommendations
  // - Interval: 2-3 seconds (using 2500ms = 2.5s)
  // - Timeout: 60 seconds for single product (24 attempts × 2.5s = 60s)
  const pollingStrategy = useMemo(() => {
    return pollingConfig || {
      interval: 2500, // 2.5 seconds (Request #21 recommendation: 2-3s)
      maxAttempts: 24, // 24 attempts × 2.5s = 60s timeout (Request #21 recommendation: 60s for single product)
      estimatedTime: 10000, // 10 seconds estimated (Request #14: 5-10s for single product)
    }
  }, [pollingConfig])

  // Memoize callbacks to prevent unnecessary re-renders of useMarginPolling
  const handlePollingSuccess = useCallback((marginPct: number) => {
      // Margin calculated successfully
      // marginPct is guaranteed to be a number (not null) when onSuccess is called
      const marginText = marginPct != null && typeof marginPct === 'number'
        ? `${marginPct.toFixed(2)}%`
        : 'рассчитана'
      
      toast.success('Маржа рассчитана', {
        description: `Маржинальность: ${marginText}`,
      })

      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', pollingNmId] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      // Force immediate refetch of all product queries (including ProductList)
      // This ensures UI updates even if staleTime hasn't expired
      // Use exact: false to match all queries starting with ['products']
      // Use type: 'active' to only refetch queries for currently mounted components
      // Note: refetchQueries returns a Promise, but we don't need to await it
    console.log('🔄 [Polling Hook] Invalidating and refetching product queries...')
      queryClient.refetchQueries({ 
        queryKey: ['products'],
        exact: false, // Match all queries starting with ['products'] (including ['products', filters])
        type: 'active' // Only refetch active queries (currently mounted components)
    }).then(() => {
      console.log('✅ [Polling Hook] Product queries refetched successfully')
      // Log current cache state
      const cache = queryClient.getQueryCache()
      const productQueries = cache.findAll({ queryKey: ['products'], exact: false })
      console.log('🔍 [Polling Hook] Active product queries after refetch:', productQueries.length)
      productQueries.forEach((query) => {
        console.log('  Query key:', query.queryKey)
        console.log('  Query state:', query.state.status)
        if (query.state.data) {
          const data = query.state.data as { products?: Array<{ nm_id: string; current_margin_pct?: number | null }> }
          if (data.products) {
            const productWithMargin = data.products.find((p) => p.nm_id === pollingNmId)
            if (productWithMargin) {
              console.log(`  Product ${pollingNmId} margin in cache:`, productWithMargin.current_margin_pct)
            }
          }
        }
      })
      }).catch((error) => {
        // Silently handle refetch errors - not critical for UX
      console.error('❌ [Margin Polling] Refetch error:', error)
      })

      // Stop polling
      if (pollingNmId) {
        removePollingProduct(pollingNmId)
      }
      setPollingConfig(null)
      setPollingNmId(null)
  }, [pollingNmId, queryClient, removePollingProduct])

  const handlePollingTimeout = useCallback(() => {
      // Polling timed out
      toast.warning('Расчёт маржи занимает больше времени', {
        description: 'Обновите страницу через минуту, чтобы увидеть результат',
      })

      // Stop polling
      if (pollingNmId) {
        removePollingProduct(pollingNmId)
      }
      setPollingConfig(null)
      setPollingNmId(null)
  }, [pollingNmId, removePollingProduct])

  const handlePollingError = useCallback((error: Error) => {
      console.error('[Margin Polling] Error:', error)
      // Don't show error toast - polling errors are not critical
      // User can manually refresh if needed
      // Remove from polling store
      if (pollingNmId) {
        removePollingProduct(pollingNmId)
      }
  }, [pollingNmId, removePollingProduct])

  // CRITICAL: Memoize polling options to ensure stable reference
  // Only recreate object when dependencies actually change
  // This prevents unnecessary re-runs in useMarginPollingWithQuery
  // Compute enabled directly here to ensure it's always up-to-date
  const pollingOptions = useMemo(() => {
    const enabled = pollingConfig !== null && pollingNmId !== null && pollingNmId.trim() !== ''
    console.log('🔍 [Polling Options] useMemo recalculated:', {
      pollingNmId,
      pollingConfig,
      enabled,
      hasNmId: pollingNmId !== null && pollingNmId.trim() !== '',
      hasConfig: pollingConfig !== null,
    })
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

  // Margin polling hook using TanStack Query (enabled when pollingConfig is set)
  // CRITICAL: Pass memoized options to ensure React correctly tracks changes
  // This ensures useMarginPollingWithQuery sees updates immediately when pollingNmId or pollingConfig change
  const polling = useMarginPollingWithQuery(pollingOptions)

  // Handle "completed without margin" case
  // This happens when backend status is 'completed' but margin is null
  // (e.g., no sales data, COGS date after week midpoint - see COGS Temporal Lookup Strategy in CLAUDE.md)
  useEffect(() => {
    if (polling.completedWithoutMargin && pollingNmId) {
      console.log('ℹ️ [Polling Hook] Polling completed without margin (expected for no sales data or COGS date mismatch)')

      // Show informational message
      toast.info('Маржа не может быть рассчитана', {
        description: 'Возможные причины: нет данных о продажах или дата себестоимости не применима к текущей неделе',
      })

      // Invalidate and refetch queries to update UI
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', pollingNmId] })
      queryClient.refetchQueries({
        queryKey: ['products'],
        exact: false,
        type: 'active',
      }).catch((error) => {
        console.error('❌ [Polling Hook] Refetch error:', error)
      })

      // Stop polling
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
  const mutate = (
    params: SingleCogsAssignmentParams,
    options?: {
      onSuccess?: (data: unknown) => void
      onError?: (error: Error) => void
    },
  ) => {
    assignmentMutation.mutate(params, {
      onSuccess: (response) => {
        // DEBUG: Log response in polling hook
        console.group('🔍 [Polling Hook DEBUG] COGS Assignment Response')
        console.log('Response received:', response)
        console.log('Response type:', typeof response)
        if (typeof response === 'object' && response !== null) {
          console.log('Response keys:', Object.keys(response as unknown as Record<string, unknown>))
          console.log('current_margin_pct:', {
            value: response.current_margin_pct,
            type: typeof response.current_margin_pct,
            isNull: response.current_margin_pct === null,
            isUndefined: response.current_margin_pct === undefined,
            isNumber: typeof response.current_margin_pct === 'number',
            isFinite: typeof response.current_margin_pct === 'number' && Number.isFinite(response.current_margin_pct),
          })
          console.log('missing_data_reason:', response.missing_data_reason)
          console.log('has_cogs:', response.has_cogs)
        }
        console.groupEnd()

        // Show success toast for COGS assignment
        toast.success('Себестоимость назначена успешно', {
          description: `${params.nmId}: ${params.cogs.unit_cost_rub.toFixed(2)} ₽`,
        })

        // Check if margin is already available
        // Use != null to check both null and undefined (defensive programming)
        const marginPct = response.current_margin_pct
        console.log('🔍 [Polling Hook] Checking margin:', {
          marginPct,
          type: typeof marginPct,
          isNull: marginPct === null,
          isUndefined: marginPct === undefined,
          isNumber: typeof marginPct === 'number',
          isFinite: typeof marginPct === 'number' && Number.isFinite(marginPct),
          checkResult: marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct),
        })
        
        if (marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)) {
          console.log('✅ [Polling Hook] Margin available immediately, skipping polling')
          // Margin already calculated - no need to poll
          toast.success('Маржа рассчитана', {
            description: `Маржинальность: ${marginPct.toFixed(2)}%`,
          })

          // Invalidate all product-related queries
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['products', params.nmId] })
          queryClient.invalidateQueries({ queryKey: ['analytics'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          
          // Force immediate refetch of all product queries (including ProductList)
          // This ensures UI updates even if staleTime hasn't expired
          // Use exact: false to match all queries starting with ['products']
          // Use type: 'active' to only refetch queries for currently mounted components
          // Note: refetchQueries returns a Promise, but we don't need to await it
          queryClient.refetchQueries({ 
            queryKey: ['products'],
            exact: false, // Match all queries starting with ['products'] (including ['products', filters])
            type: 'active' // Only refetch active queries (currently mounted components)
          }).catch((error) => {
            // Silently handle refetch errors - not critical for UX
            console.error('[COGS Assignment] Refetch error:', error)
          })

          // Call user's onSuccess callback
          options?.onSuccess?.(response)
          return
        }

        console.log('⚠️ [Polling Hook] Margin not available, checking if polling needed...')
        console.log('Response has_cogs:', response.has_cogs)
        console.log('Response is_orphan:', response.is_orphan)

        // Margin not available yet - start polling (but skip for orphan products)
        // Orphan products don't exist in WB API and have no sales data, so margin calculation is not applicable
        const hasCogs = response.has_cogs
        const isOrphan = response.is_orphan === true

        if (isOrphan) {
          console.log('ℹ️ [Polling Hook] Skipping polling for orphan product (not in WB API)')
          // Orphan products can't have margin calculated - no polling needed
          // Just invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['products', params.nmId] })
          options?.onSuccess?.(response)
          return
        }

        if (hasCogs) {
          console.log('🔄 [Polling Hook] Starting polling for margin calculation...')
          // Determine polling strategy based on COGS valid_from date
          const strategy = getPollingStrategy(params.cogs.valid_from, false)

          // Show polling started notification
          const estimatedSeconds = Math.round(strategy.estimatedTime / 1000)
          toast.info('Расчёт маржи начат...', {
            description: `Ожидаемое время: ~${estimatedSeconds}с`,
          })

          // Start polling
          console.log('🔍 [Polling Hook] Setting polling state:', {
            nmId: params.nmId,
            strategy,
          })
          
          // CRITICAL: Set state synchronously using flushSync to ensure useMarginPolling sees the change immediately
          // React batches state updates, so we need flushSync to force immediate re-render
          // This ensures pollingOptions useMemo recalculates and useMarginPollingWithQuery receives updated props
          flushSync(() => {
          setPollingNmId(params.nmId)
          setPollingConfig(strategy)
          })
          addPollingProduct(params.nmId) // Add to store for ProductList display
          
          console.log('✅ [Polling Hook] Polling state set:', {
            pollingNmId: params.nmId,
            pollingConfig: strategy,
            // Note: These values won't be updated until next render
            // But useMarginPolling should see them in the next render cycle
          })
          
          // CRITICAL: Force a re-render by using setTimeout to ensure state updates are processed
          // This ensures useMarginPolling sees the updated pollingNmId and pollingConfig
          // Backend recommendation: 200-300ms delay to handle React state update timing
          setTimeout(() => {
            console.log('🔍 [Polling Hook] State after setState (next tick):', {
              // These will be the new values after React processes the state update
              note: 'Check next render cycle for updated values',
              expectedNmId: params.nmId,
              expectedConfig: strategy,
            })
          }, 0)
        }

        // Call user's onSuccess callback
        options?.onSuccess?.(response)
      },
      onError: (error) => {
        // Show error toast
        toast.error('Ошибка при назначении себестоимости', {
          description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        })

        // Call user's onError callback
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
    // Polling state
    isPolling: polling.isPolling,
    pollingAttempts: polling.attempts,
    pollingTimeout: polling.timeout,
    margin: polling.margin,
    /** Whether polling completed but margin was not available (no sales data, COGS date mismatch) */
    completedWithoutMargin: polling.completedWithoutMargin,
  }
}

