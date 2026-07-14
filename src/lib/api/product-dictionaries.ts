/**
 * Product Dictionaries API — S3 (brand / subject / tnved).
 * GET /v1/products/dictionaries?includeDiscontinued=false →
 *   { brands, subjects, tnveds } each [{ value, count }].
 *
 * One round-trip for all filter dropdowns. Values come from `products` (groupBy);
 * they change as the catalog syncs — refresh after a product sync.
 * Reference: docs/request-backend/223-product-dictionaries-backend-contract.md
 */
import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type { ProductDictionaries, DictionaryEntry } from '@/types/product-dictionaries'

/**
 * Normalize a raw dictionary array into the FE canonical shape.
 * Drops empty-string values (the backend excludes null brands/subjects/tnveds
 * from the groups) and coerces `count` to a number (AP#8: counts → 0 is allowed).
 */
function mapDictionary(raw: unknown): DictionaryEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => {
      const e = (item ?? {}) as Record<string, unknown>
      const value = typeof e.value === 'string' ? e.value : String(e.value ?? '')
      const count = typeof e.count === 'number' ? e.count : Number(e.count ?? 0) || 0
      return { value, count }
    })
    .filter(e => e.value !== '')
}

/**
 * Fetch distinct brand / subject / tnved values with product counts.
 * @param includeDiscontinued when true, discontinued SKUs are counted too.
 */
export async function getProductDictionaries(
  includeDiscontinued = false
): Promise<ProductDictionaries> {
  const url = includeDiscontinued
    ? '/v1/products/dictionaries?includeDiscontinued=true'
    : '/v1/products/dictionaries'
  logger.debug('[Products API] Fetching dictionaries', { includeDiscontinued })

  const raw = (await apiClient.get<unknown>(url)) as Record<string, unknown>
  return {
    brands: mapDictionary(raw.brands),
    subjects: mapDictionary(raw.subjects),
    tnveds: mapDictionary(raw.tnveds),
  }
}

/** Query keys for product dictionaries. */
export const productDictionariesQueryKeys = {
  all: ['products', 'dictionaries'] as const,
  list: (includeDiscontinued: boolean) =>
    [...productDictionariesQueryKeys.all, { includeDiscontinued }] as const,
}
