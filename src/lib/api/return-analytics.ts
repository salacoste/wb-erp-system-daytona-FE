/**
 * Return Analytics API Client
 * Epic 70-FE: Return reasons & per-SKU breakdown with anomaly detection
 *
 * Note: Backend Request #151 labels these endpoints as "Epic 71" — frontend canonicalizes to Epic 70-FE.
 * See docs/epics/epic-70-fe-returns-analytics.md (Numbering History) for the rename trail.
 *
 * Auth: X-Cabinet-Id header (auto-injected by apiClient)
 */

import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { normalizeReturnReasonsResponse } from './return-analytics-normalizer'
import type {
  ReturnReasonsResponse,
  BySkuReturnResponse,
  ReturnsBySkuParams,
} from '@/types/analytics-returns'

/**
 * Aggregated return reasons by category (for pie chart)
 * GET /v1/analytics/returns/reasons
 */
export async function getReturnReasons(
  from?: string,
  to?: string,
  locale?: 'ru' | 'en'
): Promise<ReturnReasonsResponse> {
  const sp = new URLSearchParams()
  if (from) sp.set('from', from)
  if (to) sp.set('to', to)
  if (locale) sp.set('locale', locale)

  logger.debug('[Returns] Fetching reasons:', { from, to, locale: locale ?? 'ru' })

  const raw = await apiClient.get<unknown>(`/v1/analytics/returns/reasons?${sp.toString()}`, {
    skipDataUnwrap: true,
  })
  const response = normalizeReturnReasonsResponse(raw)

  logger.debug('[Returns] Reasons response:', {
    totalReturns: response.summary.totalReturns,
    categories: response.byCategory.length,
  })

  return response
}

/**
 * Per-SKU return breakdown with anomaly flags (cursor pagination)
 * GET /v1/analytics/returns/reasons/by-sku
 *
 * Handles both raw classification records (current backend) and
 * pre-aggregated per-SKU data (future backend). Detects format
 * by checking if first item has `returnCategory` (raw) or `totalReturns` (aggregated).
 */
export async function getReturnsBySku(params: {
  from?: string
  to?: string
  nmId?: number
  anomalyOnly?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  cursor?: string
}): Promise<BySkuReturnResponse> {
  const sp = new URLSearchParams()
  if (params.from) sp.set('from', params.from)
  if (params.to) sp.set('to', params.to)
  if (params.nmId != null) sp.set('nmId', String(params.nmId))
  if (params.anomalyOnly != null) sp.set('anomalyOnly', String(params.anomalyOnly))
  if (params.sortBy) sp.set('sortBy', params.sortBy)
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.cursor) sp.set('cursor', params.cursor)

  logger.debug('[Returns] Fetching by-sku:', {
    from: params.from,
    to: params.to,
    anomalyOnly: params.anomalyOnly ?? false,
  })

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/returns/reasons/by-sku?${sp.toString()}`,
    {
      skipDataUnwrap: true,
    }
  )

  const rawResponse = raw as { data?: unknown[]; pagination?: unknown; summary?: unknown }
  const items = rawResponse.data ?? []
  const isRaw = items.length > 0 && 'returnCategory' in (items[0] as Record<string, unknown>)

  if (isRaw) {
    const aggregated = aggregateRawRecords(
      items as Array<{ nmId: number; returnCategory: string; [k: string]: unknown }>
    )
    logger.debug('[Returns] by-sku (raw→aggregated):', {
      rawRecords: items.length,
      aggregatedSkus: aggregated.length,
    })
    return {
      data: aggregated,
      pagination: (rawResponse.pagination as { count: number; hasMore: boolean }) ?? {
        count: aggregated.length,
        hasMore: false,
      },
      summary: { totalSkus: aggregated.length, anomalyCount: 0 },
    }
  }

  logger.debug('[Returns] by-sku (pre-aggregated):', {
    items: items.length,
    totalSkus: (rawResponse.summary as Record<string, unknown>)?.totalSkus ?? 0,
  })
  return rawResponse as unknown as BySkuReturnResponse
}

/** Aggregate raw classification records into per-SKU summary. Exported for unit testing (iter-127). */
export function aggregateRawRecords(
  records: Array<{ nmId: number; returnCategory: string; [k: string]: unknown }>
) {
  const map = new Map<number, { cancel: number; refusal: number; receipt: number }>()
  for (const r of records) {
    const entry = map.get(r.nmId) ?? { cancel: 0, refusal: 0, receipt: 0 }
    if (r.returnCategory === 'cancel_before_shipment') entry.cancel++
    else if (r.returnCategory === 'refusal_at_pvz') entry.refusal++
    else if (r.returnCategory === 'return_after_receipt') entry.receipt++
    map.set(r.nmId, entry)
  }
  return Array.from(map.entries()).map(([nmId, counts]) => ({
    nmId,
    productName: '',
    brand: '',
    totalReturns: counts.cancel + counts.refusal + counts.receipt,
    // null, NOT 0: raw return records carry no salesCount, so the rate is UNKNOWN here. 0 would
    // render green/"healthy" and hide a high-return SKU (iter-127, anti-pattern #8). Rendered "—".
    returnRate: null,
    cancelBeforeShipment: counts.cancel,
    refusalAtPvz: counts.refusal,
    returnAfterReceipt: counts.receipt,
    anomalyFlag: false,
  }))
}

// Query Keys Factory
export const returnQueryKeys = {
  all: ['return-analytics'] as const,
  reasons: (from?: string, to?: string) => [...returnQueryKeys.all, 'reasons', from, to] as const,
  bySku: (params: Partial<ReturnsBySkuParams>) =>
    [...returnQueryKeys.all, 'by-sku', params] as const,
}

// Cache: staleTime < backend TTL (5 min)
export const RETURN_CACHE = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const
