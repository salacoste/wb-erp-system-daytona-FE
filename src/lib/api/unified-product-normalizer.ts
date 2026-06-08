/**
 * Unified Product Analytics Boundary Normalizer — Stories 120.6 + 120.7-FE.
 *
 * Absorbs backend shape drift for the main product analytics endpoint.
 * Raw backend shapes never reach hooks or components (Boundary Normalizer
 * Pattern — CLAUDE-PATTERNS.md). Uses Track C helpers (Story 120.1-FE).
 *
 * Related normalizers extracted for line-cap compliance:
 *   - unified-product-share-normalizer.ts — organic-share + incremental ROAS
 *
 * AP#8 split:
 *   - Counts (views, clicks, orders, spend) → toCount (null → 0)
 *   - Ratios (conversions, shares, rates) → toNullableNumber (null → null)
 *   - Dates → toStringOrNull (reject non-strings)
 */

import type {
  AdvDayItem,
  AdvTotals,
  CampaignBreakdown,
  FunnelDayItem,
  FunnelTotals,
  OrganicDayItem,
  OrganicTotals,
  UnifiedProductData,
  UnifiedProductSummary,
} from '@/types/unified-product'
import { asRecord, toCount, toNullableNumber, toStringOrNull } from '@/lib/api/normalizer-helpers'

// ============================================================
// Funnel
// ============================================================

function normalizeFunnelDay(raw: unknown): FunnelDayItem {
  const r = asRecord(raw)
  return {
    date: toStringOrNull(r.date) ?? '',
    openCardCount: toCount(r.openCardCount),
    addToCartCount: toCount(r.addToCartCount),
    ordersCount: toCount(r.ordersCount),
    buyoutCount: toCount(r.buyoutCount),
    cancelCount: toCount(r.cancelCount),
    cartConversion: toNullableNumber(r.cartConversion),
    orderConversion: toNullableNumber(r.orderConversion),
    buyoutConversion: toNullableNumber(r.buyoutConversion),
    cancelRate: toNullableNumber(r.cancelRate),
    totalConversion: toNullableNumber(r.totalConversion),
  }
}

function normalizeFunnelTotals(raw: unknown): FunnelTotals {
  const r = asRecord(raw)
  return {
    openCardCount: toCount(r.openCardCount),
    addToCartCount: toCount(r.addToCartCount),
    ordersCount: toCount(r.ordersCount),
    buyoutCount: toCount(r.buyoutCount),
    cancelCount: toCount(r.cancelCount),
    avgCartConversion: toNullableNumber(r.avgCartConversion),
    avgOrderConversion: toNullableNumber(r.avgOrderConversion),
    avgBuyoutConversion: toNullableNumber(r.avgBuyoutConversion),
  }
}

// ============================================================
// Advertising
// ============================================================

function normalizeAdvDay(raw: unknown): AdvDayItem {
  const r = asRecord(raw)
  return {
    date: toStringOrNull(r.date) ?? '',
    views: toCount(r.views),
    clicks: toCount(r.clicks),
    orders: toCount(r.orders),
    spend: toCount(r.spend),
    ctr: toCount(r.ctr),
    cpc: toCount(r.cpc),
  }
}

function normalizeAdvTotals(raw: unknown): AdvTotals {
  const r = asRecord(raw)
  return {
    views: toCount(r.views),
    clicks: toCount(r.clicks),
    orders: toCount(r.orders),
    spend: toCount(r.spend),
    avgCtr: toCount(r.avgCtr),
    avgCpc: toCount(r.avgCpc),
  }
}

function normalizeCampaign(raw: unknown): CampaignBreakdown {
  const r = asRecord(raw)
  return {
    advertId: toCount(r.advertId),
    views: toCount(r.views),
    clicks: toCount(r.clicks),
    orders: toCount(r.orders),
    spend: toCount(r.spend),
  }
}

// ============================================================
// Organic
// ============================================================

function normalizeOrganicDay(raw: unknown): OrganicDayItem {
  const r = asRecord(raw)
  return {
    date: toStringOrNull(r.date) ?? '',
    organicViews: toCount(r.organicViews),
    organicOrders: toCount(r.organicOrders),
  }
}

function normalizeOrganicTotals(raw: unknown): OrganicTotals {
  const r = asRecord(raw)
  return {
    organicViews: toCount(r.organicViews),
    organicOrders: toCount(r.organicOrders),
  }
}

// ============================================================
// Summary
// ============================================================

function normalizeSummary(raw: unknown): UnifiedProductSummary {
  const r = asRecord(raw)
  return {
    organicTrafficShare: toCount(r.organicTrafficShare),
    adTrafficShare: toCount(r.adTrafficShare),
    blendedConversion: toCount(r.blendedConversion),
  }
}

// ============================================================
// Top-level normalizer
// ============================================================

/**
 * normalizeUnifiedProductResponse — Boundary Normalizer for GET /unified.
 * Coerces the raw backend response into the canonical frontend shape.
 * nmId is coerced to string (AP#10: opaque ID, never formatNumber).
 */
export function normalizeUnifiedProductResponse(raw: unknown): UnifiedProductData {
  const r = asRecord(raw)
  const funnel = asRecord(r.funnel)
  const adv = asRecord(r.advertising)
  const organic = asRecord(r.organic)
  const period = asRecord(r.period)

  return {
    // AP#10: opaque ID → String(), never formatNumber
    nmId: String(r.nmId ?? ''),
    period: {
      from: toStringOrNull(period.from) ?? '',
      to: toStringOrNull(period.to) ?? '',
    },
    funnel: {
      dates: Array.isArray(funnel.dates) ? funnel.dates.map(normalizeFunnelDay) : [],
      totals: normalizeFunnelTotals(funnel.totals),
    },
    advertising: {
      dates: Array.isArray(adv.dates) ? adv.dates.map(normalizeAdvDay) : [],
      totals: normalizeAdvTotals(adv.totals),
      campaigns: Array.isArray(adv.campaigns) ? adv.campaigns.map(normalizeCampaign) : [],
    },
    organic: {
      dates: Array.isArray(organic.dates) ? organic.dates.map(normalizeOrganicDay) : [],
      totals: normalizeOrganicTotals(organic.totals),
    },
    summary: normalizeSummary(r.summary),
  }
}
