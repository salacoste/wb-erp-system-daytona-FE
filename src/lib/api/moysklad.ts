/**
 * МойСклад API client + boundary normalizer (read-only FE, Phase 1 MVP).
 *
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 * Base path: /v1/moysklad. Auth: JwtAuthGuard + CabinetGuard (header ignored for
 * МС — token is MOYSKLAD_TOKEN for MOYSKLAD_CABINET_ID; see bootstrap-cabinet note).
 *
 * Response-shape quirk (FR-7 lesson): mappings/organizations are `{count,total,rows}`
 * / `{rows}` — `apiClient.get` auto-unwraps `{data}`, which would discard count/total.
 * Use `{ skipDataUnwrap: true }` and read the raw envelope.
 *
 * Anti-pattern #8: money (buyPriceRub) + nmId/matchedBy preserved as null, never 0.
 */

import { apiClient } from '../api-client'
import { asRecord, toCount, toNullableNumber, toStringOrNull } from './normalizer-helpers'
import type {
  EnqueueSyncResponse,
  LinkMappingResponse,
  MoyskladHealth,
  MoyskladMappingsResponse,
  MoyskladMatchStrategy,
  MoyskladOrganization,
  MoyskladProductMapping,
} from '@/types/moysklad'

const MATCH_STRATEGIES: readonly MoyskladMatchStrategy[] = ['VENDOR_CODE', 'BARCODE', 'MANUAL']

/** Coerce a raw match-strategy string to the enum, else null (pending). */
function toMatchStrategy(raw: unknown): MoyskladMatchStrategy | null {
  return typeof raw === 'string' && (MATCH_STRATEGIES as readonly string[]).includes(raw)
    ? (raw as MoyskladMatchStrategy)
    : null
}

/**
 * Convert kopecks (string-serialized BigInt) → rubles, preserving null.
 * AP#8: money field — null stays null (renders «—»), never 0.
 */
function kopeckToRubles(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n / 100 : null
}

/** Normalize a raw backend mapping row into the FE-canonical shape. */
export function mapMoyskladMapping(raw: unknown): MoyskladProductMapping {
  const r = asRecord(raw)
  // moyskladType: prefer the correct key; fall back to the backend `moyskadType` typo.
  // Defensive Frontend: unknown values → null (indicate, never silently coerce to PRODUCT).
  const typeRaw = r.moyskladType ?? r.moyskadType
  const type = typeRaw === 'PRODUCT' ? 'PRODUCT' : typeRaw === 'VARIANT' ? 'VARIANT' : null

  return {
    id: String(r.id ?? ''),
    moyskladAssortmentId: String(r.moyskladAssortmentId ?? ''),
    moyskladType: type,
    moyskladName: toStringOrNull(r.moyskladName),
    moyskladArticle: toStringOrNull(r.moyskladArticle),
    nmId: toNullableNumber(r.nmId),
    matchedBy: toMatchStrategy(r.matchedBy),
    buyPriceRub: kopeckToRubles(r.buyPriceKopeck),
    lastSyncedAt: toStringOrNull(r.lastSyncedAt),
  }
}

/** Normalize the `{ count, total, rows }` mappings envelope. */
function normalizeMappingsResponse(raw: unknown): MoyskladMappingsResponse {
  const r = asRecord(raw)
  const rows = Array.isArray(r.rows) ? r.rows.map(mapMoyskladMapping) : []
  return {
    count: toCount(r.count),
    total: toCount(r.total),
    rows,
  }
}

/** Normalize the `{ rows }` organizations envelope. */
function normalizeOrganizationsResponse(raw: unknown): MoyskladOrganization[] {
  const r = asRecord(raw)
  if (!Array.isArray(r.rows)) return []
  return r.rows.map((item: unknown) => {
    const o = asRecord(item)
    return {
      id: String(o.id ?? ''),
      name: String(o.name ?? ''),
      legalTitle: toStringOrNull(o.legalTitle),
      inn: toStringOrNull(o.inn),
    }
  })
}

export interface MoyskladMappingsParams {
  /** `true` = matched only; `false` = pending; omitted = all. */
  matched?: boolean
  /** Positive int; `0` is treated as absent (→ default) by the backend. */
  limit?: number
  offset?: number
}

/** GET /v1/moysklad/health — no live МС call, safe anytime. */
export async function getMoyskladHealth(): Promise<MoyskladHealth> {
  const raw = await apiClient.get<unknown>('/v1/moysklad/health', { skipDataUnwrap: true })
  const r = asRecord(raw)
  return {
    status: String(r.status ?? ''),
    readOnly: Boolean(r.readOnly),
    orgId: toStringOrNull(r.orgId),
    baseUrl: toStringOrNull(r.baseUrl),
    tokenConfigured: Boolean(r.tokenConfigured),
  }
}

/** GET /v1/moysklad/mappings → matched/pending/all cache rows. */
export async function getMoyskladMappings(
  params: MoyskladMappingsParams = {}
): Promise<MoyskladMappingsResponse> {
  const qs = new URLSearchParams()
  if (typeof params.matched === 'boolean') qs.set('matched', String(params.matched))
  if (typeof params.limit === 'number' && params.limit > 0) qs.set('limit', String(params.limit))
  if (typeof params.offset === 'number' && params.offset > 0)
    qs.set('offset', String(params.offset))
  const query = qs.size > 0 ? `?${qs.toString()}` : ''
  const raw = await apiClient.get<unknown>(`/v1/moysklad/mappings${query}`, {
    skipDataUnwrap: true,
  })
  return normalizeMappingsResponse(raw)
}

/** GET /v1/moysklad/organizations → юрлица for the token (live МС call). */
export async function getMoyskladOrganizations(): Promise<MoyskladOrganization[]> {
  const raw = await apiClient.get<unknown>('/v1/moysklad/organizations', {
    skipDataUnwrap: true,
  })
  return normalizeOrganizationsResponse(raw)
}

/** POST /v1/moysklad/sync → 202 enqueued. Writes only to OUR DB (D43/D44). */
export async function enqueueMoyskladSync(): Promise<EnqueueSyncResponse> {
  return apiClient.post<EnqueueSyncResponse>('/v1/moysklad/sync')
}

/** POST /v1/moysklad/mappings/:id/link → manual link, survives re-syncs. */
export async function linkMapping(id: string, nmId: number): Promise<LinkMappingResponse> {
  return apiClient.post<LinkMappingResponse>(`/v1/moysklad/mappings/${id}/link`, { nmId })
}
