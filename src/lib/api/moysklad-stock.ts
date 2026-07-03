/**
 * МойСклад stock-db API client + boundary normalizer (read-only FE, M1).
 *
 * Split from ./moysklad.ts for the 200-line cap. Contract:
 *   docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Response-shape quirk (FR-7 lesson): the `{count,total,date,rows}` envelope is
 * read with `{ skipDataUnwrap: true }` — `apiClient.get` would otherwise discard
 * count/total/date by unwrapping `{data}`.
 *
 * Prisma Decimal: `stockFree` / `reserve` arrive as decimal.js `{s,e,d}` and are
 * reconstructed to a JS number via `toDecimalNumber` (no runtime decimal.js dep).
 *
 * AP#8: stockFree/reserve/nmId preserved as null (render «—» / «не привязан»).
 */

import { apiClient } from '../api-client'
import {
  asRecord,
  toCount,
  toDecimalNumber,
  toNullableNumber,
  toStringOrNull,
} from './normalizer-helpers'
import type { MoyskladStockDbResponse, MoyskladStockSnapshot } from '@/types/moysklad'

/**
 * Normalize a raw backend stock row into the FE-canonical shape.
 * stockFree/reserve: Prisma Decimal → number via `toDecimalNumber` (null-safe).
 * date/syncedAt/assortmentId: string-or-null. nmId: nullable number.
 */
export function mapStockSnapshot(raw: unknown): MoyskladStockSnapshot {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    date: toStringOrNull(r.date),
    moyskladAssortmentId: String(r.moyskladAssortmentId ?? ''),
    nmId: toNullableNumber(r.nmId),
    stockFree: toDecimalNumber(r.stockFree),
    reserve: toDecimalNumber(r.reserve),
    syncedAt: toStringOrNull(r.syncedAt),
  }
}

/** Normalize the `{ count, total, date, rows }` stock-db envelope. */
export function normalizeStockDbResponse(raw: unknown): MoyskladStockDbResponse {
  const r = asRecord(raw)
  const rows = Array.isArray(r.rows) ? r.rows.map(mapStockSnapshot) : []
  return {
    count: toCount(r.count),
    total: toCount(r.total),
    date: toStringOrNull(r.date),
    rows,
  }
}

export interface MoyskladStockDbParams {
  /** Snapshot date (YYYY-MM-DD). Omitted → latest snapshot date. Invalid → 400. */
  date?: string
  /** Positive int; `0` is treated as absent by the backend. */
  limit?: number
  offset?: number
}

/** GET /v1/moysklad/stock-db → cached stock snapshots (OUR DB, read-only). */
export async function getMoyskladStockDb(
  params: MoyskladStockDbParams = {}
): Promise<MoyskladStockDbResponse> {
  const qs = new URLSearchParams()
  if (typeof params.date === 'string' && params.date.length > 0) qs.set('date', params.date)
  if (typeof params.limit === 'number' && params.limit > 0) qs.set('limit', String(params.limit))
  if (typeof params.offset === 'number' && params.offset > 0)
    qs.set('offset', String(params.offset))
  const query = qs.size > 0 ? `?${qs.toString()}` : ''
  const raw = await apiClient.get<unknown>(`/v1/moysklad/stock-db${query}`, {
    skipDataUnwrap: true,
  })
  return normalizeStockDbResponse(raw)
}
