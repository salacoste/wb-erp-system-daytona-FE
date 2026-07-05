/**
 * Brand-Share API — PR4b competitive analytics (3-method read-only chain).
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 *
 *   1. GET /v1/analytics/brand-share/brands            → string[]
 *   2. GET /v1/analytics/brand-share/parent-subjects   → [{ parentId, parentName }]
 *   3. GET /v1/analytics/brand-share                   → { report: [{ applyDate, … }] }
 *
 * NULLABILITY (AP#8): brandRating / pricePercent / qtyPercent are `number | null`.
 * The normalizer preserves null/0 verbatim — render «—», never coerce to 0.
 *
 * Errors: a failing upstream WB call surfaces as `503 ServiceUnavailableException`
 * (`ApiError { status: 503 }`); the hook/view maps that to a friendly RU error state.
 */
import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  BrandParentSubject,
  BrandShareDateRange,
  BrandShareReport,
  BrandShareReportPoint,
} from '@/types/brand-share'

/** Build a `?brand=&dateFrom=&dateTo=` query, dropping undefined/empty params. */
function buildBrandShareQuery(params: {
  brand?: string
  parentId?: number
  dateFrom?: string
  dateTo?: string
}): string {
  const sp = new URLSearchParams()
  if (params.brand) sp.append('brand', params.brand)
  if (params.parentId != null) sp.append('parentId', String(params.parentId))
  if (params.dateFrom) sp.append('dateFrom', params.dateFrom)
  if (params.dateTo) sp.append('dateTo', params.dateTo)
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Coerce a raw numeric/null field into `number | null` WITHOUT `?? 0` (AP#8).
 * Accepts numbers and numeric strings; `null`/`undefined`/`''`/non-numeric → `null`.
 */
function toNullableMetric(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Map one raw report row to the FE-canonical shape. Preserves nulls (AP#8). */
function mapReportPoint(raw: unknown): BrandShareReportPoint {
  const e = (raw ?? {}) as Record<string, unknown>
  const applyDate = typeof e.applyDate === 'string' ? e.applyDate : ''
  return {
    applyDate,
    brandRating: toNullableMetric(e.brandRating),
    pricePercent: toNullableMetric(e.pricePercent),
    qtyPercent: toNullableMetric(e.qtyPercent),
  }
}

/** Map one raw parent-subject row to the FE-canonical shape. */
function mapParentSubject(raw: unknown): BrandParentSubject | null {
  const e = (raw ?? {}) as Record<string, unknown>
  const parentId =
    typeof e.parentId === 'number' ? e.parentId : Number(e.parentId ?? NaN)
  if (!Number.isFinite(parentId)) return null
  const parentName = typeof e.parentName === 'string' ? e.parentName : String(e.parentName ?? '')
  return { parentId, parentName }
}

/** 1. GET /v1/analytics/brand-share/brands → string[] (brand names available). */
export async function getBrandShareBrands(): Promise<string[]> {
  logger.debug('[Brand-Share API] Fetching brands')
  const raw = (await apiClient.get<unknown>('/v1/analytics/brand-share/brands')) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map(b => (typeof b === 'string' ? b : String(b ?? ''))).filter(b => b !== '')
}

/** 2. GET /v1/analytics/brand-share/parent-subjects?brand=&dateFrom=&dateTo= */
export async function getBrandShareParentSubjects(params: {
  brand: string
} & BrandShareDateRange): Promise<BrandParentSubject[]> {
  const qs = buildBrandShareQuery({
    brand: params.brand,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })
  logger.debug('[Brand-Share API] Fetching parent subjects', { brand: params.brand })
  const raw = (await apiClient.get<unknown>(
    `/v1/analytics/brand-share/parent-subjects${qs}`
  )) as unknown
  if (!Array.isArray(raw)) return []
  return raw
    .map(mapParentSubject)
    .filter((s): s is BrandParentSubject => s !== null)
}

/** 3. GET /v1/analytics/brand-share?brand=&parentId=&dateFrom=&dateTo= */
export async function getBrandShareReport(params: {
  brand: string
  parentId: number
} & BrandShareDateRange): Promise<BrandShareReport> {
  const qs = buildBrandShareQuery({
    brand: params.brand,
    parentId: params.parentId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })
  logger.debug('[Brand-Share API] Fetching report', {
    brand: params.brand,
    parentId: params.parentId,
  })
  const raw = (await apiClient.get<unknown>(`/v1/analytics/brand-share${qs}`)) as Record<
    string,
    unknown
  >
  const reportRaw = Array.isArray(raw?.report) ? raw.report : []
  return { report: reportRaw.map(mapReportPoint) }
}

/** Query keys for brand-share (cabinet-scoped implicitly by `X-Cabinet-Id`). */
export const brandShareQueryKeys = {
  all: ['analytics', 'brand-share'] as const,
  brands: () => [...brandShareQueryKeys.all, 'brands'] as const,
  parentSubjects: (brand: string, range: BrandShareDateRange) =>
    [...brandShareQueryKeys.all, 'parent-subjects', { brand, ...range }] as const,
  report: (brand: string, parentId: number, range: BrandShareDateRange) =>
    [...brandShareQueryKeys.all, 'report', { brand, parentId, ...range }] as const,
}
