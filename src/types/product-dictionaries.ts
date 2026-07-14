/**
 * Product Dictionaries types — S3 (brand / subject / tnved).
 * Verified against backend contract 223-product-dictionaries-backend-contract.md:
 * GET /v1/products/dictionaries?includeDiscontinued=false →
 *   { brands, subjects, tnveds } each [{ value: string, count: number }].
 *
 * NOTE: `subjects` (not `category`) is the real category axis — `Product.category`
 * is 100% NULL in our data; the WB Content API does not populate it. Build subject
 * dropdowns, not category ones.
 */

/** A distinct dictionary value with the cabinet-scoped product count. */
export interface DictionaryEntry {
  /** The distinct value (brand / subject / tnved code). Never an empty string. */
  value: string
  /** Number of (non-discontinued) products with this value. */
  count: number
}

/** Response from GET /v1/products/dictionaries. */
export interface ProductDictionaries {
  /** Distinct Product.brand values (count DESC). */
  brands: DictionaryEntry[]
  /** Distinct Product.subject values — the real category axis (count DESC). */
  subjects: DictionaryEntry[]
  /** Distinct Product.tnved codes (for future marking flow; count DESC). */
  tnveds: DictionaryEntry[]
}
