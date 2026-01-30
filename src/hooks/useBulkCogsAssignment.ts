/**
 * Hook for bulk COGS assignment to multiple products
 * Story 4.2: Bulk COGS Assignment Capability
 * Epic 18 Backend API Integration
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { BulkCogsUploadRequest, BulkCogsUploadResponse, BulkCogsItem } from '@/types/api'

export interface BulkCogsAssignmentParams {
  items: BulkCogsItem[]
}

/**
 * Hook to assign COGS to multiple products in bulk
 *
 * @example
 * const { mutate, isPending } = useBulkCogsAssignment();
 *
 * mutate({
 *   items: [
 *     { nm_id: '12345678', unit_cost_rub: 1250.50, valid_from: '2025-11-23', source: 'manual' },
 *     { nm_id: '87654321', unit_cost_rub: 850.00, valid_from: '2025-11-23', source: 'manual' }
 *   ]
 * });
 *
 * @returns Mutation hook with:
 * - mutate: Function to trigger bulk COGS assignment
 * - isPending: Loading state
 * - isError: Error state
 * - error: Error object
 * - data: Bulk upload response with success/failure details
 */
export function useBulkCogsAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: BulkCogsAssignmentParams): Promise<BulkCogsUploadResponse> => {
      const { items } = params

      try {
        console.info(`[Bulk COGS Assignment] Assigning COGS to ${items.length} products`)

        // Validate max items limit (1000 per backend spec)
        if (items.length > 1000) {
          throw new Error(`Максимум 1000 товаров за один раз. Передано: ${items.length}`)
        }

        // Build request (use V2 format for detailed results)
        const request: BulkCogsUploadRequest = {
          items, // Using 'items' field (backend accepts both 'items' and 'assignments')
        }

        console.info('[Bulk COGS Assignment] Request:', {
          items_count: items.length,
          sample_item: items[0],
        })

        // Call backend API with V2 format
        // Endpoint: POST /v1/products/cogs/bulk?format=v2
        const response = await apiClient.post<BulkCogsUploadResponse>(
          '/v1/products/cogs/bulk?format=v2',
          request
        )

        console.info('[Bulk COGS Assignment] Response:', {
          succeeded: response.data.succeeded,
          failed: response.data.failed,
          total: items.length,
        })

        return response
      } catch (error) {
        console.error('[Bulk COGS Assignment] Failed:', error)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries to refresh data
      // 1. Product list (COGS status will change for updated products)
      queryClient.invalidateQueries({ queryKey: ['products'] })

      // 2. Analytics queries (margin calculations will update)
      queryClient.invalidateQueries({ queryKey: ['analytics'] })

      // 3. Dashboard metrics (if margin/COGS is shown there)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      // Log detailed results
      const { succeeded, failed, results, marginRecalculation } = data.data

      console.log(`✅ Bulk COGS assignment completed:`)
      console.log(`   Succeeded: ${succeeded}/${variables.items.length}`)
      console.log(`   Failed: ${failed}/${variables.items.length}`)

      // Log margin recalculation status (Request #118/119 - Automatic margin recalculation)
      if (marginRecalculation) {
        console.log(`   Margin Recalculation:`)
        console.log(`     Status: ${marginRecalculation.status}`)
        console.log(`     Weeks: ${marginRecalculation.weeks.join(', ')}`)
        console.log(`     Task ID: ${marginRecalculation.taskId}`)
      } else if (succeeded > 0) {
        console.log(`   Margin Recalculation: Not triggered (no sales data for uploaded COGS)`)
      }

      // Log failed items for debugging
      if (failed > 0) {
        const failedItems = results.filter(r => !r.success)
        console.warn('❌ Failed items:', failedItems)
      }
    },
    onError: (error, variables) => {
      console.error(`❌ Bulk COGS assignment failed for ${variables.items.length} items:`, error)
    },
  })
}

