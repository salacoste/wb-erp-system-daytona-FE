/**
 * МойСклад live `/variants` API client + boundary normalizer (read-through, M3).
 *
 * Mirror of ./moysklad-products.ts (M2), different endpoint/fields. Contract:
 *   docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * This is a LIVE read-through to МойСклад (contract v1-boundary #2) — the call
 * may fail at runtime; the hook surfaces the error (no crash, graceful banner).
 *
 * Response-shape quirk: the top-level IS `{ rows, meta:{ size, ... } }` (NO
 * `{data}` wrapper). Use `{ skipDataUnwrap: true }` then read `.rows` + `.meta.size`.
 *
 * Key contract point: variants LACK `article` (unlike products) — no article
 * field here and no «Артикул» column in the table. `product` is a parent-product
 * entity-link object; we store its href/id as a best-effort string (no rich detail).
 * `barcodes` is an array; we surface its length (count exception, AP#8 → 0).
 */

import { apiClient } from '../api-client'
import { asRecord, toCount, toStringOrNull } from './normalizer-helpers'
import type { MoyskladVariant, MoyskladVariantsResponse } from '@/types/moysklad'

/**
 * Best-effort extract of the parent-product ref as a string.
 * МС entity-link object shape: `{ meta:{ href }, id, name }` — prefer href, then
 * id. NULL when `product` is absent or not a link-shaped object (Defensive FE).
 */
function parentProductHref(rawProduct: unknown): string | null {
  const product = asRecord(rawProduct)
  const meta = asRecord(product.meta)
  const href = toStringOrNull(meta.href)
  if (href) return href
  // Fall back to the parent id if МС omitted meta.href but kept a bare id.
  return toStringOrNull(product.id)
}

/** Normalize a raw МС `/variants` row into the FE-canonical shape. */
export function mapMoyskladVariant(raw: unknown): MoyskladVariant {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    name: toStringOrNull(r.name),
    code: toStringOrNull(r.code),
    parentProductHref: parentProductHref(r.product),
    // AP#8 count exception: missing/non-array barcodes → 0 (legitimate empty-state).
    barcodesCount: Array.isArray(r.barcodes) ? r.barcodes.length : 0,
    updated: toStringOrNull(r.updated),
  }
}

/** Normalize the `{ rows, meta:{ size } }` live `/variants` envelope. */
function normalizeVariantsResponse(raw: unknown): MoyskladVariantsResponse {
  const r = asRecord(raw)
  const rows = Array.isArray(r.rows) ? r.rows.map(mapMoyskladVariant) : []
  const meta = asRecord(r.meta)
  return {
    rows,
    total: toCount(meta.size),
  }
}

export interface MoyskladVariantsParams {
  /** Positive int (page size). `0` is treated as absent by the backend. */
  limit?: number
  offset?: number
}

/** GET /v1/moysklad/variants → live МС variants read-through. Throws on live failure. */
export async function getMoyskladVariants(
  params: MoyskladVariantsParams = {}
): Promise<MoyskladVariantsResponse> {
  const qs = new URLSearchParams()
  if (typeof params.limit === 'number' && params.limit > 0) qs.set('limit', String(params.limit))
  if (typeof params.offset === 'number' && params.offset > 0)
    qs.set('offset', String(params.offset))
  const query = qs.size > 0 ? `?${qs.toString()}` : ''
  const raw = await apiClient.get<unknown>(`/v1/moysklad/variants${query}`, {
    skipDataUnwrap: true,
  })
  return normalizeVariantsResponse(raw)
}
