/**
 * МойСклад live `/products` API client + boundary normalizer (read-through, M2).
 *
 * Split from ./moysklad.ts for the 200-line cap. Contract:
 *   docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * This is a LIVE read-through to МойСклад (contract v1-boundary #2) — the call
 * may fail at runtime; the hook surfaces the error (no crash, graceful banner).
 *
 * Response-shape quirk: the top-level IS `{ rows, meta:{ size, ... } }` (NO
 * `{data}` wrapper). Use `{ skipDataUnwrap: true }` for explicitness/consistency
 * with the other МС endpoints, then read `.rows` + `.meta.size`.
 *
 * МС money: `buyPrice.value` / `salePrices[].value` are МС minor units (kopecks
 * for RUB) → divide by 100 for rubles (consistent with Phase-1
 * `MoyskladProductMapping.buyPriceKopeck/100`).
 *
 * AP#8: buyPriceRub/salePriceRub preserved as null (render «—»), never 0.
 */

import { apiClient } from '../api-client'
import { asRecord, toCount, toNullableNumber, toStringOrNull } from './normalizer-helpers'
import type { MoyskladProduct, MoyskladProductsResponse } from '@/types/moysklad'

/**
 * Convert МС minor units (kopecks) → rubles, preserving null.
 * AP#8: money field — null stays null (renders «—»), never 0.
 */
function kopeckToRubles(raw: unknown): number | null {
  const n = toNullableNumber(raw)
  return n == null ? null : n / 100
}

/** Read the first sale-price tier (kopecks → rubles). NULL when no tiers. */
function firstSalePriceRub(rawSalePrices: unknown): number | null {
  if (!Array.isArray(rawSalePrices) || rawSalePrices.length === 0) return null
  const first = asRecord(rawSalePrices[0])
  return kopeckToRubles(first.value)
}

/** Normalize a raw МС `/products` row into the FE-canonical shape. */
export function mapMoyskladProduct(raw: unknown): MoyskladProduct {
  const r = asRecord(raw)
  const buyPrice = asRecord(r.buyPrice)
  return {
    id: String(r.id ?? ''),
    name: toStringOrNull(r.name),
    article: toStringOrNull(r.article),
    code: toStringOrNull(r.code),
    externalCode: toStringOrNull(r.externalCode),
    buyPriceRub: kopeckToRubles(buyPrice.value),
    salePriceRub: firstSalePriceRub(r.salePrices),
    updated: toStringOrNull(r.updated),
  }
}

/** Normalize the `{ rows, meta:{ size } }` live `/products` envelope. */
function normalizeProductsResponse(raw: unknown): MoyskladProductsResponse {
  const r = asRecord(raw)
  const rows = Array.isArray(r.rows) ? r.rows.map(mapMoyskladProduct) : []
  const meta = asRecord(r.meta)
  return {
    rows,
    total: toCount(meta.size),
  }
}

export interface MoyskladProductsParams {
  /** Positive int (page size). `0` is treated as absent by the backend. */
  limit?: number
  offset?: number
}

/** GET /v1/moysklad/products → live МС products read-through. Throws on live failure. */
export async function getMoyskladProducts(
  params: MoyskladProductsParams = {}
): Promise<MoyskladProductsResponse> {
  const qs = new URLSearchParams()
  if (typeof params.limit === 'number' && params.limit > 0) qs.set('limit', String(params.limit))
  if (typeof params.offset === 'number' && params.offset > 0)
    qs.set('offset', String(params.offset))
  const query = qs.size > 0 ? `?${qs.toString()}` : ''
  const raw = await apiClient.get<unknown>(`/v1/moysklad/products${query}`, {
    skipDataUnwrap: true,
  })
  return normalizeProductsResponse(raw)
}