/**
 * Validate bulk COGS assignment request
 * Frontend validation before API call
 *
 * @example
 * const errors = validateBulkCogsAssignment([
 *   { nm_id: '12345678', unit_cost_rub: -100, valid_from: '2024-01-01' }
 * ]);
 *
 * if (errors.length > 0) {
 *   console.error('Validation errors:', errors);
 * }
 */
export function validateBulkCogsAssignment(items: BulkCogsItem[]): string[] {
  const errors: string[] = []

  // Check max items limit
  if (items.length === 0) {
    errors.push('Необходимо выбрать хотя бы один товар')
    return errors
  }

  if (items.length > 1000) {
    errors.push(`Максимум 1000 товаров за один раз. Выбрано: ${items.length}`)
  }

  // Validate each item
  items.forEach((item, index) => {
    const itemNum = index + 1

    // Validate nm_id
    if (!item.nm_id || item.nm_id.trim() === '') {
      errors.push(`Товар ${itemNum}: Артикул обязателен`)
    }

    // Validate unit_cost_rub
    if (item.unit_cost_rub === undefined || item.unit_cost_rub === null) {
      errors.push(`Товар ${itemNum} (${item.nm_id}): Себестоимость обязательна`)
    } else if (item.unit_cost_rub < 0) {
      errors.push(`Товар ${itemNum} (${item.nm_id}): Себестоимость не может быть отрицательной`)
    } else if (!Number.isFinite(item.unit_cost_rub)) {
      errors.push(`Товар ${itemNum} (${item.nm_id}): Себестоимость должна быть числом`)
    }

    // Validate valid_from
    if (!item.valid_from) {
      errors.push(`Товар ${itemNum} (${item.nm_id}): Дата начала действия обязательна`)
    } else {
      const validFrom = new Date(item.valid_from)
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)

      if (isNaN(validFrom.getTime())) {
        errors.push(`Товар ${itemNum} (${item.nm_id}): Неверный формат даты`)
      } else if (validFrom > today) {
        errors.push(`Товар ${itemNum} (${item.nm_id}): Дата не может быть в будущем`)
      } else if (validFrom < oneYearAgo) {
        errors.push(`Товар ${itemNum} (${item.nm_id}): Дата не может быть более года назад`)
      }
    }

    // Validate currency (if provided)
    if (item.currency) {
      const validCurrencies = ['RUB', 'USD', 'EUR', 'CNY']
      if (!validCurrencies.includes(item.currency)) {
        errors.push(
          `Товар ${itemNum} (${item.nm_id}): Валюта должна быть одной из: ${validCurrencies.join(', ')}`
        )
      }
    }
  })

  // Return unique errors only
  return [...new Set(errors)]
}

/**
 * Helper to create bulk COGS items from product IDs and single COGS value
 * Simplifies creating bulk request when applying same COGS to multiple products
 *
 * @example
 * const items = createBulkCogsItems(
 *   ['12345678', '87654321', '99999999'],
 *   1250.50,
 *   '2025-11-23'
 * );
 * // Returns: [
 * //   { nm_id: '12345678', unit_cost_rub: 1250.50, valid_from: '2025-11-23', source: 'manual' },
 * //   { nm_id: '87654321', unit_cost_rub: 1250.50, valid_from: '2025-11-23', source: 'manual' },
 * //   { nm_id: '99999999', unit_cost_rub: 1250.50, valid_from: '2025-11-23', source: 'manual' }
 * // ]
 */
export function createBulkCogsItems(
  nmIds: string[],
  unitCostRub: number,
  validFrom: string,
  options?: {
    currency?: string
    source?: string
    notes?: string
  }
): BulkCogsItem[] {
  return nmIds.map(nm_id => ({
    nm_id,
    unit_cost_rub: unitCostRub,
    valid_from: validFrom,
    currency: options?.currency,
    source: options?.source || 'manual',
    notes: options?.notes,
  }))
}
