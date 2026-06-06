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
import {
  isMarginCalculationComplete,
  extractSampleIds,
} from './useBulkCogsAssignmentWithPolling-utils'
import { logger } from '@/lib/logger'

/**
 * Hook that combines bulk COGS assignment with automatic margin polling
 * Automatically starts polling after successful bulk assignment
 * Polls sample products (first 10) to check if margin calculation completed
 */
export function useBulkCogsAssignmentWithPolling() {
  const queryClient = useQueryClient()
  const [isPolling, setIsPolling] = useState(false)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [pollingTimeout, setPollingTimeout] = useState(false)
  const [sampleNmIds, setSampleNmIds] = useState<string[]>([])
  const { addPollingProduct, removePollingProduct } = useMarginPollingStore()

  const assignmentMutation = useBulkCogsAssignment()
  const pollingStrategy = getPollingStrategy(new Date().toISOString(), true)

  // Polling effect for bulk operations
  useEffect(() => {
    if (!isPolling || sampleNmIds.length === 0) return

    let attemptCount = 0
    let intervalId: NodeJS.Timeout | null = null

    const poll = async () => {
      attemptCount++
      setPollingAttempts(attemptCount)

      try {
        const response = await apiClient.get<{
          products: ProductListItem[]
          pagination: unknown
        }>('/v1/products?include_cogs=true&limit=10')

        const sampleProducts = response.products.filter(p => sampleNmIds.includes(p.nm_id))

        if (isMarginCalculationComplete(sampleProducts)) {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          setIsPolling(false)
          setPollingAttempts(0)
          sampleNmIds.forEach(nmId => removePollingProduct(nmId))
          setSampleNmIds([])
          toast.success('Маржа рассчитана для всех товаров', {
            description: `Обработано ${sampleProducts.length} товаров`,
          })
          queryClient.invalidateQueries({ queryKey: ['products'] })
          queryClient.invalidateQueries({ queryKey: ['analytics'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient
            .refetchQueries({ queryKey: ['products'], exact: false, type: 'active' })
            .catch(error => logger.error('[Bulk COGS Assignment] Refetch error:', error))
          return
        }

        if (attemptCount >= pollingStrategy.maxAttempts) {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          setIsPolling(false)
          setPollingAttempts(0)
          setPollingTimeout(true)
          sampleNmIds.forEach(nmId => removePollingProduct(nmId))
          setSampleNmIds([])
          toast.warning('Расчёт маржи занимает больше времени', {
            description: 'Обновите страницу через минуту, чтобы увидеть результат',
          })
          return
        }
      } catch (error) {
        logger.error('[Bulk Margin Polling] Error:', error)
      }
    }

    poll()
    intervalId = setInterval(poll, pollingStrategy.interval)

    return () => {
      if (intervalId) clearInterval(intervalId)
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
        // F-34: `response` is the normalized BulkCogsResultSummary (fields are top-level,
        // not under `.data` — the base hook now normalizes legacy + v2 shapes).
        const { succeeded, failed, marginRecalculation } = response
        toast.success('Себестоимость назначена', {
          description: `Успешно: ${succeeded}, Ошибок: ${failed}`,
        })

        if (succeeded > 0 && marginRecalculation) {
          const successfulItems = extractSampleIds(response.results)
          if (successfulItems.length > 0) {
            const estimatedSeconds = Math.round(pollingStrategy.estimatedTime / 1000)
            const weeksText =
              marginRecalculation.affectedWeeks.length > 0
                ? ` (${marginRecalculation.affectedWeeks.join(', ')})`
                : ''
            toast.info(`Расчёт маржи для ${succeeded} товаров начат...${weeksText}`, {
              description: `Ожидаемое время: ~${estimatedSeconds}с`,
            })
            setSampleNmIds(successfulItems)
            setIsPolling(true)
            setPollingAttempts(0)
            setPollingTimeout(false)
            successfulItems.forEach(nmId => addPollingProduct(nmId))
          }
        } else if (succeeded > 0 && !marginRecalculation) {
          toast.info('Себестоимость назначена', {
            description: 'Маржа будет рассчитана после импорта продаж',
          })
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
    isError: assignmentMutation.isError,
    error: assignmentMutation.error,
    data: assignmentMutation.data,
    isPolling,
    pollingAttempts,
    pollingTimeout,
    pollingStrategy,
  }
}
