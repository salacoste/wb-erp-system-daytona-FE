/**
 * AI Trends + Sneak Preview API — boundary normalizers + fetchers
 * Endpoints: GET /v1/ai/trends, GET /v1/ai/sneak-preview
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
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

interface RawAiTrendsResponse {
  topSkus?: RawTopSkuEntry[] | null
}

function normalizeTopSku(raw: RawTopSkuEntry): TopSkuEntry {
  return {
    nmId: raw.nmId ?? 0,
    vendorCode: raw.vendorCode ?? null,
    avgPerDay: raw.avgPerDay ?? null,
    weeklyVolume: raw.weeklyVolume ?? null,
  }
}

export function normalizeAiTrendsResponse(raw: RawAiTrendsResponse): AiTrendsResponse {
  return {
    topSkus: (raw.topSkus ?? []).map(normalizeTopSku),
  }
}

export async function getAiTrends(): Promise<AiTrendsResponse> {
  const raw = await apiClient.get<RawAiTrendsResponse>('/v1/ai/trends')
  return normalizeAiTrendsResponse(raw)
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
    avgPerDay: raw.avgPerDay ?? null,
    trend,
    estimatedRange: {
      low: raw.estimatedRange?.low ?? null,
      high: raw.estimatedRange?.high ?? null,
    },
  }
}

export function normalizeAiSneakPreviewResponse(
  raw: RawAiSneakPreviewResponse
): AiSneakPreviewResponse {
  return {
    disclaimer: raw.disclaimer ?? '',
    skuForecasts: (raw.skuForecasts ?? []).map(normalizeSneakPreviewSku),
  }
}

export async function getAiSneakPreview(): Promise<AiSneakPreviewResponse> {
  const raw = await apiClient.get<RawAiSneakPreviewResponse>('/v1/ai/sneak-preview')
  return normalizeAiSneakPreviewResponse(raw)
}
