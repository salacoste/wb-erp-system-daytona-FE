/**
 * Product lifecycle types — discontinued («Снят с продажи») assortment management.
 * Frontend-canonical shape (backend returns clean camelCase; see product-lifecycle-api normalizer).
 */

export type ProductLifecycleStatus = 'discontinued' | 'active'

export interface LifecycleProduct {
  /** Product UUID */
  id: string
  /** WB supplier article (Артикул МП / NmId) — number */
  nmId: number
  /** Supplier article string (Арт. поставщика) */
  vendorCode: string | null
  brand: string | null
  /** WB subject / category */
  subject: string | null
  /** True when the SKU is out of assortment */
  isDiscontinued: boolean
  /** ISO cutoff date; null = active */
  discontinuedAt: string | null
  /** Who marked it (user id / system) */
  discontinuedBy: string | null
  /** ISO when the system suggested discontinuation; null if not suggested */
  discontinuedSuggestedAt: string | null
  /** Defensive: backend reason string (manual | no_sales_90d | …) or null */
  discontinuedReason: string | null
}
