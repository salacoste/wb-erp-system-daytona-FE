/**
 * Products - Types & Query Config
 * Extracted from useProducts.ts for file size compliance (Epic 74)
 */

export interface ProductFilters {
  /** Filter: true = with COGS, false = without COGS, undefined = all */
  has_cogs?: boolean
  /** Search by nm_id or sa_name (partial match) - sent as 'q' parameter to backend */
  search?: string
  /** Cursor for pagination (cursor-based, not page-based) */
  cursor?: string
  /** Items per page (default: 50, max: 200) */
  limit?: number
  /** Request #15: Include margin data in response */
  include_margin?: boolean
  /** Epic 24 / Story 24.7-fe: Include storage cost data */
  include_storage?: boolean
}


// ============================================================================
// Search normalization helpers
// ============================================================================

const CYRILLIC_TO_LATIN_LOOKALIKE: Record<string, string> = {
  а: 'a',
  в: 'b',
  с: 'c',
  е: 'e',
  ё: 'e',
  н: 'h',
  к: 'k',
  м: 'm',
  о: 'o',
  р: 'p',
  т: 't',
  у: 'y',
  х: 'x',
}

const RUSSIAN_KEYBOARD_TO_ENGLISH: Record<string, string> = {
  й: 'q',
  ц: 'w',
  у: 'e',
  к: 'r',
  е: 't',
  н: 'y',
  г: 'u',
  ш: 'i',
  щ: 'o',
  з: 'p',
  х: '[',
  ъ: ']',
  ф: 'a',
  ы: 's',
  в: 'd',
  а: 'f',
  п: 'g',
  р: 'h',
  о: 'j',
  л: 'k',
  д: 'l',
  ж: ';',
  э: "'",
  я: 'z',
  ч: 'x',
  с: 'c',
  м: 'v',
  и: 'b',
  т: 'n',
  ь: 'm',
  б: ',',
  ю: '.',
}

function normalizeSearchToken(value: string): string {
  return value
    .toLocaleLowerCase('ru-RU')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function remapChars(value: string, map: Record<string, string>): string {
  return Array.from(value)
    .map(char => map[char] ?? char)
    .join('')
}

export function getProductSearchVariants(value: string): string[] {
  const base = normalizeSearchToken(value)
  if (!base) return []

  return Array.from(
    new Set([base, remapChars(base, CYRILLIC_TO_LATIN_LOOKALIKE), remapChars(base, RUSSIAN_KEYBOARD_TO_ENGLISH)])
  ).filter(Boolean)
}

export interface ProductSearchableFields {
  nm_id?: string | number | null
  vendor_code?: string | null
  sa_name?: string | null
  brand?: string | null
  category?: string | null
  barcode?: string | null
}

export function productMatchesSearch(product: ProductSearchableFields, query: string): boolean {
  const queryVariants = getProductSearchVariants(query)
  if (!queryVariants.length) return true

  const searchableValues = [
    product.nm_id,
    product.vendor_code,
    product.sa_name,
    product.brand,
    product.category,
    product.barcode,
  ]

  const fieldVariants = searchableValues.flatMap(value => getProductSearchVariants(String(value ?? '')))
  return queryVariants.some(queryVariant =>
    fieldVariants.some(fieldVariant => fieldVariant.includes(queryVariant))
  )
}

// ============================================================================
// Query Config Constants
// ============================================================================

/** Stale time when margin or storage data included (60s - more expensive queries) */
export const PRODUCTS_STALE_TIME_WITH_EXTRAS = 60000

/** Stale time without extras (30s) */
export const PRODUCTS_STALE_TIME_DEFAULT = 30000

/** GC time for product queries (5 minutes) */
export const PRODUCTS_GC_TIME = 300000

/** Stale time for product count query (1 minute) */
export const PRODUCTS_COUNT_STALE_TIME = 60000

/**
 * Build URL search params from product filters
 */
export function buildProductParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.has_cogs !== undefined) {
    params.append('has_cogs', String(filters.has_cogs))
  }
  if (filters.search) {
    params.append('q', filters.search)
  }
  if (filters.cursor) {
    params.append('cursor', filters.cursor)
  }
  if (filters.limit !== undefined) {
    params.append('limit', String(filters.limit))
  }
  if (filters.include_margin) {
    params.append('include_cogs', 'true')
  }
  if (filters.include_storage) {
    params.append('include_storage', 'true')
  }

  return params
}

/**
 * Get stale time based on filter options
 */
export function getProductsStaleTime(filters: ProductFilters): number {
  return filters.include_margin || filters.include_storage
    ? PRODUCTS_STALE_TIME_WITH_EXTRAS
    : PRODUCTS_STALE_TIME_DEFAULT
}
