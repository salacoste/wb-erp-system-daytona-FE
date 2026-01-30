/**
 * Hook combining bulk COGS assignment with automatic margin polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useBulkCogsAssignment } from './useBulkCogsAssignment'
import { getPollingStrategy } from '@/lib/margin-helpers'
import { useMarginPollingStore } from '@/stores/marginPollingStore'
import type { ProductListItem } from '@/types/cogs'
import type { BulkCogsAssignmentParams } from './useBulkCogsAssignment'

/**
 * Hook that combines bulk COGS assignment with automatic margin polling
 * Automatically starts polling after successful bulk assignment
 * Polls sample products (first 10) to check if margin calculation completed
 *
 * @example
 * const { mutate, isPending, isPolling } = useBulkCogsAssignmentWithPolling();
 *
 * mutate({
 *   items: [
 *     { nm_id: '12345678', unit_cost_rub: 1250.50, valid_from: '2025-11-23' },
 *     { nm_id: '87654321', unit_cost_rub: 850.00, valid_from: '2025-11-23' }
 *   ]
 * });
 */
export function useBulkCogsAssignmentWithPolling() {
  const queryClient = useQueryClient()
  const [isPolling, setIsPolling] = useState(false)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [pollingTimeout, setPollingTimeout] = useState(false)
  const [sampleNmIds, setSampleNmIds] = useState<string[]>([])
  const { addPollingProduct, removePollingProduct } = useMarginPollingStore()

  // Bulk COGS assignment mutation
  const assignmentMutation = useBulkCogsAssignment()

  // Bulk polling strategy
  const pollingStrategy = getPollingStrategy(new Date().toISOString(), true)

  // Polling effect for bulk operations
  useEffect(() => {
    if (!isPolling || sampleNmIds.length === 0) {
      return
    }

    let attemptCount = 0
    let intervalId: NodeJS.Timeout | null = null

    const poll = async () => {
      attemptCount++
      setPollingAttempts(attemptCount)

      try {
        // Poll sample products to check if margin calculation completed
        // Fetch first 10 products with COGS
        const response = await apiClient.get<{
          products: ProductListItem[]
          pagination: unknown
        }>('/v1/products?include_cogs=true&limit=10')

        // Check if any sample products have margin calculated
        const sampleProducts = response.products.filter(p => sampleNmIds.includes(p.nm_id))

        // If at least 50% of sample products have margin calculated, consider calculation complete
        // Check current_margin_pct (not just has_cogs) - margin is the actual calculated value
        const withMargin = sampleProducts.filter(
          p =>
            p.current_margin_pct != null &&
            typeof p.current_margin_pct === 'number' &&
            Number.isFinite(p.current_margin_pct)
        ).length

        if (withMargin >= sampleProducts.length * 0.5) {
          // Margin calculation completed for bulk
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }

          setIsPolling(false)
          setPollingAttempts(0)
          // Remove all sample products from polling store
          sampleNmIds.forEach(nmId => removePollingProduct(nmId))
          setSampleNmIds([])

          toast.success('Маржа рассчитана для всех товаров', {
            description: `Обработано ${sampleProducts.length} товаров`,
          })

          // Invalidate all product-related queries
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['analytics'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })

          // Force immediate refetch of all product queries (including ProductList)
          // This ensures UI updates even if staleTime hasn't expired
          // Use exact: false to match all queries starting with ['products']
          // Use type: 'active' to only refetch queries for currently mounted components
          // Note: refetchQueries returns a Promise, but we don't need to await it
          queryClient
            .refetchQueries({
              queryKey: ['products'],
              exact: false, // Match all queries starting with ['products'] (including ['products', filters])
              type: 'active', // Only refetch active queries (currently mounted components)
            })
            .catch(error => {
              // Silently handle refetch errors - not critical for UX
              console.error('[Bulk COGS Assignment] Refetch error:', error)
            })
          return
        }

        // Check if max attempts reached
        if (attemptCount >= pollingStrategy.maxAttempts) {
          // Timeout: Max attempts reached
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }

          setIsPolling(false)
          setPollingAttempts(0)
          setPollingTimeout(true)
          // Remove all sample products from polling store
          sampleNmIds.forEach(nmId => removePollingProduct(nmId))
          setSampleNmIds([])

          toast.warning('Расчёт маржи занимает больше времени', {
            description: 'Обновите страницу через минуту, чтобы увидеть результат',
          })
          return
        }
      } catch (error) {
        console.error('[Bulk Margin Polling] Error:', error)
        // Don't stop polling on error - continue trying
      }
    }

    // Start polling immediately (first attempt)
    poll()

    // Set up interval for subsequent attempts
    intervalId = setInterval(poll, pollingStrategy.interval)

    // Cleanup on unmount or when polling stops
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isPolling, sampleNmIds, pollingStrategy, queryClient, removePollingProduct])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sampleNmIds.forEach(nmId => removePollingProduct(nmId))
    }
  }, [sampleNmIds, removePollingProduct])

  // Wrapper for mutate that starts polling after success
  const mutate = (
    params: BulkCogsAssignmentParams,
    options?: {
      onSuccess?: (data: unknown) => void
      onError?: (error: Error) => void
    }
  ) => {
    assignmentMutation.mutate(params, {
      onSuccess: response => {
        // Show success toast for bulk COGS assignment
        const { succeeded, failed, marginRecalculation } = response.data
        toast.success('Себестоимость назначена', {
          description: `Успешно: ${succeeded}, Ошибок: ${failed}`,
        })

        // Start polling if any products succeeded AND margin recalculation triggered
        if (succeeded > 0 && marginRecalculation) {
          // Get sample product IDs (first 10 from successful items)
          const successfulItems = response.data.results
            .filter(r => r.success)
            .slice(0, 10)
            .map(r => r.nm_id)

          if (successfulItems.length > 0) {
            // Show polling started notification with weeks info
            const estimatedSeconds = Math.round(pollingStrategy.estimatedTime / 1000)

            // Include affected weeks in toast message
            const weeksText =
              marginRecalculation.weeks.length > 0
                ? ` (${marginRecalculation.weeks.join(', ')})`
                : ''

            toast.info(`Расчёт маржи для ${succeeded} товаров начат...${weeksText}`, {
              description: `Ожидаемое время: ~${estimatedSeconds}с`,
            })

            // Start polling
            setSampleNmIds(successfulItems)
            setIsPolling(true)
            setPollingAttempts(0)
            setPollingTimeout(false)
            // Add all sample products to polling store
            successfulItems.forEach(nmId => addPollingProduct(nmId))
          }
        } else if (succeeded > 0 && !marginRecalculation) {
          // Handle case where margin recalculation was not triggered
          // This happens when no sales data exists for uploaded COGS
          toast.info('Себестоимость назначена', {
            description: 'Маржа будет рассчитана после импорта продаж',
          })
        }

        // Call user's onSuccess callback
        options?.onSuccess?.(response)
      },
      onError: error => {
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
    isError: assignmentMutation.isError,
    error: assignmentMutation.error,
    data: assignmentMutation.data,
    // Polling state
    isPolling,
    pollingAttempts,
    pollingTimeout,
    pollingStrategy,
  }
}
