/**
 * Bulk COGS Assignment - Validation & Helper Functions
 * Extracted from useBulkCogsAssignment.ts for file size compliance (Epic 74)
 */

import type {
  BulkCogsItem,
  BulkCogsUploadRequest,
  BulkCogsWireItem,
  BulkCogsWireRequest,
} from '@/types/api'

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

    if (!item.nm_id || item.nm_id.trim() === '') {
      errors.push(`Товар ${itemNum}: Артикул обязателен`)
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

// ============================================================================
// Wire-boundary conversion (BE-A-1)
// ============================================================================

/**
 * Convert a FE-canonical bulk-COGS item (string `nm_id`) to the wire shape the
 * `POST /v1/products/cogs/bulk` endpoint requires (integer `nm_id`). The backend
 * validator rejects string nm_id (400 "nm_id must be an integer number"), which made
 * the whole bulk-COGS feature unusable. The FE keeps nm_id as string everywhere else
 * (anti-pattern #10, `product.ts:7`), so the conversion lives at this boundary only.
 * `currency` is left undefined-when-absent (BE rejects the property if present;
 * `JSON.stringify` drops undefined).
 */
export function toBulkCogsWireItem(item: BulkCogsItem): BulkCogsWireItem {
  return { ...item, nm_id: Number(item.nm_id) }
}

/**
 * Map a full bulk-COGS request to its wire shape (converts `items` + `assignments`).
 */
export function toBulkCogsWireRequest(request: BulkCogsUploadRequest): BulkCogsWireRequest {
  return {
    items: request.items?.map(toBulkCogsWireItem),
    assignments: request.assignments?.map(toBulkCogsWireItem),
  }
}
