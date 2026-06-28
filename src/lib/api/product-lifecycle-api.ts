/**
 * Product Lifecycle (Discontinued / «Снят с продажи») — API Client
 *
 * Endpoints (all under /v1/products, auto-inject JWT + X-Cabinet-Id via apiClient):
 *   GET  /v1/products/discontinued            → LifecycleProduct[]
 *   GET  /v1/products/discontinued-suggestions → LifecycleProduct[]
 *   PATCH /v1/products/:nmId/lifecycle         { status: 'discontinued'|'active', discontinuedAt? }
 *
 * Backend returns clean camelCase JSON (LifecycleProductDto: nmId as number, dates as ISO),
 * so the normalizer is a light type-guard pass-through (Boundary Normalizer Pattern).
 *
 * @see src/products/services/product-lifecycle.service.ts (backend)
 */

import { apiClient } from '../api-client'
import type { LifecycleProduct, ProductLifecycleStatus } from '@/types/product-lifecycle'

// ---------------------------------------------------------------------------
// Query key factories (cabinetId-first to prevent cross-cabinet cache collisions)
// ---------------------------------------------------------------------------

export const discontinuedProductsQueryKeys = {
  all: (cabinetId: string | null) => ['products', 'discontinued', cabinetId] as const,
}

export const discontinuedSuggestionsQueryKeys = {
  all: (cabinetId: string | null) => ['products', 'discontinued-suggestions', cabinetId] as const,
}

// ---------------------------------------------------------------------------
// Types & normalizer
// ---------------------------------------------------------------------------

interface BackendLifecycleProduct {
  id: string
  nmId: number
  vendorCode: string | null
  /** Returned by backend but unused on FE — intentionally dropped by the normalizer. */
  imtId: number | null
  brand: string | null
  subject: string | null
  isDiscontinued: boolean
  discontinuedAt: string | null
  discontinuedBy: string | null
  discontinuedSuggestedAt: string | null
  discontinuedReason: string | null
}

/** Exported for unit tests (Boundary Normalizer Pattern — ≥1 test per normalizer). */
export function normalizeLifecycleProduct(raw: BackendLifecycleProduct): LifecycleProduct {
  return {
    id: raw.id,
    nmId: raw.nmId,
    vendorCode: raw.vendorCode,
    brand: raw.brand,
    subject: raw.subject,
    isDiscontinued: raw.isDiscontinued,
    discontinuedAt: raw.discontinuedAt,
    discontinuedBy: raw.discontinuedBy,
    discontinuedSuggestedAt: raw.discontinuedSuggestedAt,
    discontinuedReason: raw.discontinuedReason,
  }
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getDiscontinuedProducts(): Promise<LifecycleProduct[]> {
  const data = await apiClient.get<BackendLifecycleProduct[]>('/v1/products/discontinued')
  return data.map(normalizeLifecycleProduct)
}

export async function getDiscontinuedSuggestions(): Promise<LifecycleProduct[]> {
  const data = await apiClient.get<BackendLifecycleProduct[]>(
    '/v1/products/discontinued-suggestions'
  )
  return data.map(normalizeLifecycleProduct)
}

export async function updateProductLifecycle(
  nmId: number,
  status: ProductLifecycleStatus,
  discontinuedAt?: string
): Promise<LifecycleProduct> {
  const data = await apiClient.patch<BackendLifecycleProduct>(
    `/v1/products/${nmId}/lifecycle`,
    discontinuedAt ? { status, discontinuedAt } : { status }
  )
  return normalizeLifecycleProduct(data)
}
