/**
 * Organic-Share + Incremental ROAS Boundary Normalizers
 * Story 120.7-FE — GET /organic-share and GET /incremental-roas
 *
 * Extracted from unified-product-normalizer.ts for line-cap compliance.
 * Uses Track C helpers (Story 120.1-FE).
 */

import type {
  CampaignCartEstimate,
  CorrelationConfidence,
  CorrelationDayItem,
  IncrementalRoasData,
  RoasInterpretation,
} from '@/types/unified-product'
import { asRecord, toCount, toNullableNumber, toStringOrNull } from '@/lib/api/normalizer-helpers'

// ============================================================
// Organic-Share (GET /organic-share — CorrelationResult[])
// ============================================================

function normalizeCampaignCart(raw: unknown): CampaignCartEstimate {
  const r = asRecord(raw)
  return {
    advertId: toCount(r.advertId),
    adOrders: toCount(r.adOrders),
    spend: toCount(r.spend),
    estimatedAdCart: toNullableNumber(r.estimatedAdCart),
  }
}

const VALID_CONFIDENCE: readonly CorrelationConfidence[] = ['high', 'medium', 'low']

function normalizeConfidence(raw: unknown): CorrelationConfidence {
  if (typeof raw === 'string' && (VALID_CONFIDENCE as readonly string[]).includes(raw)) {
    return raw as CorrelationConfidence
  }
  return 'low'
}

/** Normalize a single CorrelationResult from GET /organic-share. */
export function normalizeCorrelationDay(raw: unknown): CorrelationDayItem {
  const r = asRecord(raw)
  return {
    date: toStringOrNull(r.date) ?? '',
    nmId: String(r.nmId ?? ''),
    adOrders: toCount(r.adOrders),
    estimatedAdCart: toNullableNumber(r.estimatedAdCart),
    organicCart: toCount(r.organicCart),
    confidence: normalizeConfidence(r.confidence),
    campaigns: Array.isArray(r.campaigns) ? r.campaigns.map(normalizeCampaignCart) : [],
  }
}

/** Normalize the full CorrelationResult[] from GET /organic-share. */
export function normalizeOrganicShareResponse(raw: unknown): CorrelationDayItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeCorrelationDay)
}

// ============================================================
// Incremental ROAS (GET /incremental-roas — IncrementalRoasResult)
// ============================================================

const VALID_INTERPRETATION: readonly RoasInterpretation[] = [
  'highly_effective',
  'effective',
  'marginal',
  'ineffective',
]

function normalizeInterpretation(raw: unknown): RoasInterpretation | null {
  if (typeof raw === 'string' && (VALID_INTERPRETATION as readonly string[]).includes(raw)) {
    return raw as RoasInterpretation
  }
  return null
}

/** Normalize IncrementalRoasResult from GET /incremental-roas. */
export function normalizeIncrementalRoasResponse(raw: unknown): IncrementalRoasData {
  const r = asRecord(raw)
  const period = asRecord(r.period)
  return {
    nmId: String(r.nmId ?? ''),
    period: {
      from: toStringOrNull(period.from) ?? '',
      to: toStringOrNull(period.to) ?? '',
    },
    totalRevenue: toCount(r.totalRevenue),
    estimatedOrganicRevenue: toCount(r.estimatedOrganicRevenue),
    adSpend: toCount(r.adSpend),
    incrementalRevenue: toCount(r.incrementalRevenue),
    iROAS: toNullableNumber(r.iROAS),
    interpretation: normalizeInterpretation(r.interpretation),
    organicCannibalizationPct: toNullableNumber(r.organicCannibalizationPct),
    totalOrders: toCount(r.totalOrders),
    estimatedOrganicOrders: toCount(r.estimatedOrganicOrders),
  }
}
