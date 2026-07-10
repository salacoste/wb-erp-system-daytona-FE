/**
 * Bulk COGS Assignment - Validation & Helper Functions
 * Extracted from useBulkCogsAssignment.ts for file size compliance (Epic 74)
 */

import type { BulkCogsItem } from '@/types/api'
import { parseBulkCogsNmId } from '@/lib/api/bulk-cogs-wire'

export {
  parseBulkCogsNmId,
  toBulkCogsWireItem,
  toBulkCogsWireRequest,
} from '@/lib/api/bulk-cogs-wire'

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate bulk COGS assignment request
 * Frontend validation before API call
 */
export function validateBulkCogsAssignment(items: BulkCogsItem[]): string[] {
  const errors: string[] = []

  if (items.length === 0) {
    errors.push('Необходимо выбрать хотя бы один товар')
    return errors
  }

  if (items.length > 1000) {
    errors.push(`Максимум 1000 товаров за один раз. Выбрано: ${items.length}`)
  }

  items.forEach((item, index) => {
    const itemNum = index + 1

    const parsedNmId = parseBulkCogsNmId(item.nm_id)
    if (!parsedNmId.ok) {
      if (parsedNmId.code === 'required') {
        errors.push(`Товар ${itemNum}: Артикул обязателен`)
      } else {
        errors.push(`Товар ${itemNum} (${item.nm_id}): ${parsedNmId.message}`)
      }
    }

    if (item.unit_cost_rub === undefined || item.unit_cost_rub === null) {
      errors.push(`Товар ${itemNum} (${item.nm_id}): Себестоимость обязательна`)
    } else if (item.unit_cost_rub < 0) {
      errors.push(`Товар ${itemNum} (${item.nm_id}): Себестоимость не может быть отрицательной`)
    } else if (!Number.isFinite(item.unit_cost_rub)) {
      errors.push(`Товар ${itemNum} (${item.nm_id}): Себестоимость должна быть числом`)
    }

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

    if (item.currency) {
      const validCurrencies = ['RUB', 'USD', 'EUR', 'CNY']
      if (!validCurrencies.includes(item.currency)) {
        errors.push(
          `Товар ${itemNum} (${item.nm_id}): Валюта должна быть одной из: ${validCurrencies.join(', ')}`
        )
      }
    }
  })

  return [...new Set(errors)]
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Helper to create bulk COGS items from product IDs and single COGS value
 * Simplifies creating bulk request when applying same COGS to multiple products
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
