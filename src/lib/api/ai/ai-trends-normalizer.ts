/**
 * AI Trends + Sneak Preview boundary normalizer — Story 108.1-FE
 * Endpoints: GET /v1/ai/trends, GET /v1/ai/sneak-preview
 */

import { toNullableNumber } from '../normalizer-helpers'
import { isTrendDirection } from '@/types/ai/trends-sneak'
import type {
  AiTrendsResponse,
  AiSneakPreviewResponse,
  SneakPreviewSkuForecast,
  TopSkuEntry,
} from '@/types/ai/trends-sneak'

// ── Trends ──────────────────────────────────────────────────────────────────

interface RawTopSkuEntry {
  nmId?: number | null
  vendorCode?: string | null
  avgPerDay?: number | null
  weeklyVolume?: number | null
}

function normalizeTopSku(raw: RawTopSkuEntry): TopSkuEntry {
  return {
    nmId: raw.nmId ?? 0,
    vendorCode: raw.vendorCode ?? null,
    avgPerDay: toNullableNumber(raw.avgPerDay),
    weeklyVolume: toNullableNumber(raw.weeklyVolume),
  }
}

interface RawAiTrendsResponse {
  topSkus?: RawTopSkuEntry[] | null
}

export function normalizeAiTrendsResponse(raw: unknown): AiTrendsResponse {
  const r = raw as RawAiTrendsResponse
  return {
    topSkus: (r.topSkus ?? []).map(normalizeTopSku),
  }
}

// ── Sneak Preview ────────────────────────────────────────────────────────────

interface RawSneakPreviewSkuForecast {
  nmId?: number | null
  vendorCode?: string | null
  avgPerDay?: number | null
  trend?: string | null
  estimatedRange?: { low?: number | null; high?: number | null } | null
}

interface RawAiSneakPreviewResponse {
  disclaimer?: string | null
  skuForecasts?: RawSneakPreviewSkuForecast[] | null
}

function normalizeSneakPreviewSku(raw: RawSneakPreviewSkuForecast): SneakPreviewSkuForecast {
  const rawTrend = raw.trend ?? ''
  // Defensive: unknown trend values fall back to 'stable' per backend guide risk #4
  const trend = isTrendDirection(rawTrend) ? rawTrend : 'stable'

  return {
    nmId: raw.nmId ?? 0,
    vendorCode: raw.vendorCode ?? null,
    avgPerDay: toNullableNumber(raw.avgPerDay),
    trend,
    estimatedRange: {
      low: toNullableNumber(raw.estimatedRange?.low),
      high: toNullableNumber(raw.estimatedRange?.high),
    },
  }
}

export function normalizeAiSneakPreviewResponse(raw: unknown): AiSneakPreviewResponse {
  const r = raw as RawAiSneakPreviewResponse
  return {
    disclaimer: r.disclaimer ?? '',
    skuForecasts: (r.skuForecasts ?? []).map(normalizeSneakPreviewSku),
  }
}
