/**
 * Hook for assigning COGS to individual products
 * Story 4.1: Single Product COGS Assignment Interface
 * Epic 18 Backend API Integration
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { CogsAssignmentRequest, ProductWithCogs, MissingDataReason } from '@/types/api'

export interface SingleCogsAssignmentParams {
  nmId: string                    // Product ID (артикул WB)
  cogs: CogsAssignmentRequest     // COGS data
}

/**
 * Hook to assign COGS to a single product
 *
 * @example
 * const { mutate, isPending } = useSingleCogsAssignment();
 *
 * mutate({
 *   nmId: '12345678',
 *   cogs: {
 *     unit_cost_rub: 1250.50,
 *     valid_from: '2025-11-23',
 *     source: 'manual',
 *     notes: 'Initial cost entry'
 *   }
 * });
 *
 * @returns Mutation hook with:
 * - mutate: Function to trigger COGS assignment
 * - isPending: Loading state
 * - isError: Error state
 * - error: Error object
 * - data: Updated product with COGS and margin data
 */
export function useSingleCogsAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: SingleCogsAssignmentParams): Promise<ProductWithCogs> => {
      const { nmId, cogs } = params

      try {
        console.info(`[COGS Assignment] Assigning COGS to product ${nmId}:`, {
          unit_cost_rub: cogs.unit_cost_rub,
          valid_from: cogs.valid_from,
          source: cogs.source,
        })

        // Call backend API
        // Endpoint: POST /v1/products/:nmId/cogs
        const response = await apiClient.post<ProductWithCogs>(
          `/v1/products/${nmId}/cogs`,
          cogs
        )

        // DEBUG: Detailed logging of response
        console.group('🔍 [COGS Assignment DEBUG] Full Response Analysis')
        console.log('Response type:', typeof response)
        console.log('Response is object:', typeof response === 'object' && response !== null)
        console.log('Full response:', JSON.stringify(response, null, 2))
        console.log('Response keys:', Object.keys(response as unknown as Record<string, unknown>))

        // Check margin fields
        const marginPct = response.current_margin_pct
        const missingReason = response.missing_data_reason
        console.log('Margin analysis:', {
          current_margin_pct: marginPct,
          current_margin_pct_type: typeof marginPct,
          isNull: marginPct === null,
          isUndefined: marginPct === undefined,
          isNumber: typeof marginPct === 'number',
          isFinite: typeof marginPct === 'number' && Number.isFinite(marginPct),
          missing_data_reason: missingReason,
          missing_data_reason_type: typeof missingReason,
        })
        console.groupEnd()

        console.info('[COGS Assignment] COGS assigned successfully:', {
          nm_id: response.nm_id,
          has_cogs: response.has_cogs,
          cogs_id: response.cogs?.id,
          current_margin_pct: response.current_margin_pct,
          current_margin_pct_type: typeof response.current_margin_pct,
          missing_data_reason: response.missing_data_reason,
        })

        return response
      } catch (error) {
        console.error(`[COGS Assignment] Failed to assign COGS to product ${nmId}:`, error)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate product queries to refresh data
      // 1. Invalidate product list (so COGS status updates)
      queryClient.invalidateQueries({ queryKey: ['products'] })

      // 2. Invalidate single product detail (if it was fetched)
      queryClient.invalidateQueries({ queryKey: ['products', variables.nmId] })

      // 3. Invalidate analytics queries (margin calculations will update)
      queryClient.invalidateQueries({ queryKey: ['analytics'] })

      // 4. Invalidate dashboard metrics (if margin is shown there)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      console.log(`✅ COGS assigned successfully to product ${variables.nmId}`)
      console.log(`   Unit cost: ${variables.cogs.unit_cost_rub} RUB`)
      console.log(`   Valid from: ${variables.cogs.valid_from}`)

      // Backend returns null when margin unavailable (Request #11 - Fixed 2025-11-23)
      // Use != null (loose equality) to check both null and undefined (defensive programming)
      const marginPct = data.current_margin_pct
      if (marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)) {
        console.log(`   Margin: ${marginPct.toFixed(2)}%`)
      } else if (data.missing_data_reason) {
        console.log(`   Margin: Not available (${data.missing_data_reason})`)
      }
    },
    onError: (error, variables) => {
      console.error(`❌ Failed to assign COGS to product ${variables.nmId}:`, error)
    },
  })
}

