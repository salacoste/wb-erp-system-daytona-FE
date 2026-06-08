/**
 * Funnel Analytics Boundary Normalizer — Epic 119-FE retro A-3
 * (deferred from Story 119.2-FE 1st-pass F-10).
 *
 * Absorbs backend shape drift for GET /v1/analytics/funnel and
 * /v1/analytics/funnel/sync-status. Raw backend shapes never reach the hook or
 * components (Boundary Normalizer Pattern — CLAUDE-PATTERNS.md). Structural twin
 * of src/lib/api/search-analytics-normalizer.ts (Story 119.1-FE).
 *
 * Per-item normalizers extracted to ./funnel-item-normalizer.ts.
 *
 * AP#8: funnel numerics are SEMANTIC-ZERO (toCount), NOT nullable-unknown.
 * Discriminated union: items routed by request's groupBy, NOT by per-item sniffing.
 */

import type {
  FunnelResponse,
  FunnelResponseMeta,
  FunnelSummary,
  FunnelSyncStatus,
} from '@/types/analytics-funnel'
import { asRecord, toCount, toOptionalString } from '@/lib/api/normalizer-helpers'
import { normalizeFunnelProductItem, normalizeFunnelDayItem } from './funnel-item-normalizer'

// Re-export per-item normalizers for direct consumer access
export {
  normalizeFunnelProductItem,
  normalizeFunnelDayItem,
  normalizeTopSearchQuery,
} from './funnel-item-normalizer'

function normalizeFunnelSummary(raw: unknown): FunnelSummary {
  const r = asRecord(raw)
  return {
    ordersSumRub: toCount(r.ordersSumRub),
    buyoutSumRub: toCount(r.buyoutSumRub),
    cancelSumRub: toCount(r.cancelSumRub),
    // Shared metrics from item normalizer — inline spread since summary uses same shape.
    openCardCount: toCount(r.openCardCount),
    addToCartCount: toCount(r.addToCartCount),
    ordersCount: toCount(r.ordersCount),
    buyoutCount: toCount(r.buyoutCount),
    cancelCount: toCount(r.cancelCount),
    cartConversion: toCount(r.cartConversion),
    orderConversion: toCount(r.orderConversion),
    buyoutConversion: toCount(r.buyoutConversion),
    cancelRate: toCount(r.cancelRate),
    totalConversion: toCount(r.totalConversion),
  }
}

/**
 * normalizeFunnelMeta — Epic 114.5. The `meta` field is optional on the backend
 * contract (absent on older/cached responses), so return undefined when raw.meta
 * is missing or not an object. When present, coerce defensively.
 */
function normalizeFunnelMeta(raw: unknown): FunnelResponseMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const m = asRecord(raw)
  const dataSource = asRecord(m.dataSource)
  const syncedPeriod = asRecord(m.syncedPeriod)
  return {
    totalConversionApproximate: m.totalConversionApproximate === true,
    dailyGranularityAvailable: m.dailyGranularityAvailable === true,
    dataSource: {
      funnel: toOptionalString(dataSource.funnel) ?? '',
      buyout: toOptionalString(dataSource.buyout) ?? '',
    },
    syncedPeriod: {
      from: toOptionalString(syncedPeriod.from) ?? '',
      to: toOptionalString(syncedPeriod.to) ?? '',
      lastSyncAt: typeof syncedPeriod.lastSyncAt === 'string' ? syncedPeriod.lastSyncAt : null,
    },
  }
}

/**
 * @param groupBy request intent — routes the whole homogeneous items array.
 *   'day' → FunnelDayItem; 'product' (default) → FunnelProductItem.
 */
export function normalizeFunnelResponse(
  raw: unknown,
  groupBy: 'product' | 'day' = 'product'
): FunnelResponse {
  const r = asRecord(raw)
  const rawItems = Array.isArray(r.items) ? r.items : []
  const normalizeItem: (
    raw: unknown
  ) => ReturnType<typeof normalizeFunnelProductItem> | ReturnType<typeof normalizeFunnelDayItem> =
    groupBy === 'day' ? normalizeFunnelDayItem : normalizeFunnelProductItem
  const pagination = asRecord(r.pagination)
  const response: FunnelResponse = {
    items: rawItems.map(normalizeItem),
    summary: normalizeFunnelSummary(r.summary),
    pagination: {
      total: toCount(pagination.total),
      limit: toCount(pagination.limit),
      offset: toCount(pagination.offset),
      hasMore: pagination.hasMore === true,
    },
  }
  const meta = normalizeFunnelMeta(r.meta)
  if (meta !== undefined) response.meta = meta
  return response
}

export function normalizeFunnelSyncStatus(raw: unknown): FunnelSyncStatus {
  const r = asRecord(raw)
  return {
    lastSyncAt: typeof r.lastSyncAt === 'string' ? r.lastSyncAt : null,
    recordsCount: toCount(r.recordsCount),
    productsCount: toCount(r.productsCount),
  }
}
