/**
 * Boundary normalizer for Liquidity Trends
 * GET /v1/analytics/liquidity/trends
 *
 * Summary endpoint already uses mapBackendResponse via liquidity-summary-mapper.
 * This normalizer covers the trends response with nested distribution objects.
 */

import { asRecord, toStr, toCount } from '@/lib/api/normalizer-helpers'
import type {
  LiquidityTrendsResponse,
  LiquidityTrendsMeta,
  TrendDataPoint,
  TrendDistribution,
  TrendInsight,
  TrendInsightType,
} from '@/types/liquidity'

function normalizeTrendDistribution(raw: unknown): TrendDistribution {
  const d = asRecord(raw)
  return {
    highly_liquid_pct: toCount(d.highly_liquid_pct),
    medium_pct: toCount(d.medium_pct),
    low_pct: toCount(d.low_pct),
    illiquid_pct: toCount(d.illiquid_pct),
  }
}

function normalizeTrendDataPoint(raw: unknown): TrendDataPoint {
  const d = asRecord(raw)
  return {
    date: toStr(d.date),
    distribution: normalizeTrendDistribution(d.distribution),
    frozen_capital: toCount(d.frozen_capital),
    avg_turnover_days: toCount(d.avg_turnover_days),
  }
}

function normalizeTrendInsight(raw: unknown): TrendInsight {
  const d = asRecord(raw)
  return {
    type: toStr(d.type) as TrendInsightType,
    message: toStr(d.message),
  }
}

/** Normalize liquidity trends response */
export function normalizeLiquidityTrendsResponse(raw: unknown): LiquidityTrendsResponse {
  const d = asRecord(raw)
  const meta = asRecord(d.meta)
  return {
    meta: {
      cabinet_id: toStr(meta.cabinet_id),
      period_days: toCount(meta.period_days),
      generated_at: toStr(meta.generated_at),
    } satisfies LiquidityTrendsMeta,
    trends: Array.isArray(d.trends) ? d.trends.map(normalizeTrendDataPoint) : [],
    insights: Array.isArray(d.insights) ? d.insights.map(normalizeTrendInsight) : [],
  }
}