/**
 * Hook to update COGS for a product (creates new version)
 * Uses same endpoint as assignment, but creates new temporal version
 *
 * @example
 * const { mutate } = useUpdateCogs();
 *
 * mutate({
 *   nmId: '12345678',
 *   cogs: {
 *     unit_cost_rub: 1350.00,  // New cost
 *     valid_from: '2025-12-01',
 *     source: 'manual',
 *     notes: 'Price increase from supplier'
 *   }
 * });
 */
export function useUpdateCogs() {
  // Same implementation as useSingleCogsAssignment
  // Backend handles temporal versioning automatically
  return useSingleCogsAssignment()
}

/**
 * Validation helper for COGS assignment
 * Frontend validation before API call
 *
 * @example
 * const errors = validateCogsAssignment({
 *   unit_cost_rub: -100,
 *   valid_from: '2024-01-01',
 * });
 *
 * if (errors.length > 0) {
 *   console.error('Validation errors:', errors);
 * }
 */
export function validateCogsAssignment(cogs: CogsAssignmentRequest): string[] {
  const errors: string[] = []

  // Validate unit_cost_rub
  if (cogs.unit_cost_rub === undefined || cogs.unit_cost_rub === null) {
    errors.push('Себестоимость обязательна для заполнения')
  } else if (cogs.unit_cost_rub < 0) {
    errors.push('Себестоимость не может быть отрицательной')
  } else if (!Number.isFinite(cogs.unit_cost_rub)) {
    errors.push('Себестоимость должна быть числом')
  }

  // Validate valid_from
  if (!cogs.valid_from) {
    errors.push('Дата начала действия обязательна для заполнения')
  } else {
    // Parse date string (YYYY-MM-DD format)
    const validFrom = new Date(cogs.valid_from + 'T00:00:00') // Add time to avoid timezone issues

    // Get today's date at midnight (ignore time)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get one year ago at midnight
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    oneYearAgo.setHours(0, 0, 0, 0)

    if (isNaN(validFrom.getTime())) {
      errors.push('Неверный формат даты')
    } else if (validFrom > today) {
      errors.push('Дата начала действия не может быть в будущем')
    } else if (validFrom < oneYearAgo) {
      errors.push('Дата начала действия не может быть более года назад')
    }
  }

  // Validate currency (if provided)
  if (cogs.currency) {
    const validCurrencies = ['RUB', 'USD', 'EUR', 'CNY']
    if (!validCurrencies.includes(cogs.currency)) {
      errors.push(`Валюта должна быть одной из: ${validCurrencies.join(', ')}`)
    }
  }

  return errors
}

/**
 * Format COGS value for display
 *
 * @example
 * formatCogs(1250.50) // "1 250,50 ₽"
 */
export function formatCogs(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '—'
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

/**
 * Get user-friendly message for missing_data_reason
 * Backend uses UPPER_CASE values (Request #15)
 *
 * @example
 * getMissingDataReasonMessage('COGS_NOT_ASSIGNED') // "Назначьте себестоимость для расчёта маржи"
 */
export function getMissingDataReasonMessage(
  reason: MissingDataReason
): string | null {
  switch (reason) {
    case 'COGS_NOT_ASSIGNED':
      return 'Назначьте себестоимость для расчёта маржи'
    case 'NO_SALES_IN_PERIOD':
      return 'Нет продаж на прошлой неделе'
    case 'NO_SALES_DATA':
      return 'Нет продаж'
    case 'ANALYTICS_UNAVAILABLE':
      return 'Данные недоступны'
    case null:
      return null
    default:
      return 'Данные недоступны'
  }
}
