/**
 * Liquidity Summary-Level Mappers — Epic 7 (Ликвидность товаров)
 * Extracted from liquidity.ts (Epic 74, Story 74.5, Task 8)
 * Maps backend summary/distribution/meta/benchmarks to frontend types.
 */

import type {
  LiquidityResponse,
  LiquidityItem,
  LiquiditySummary,
  LiquidityMeta,
  LiquidityDistribution,
  LiquidityDistributionItem,
  LiquidityBenchmarks,
  LiquidityCategory,
} from '@/types/liquidity'
import { mapItem } from './liquidity-item-mapper'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Map backend distribution (liquidity_breakdown) to frontend LiquidityDistribution */
function mapDistribution(
  breakdown: Record<string, any> | undefined,
  items: LiquidityItem[]
): LiquidityDistribution {
  const makeDefault = (cat: LiquidityCategory): LiquidityDistributionItem => {
    const catItems = items.filter(i => i.liquidity_category === cat)
    const totalValue = items.reduce((sum, i) => sum + i.stock_value, 0)
    const catValue = catItems.reduce((sum, i) => sum + i.stock_value, 0)
    return {
      count: catItems.length,
      value: catValue,
      pct: totalValue > 0 ? (catValue / totalValue) * 100 : 0,
      avg_turnover_days:
        catItems.length > 0
          ? Math.round(catItems.reduce((s, i) => s + i.turnover_days, 0) / catItems.length)
          : 0,
    }
  }

  if (!breakdown) {
    return {
      highly_liquid: makeDefault('highly_liquid'),
      medium: makeDefault('medium'),
      low: makeDefault('low'),
      illiquid: makeDefault('illiquid'),
    }
  }

  const mapCat = (cat: LiquidityCategory): LiquidityDistributionItem => {
    const entry = breakdown[cat]
    if (entry && typeof entry === 'object') {
      return {
        count: entry.count ?? entry.sku_count ?? 0,
        value: entry.capital ?? entry.value ?? 0,
        pct: entry.pct ?? entry.percentage ?? 0,
        avg_turnover_days: entry.avg_turnover_days ?? entry.avg_turnover ?? 0,
      }
    }
    return makeDefault(cat)
  }

  return {
    highly_liquid: mapCat('highly_liquid'),
    medium: mapCat('medium'),
    low: mapCat('low'),
    illiquid: mapCat('illiquid'),
  }
}

/** Average turnover days from items (reused by computeBenchmarks + mapSummary) */
function avgTurnoverDays(items: LiquidityItem[]): number {
  return items.length > 0
    ? Math.round(items.reduce((s, i) => s + i.turnover_days, 0) / items.length)
    : 0
}

/** Compute benchmarks from distribution data (hardcoded targets per spec) */
function computeBenchmarks(
  dist: LiquidityDistribution,
  items: LiquidityItem[]
): LiquidityBenchmarks {
  const hPct = dist.highly_liquid.pct
  const iPct = dist.illiquid.pct
  let status: LiquidityBenchmarks['overall_status']
  if (hPct >= 50 && iPct <= 5) status = 'excellent'
  else if (hPct >= 40 && iPct <= 10) status = 'good'
  else if (iPct <= 15) status = 'warning'
  else status = 'critical'

  return {
    your_avg_turnover: avgTurnoverDays(items),
    target_avg_turnover: 45,
    industry_avg_turnover: 52,
    highly_liquid_pct: hPct,
    target_highly_liquid_pct: 50,
    illiquid_pct: iPct,
    target_illiquid_pct: 5,
    overall_status: status,
  }
}

/** Map backend summary to LiquiditySummary */
function mapSummary(
  raw: Record<string, any> | undefined,
  items: LiquidityItem[]
): LiquiditySummary {
  if (!raw) {
    const totalValue = items.reduce((sum, i) => sum + i.stock_value, 0)
    const frozen = items
      .filter(i => i.liquidity_category === 'illiquid')
      .reduce((sum, i) => sum + i.stock_value, 0)
    const distribution = mapDistribution(undefined, items)
    return {
      total_inventory_value: totalValue,
      total_sku_count: items.length,
      frozen_capital: frozen,
      frozen_capital_pct: totalValue > 0 ? (frozen / totalValue) * 100 : 0,
      avg_turnover_days: avgTurnoverDays(items),
      distribution,
      benchmarks: computeBenchmarks(distribution, items),
    }
  }

  const distribution = mapDistribution(raw.liquidity_breakdown ?? raw.distribution, items)
  const totalSkus = raw.total_skus ?? raw.total_sku_count ?? items.length
  const totalFrozen = raw.total_frozen_capital ?? raw.frozen_capital ?? 0
  const totalInv = raw.total_inventory_value ?? items.reduce((sum, i) => sum + i.stock_value, 0)

  return {
    total_inventory_value: totalInv,
    total_sku_count: totalSkus,
    frozen_capital: totalFrozen,
    frozen_capital_pct:
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: frozen_capital_pct 0 = inventory=0 (can't freeze nothing)
      totalInv > 0 ? (totalFrozen / totalInv) * 100 : (raw.frozen_capital_pct ?? 0),
    avg_turnover_days: raw.avg_turnover_days ?? avgTurnoverDays(items),
    distribution,
    benchmarks: raw.benchmarks ?? computeBenchmarks(distribution, items),
  }
}

/** Map backend meta to LiquidityMeta */
function mapMeta(raw: Record<string, any> | undefined): LiquidityMeta {
  if (!raw) {
    return {
      cabinet_id: '',
      analysis_period_days: 30,
      generated_at: new Date().toISOString(),
      stock_data_updated_at: new Date().toISOString(),
    }
  }
  return {
    cabinet_id: raw.cabinet_id ?? '',
    analysis_period_days:
      raw.analysis_period_days ?? (raw.turnover_weeks ? raw.turnover_weeks * 7 : 30),
    generated_at: raw.generated_at ?? new Date().toISOString(),
    stock_data_updated_at:
      raw.stock_data_updated_at ?? raw.stocks_updated_at ?? new Date().toISOString(),
  }
}

/** Check if response already matches frontend types (mock/pass-through) */
function isAlreadyMapped(raw: any): boolean {
  if (!raw?.meta || !raw?.summary || !Array.isArray(raw?.data)) return false
  // Check for frontend-specific fields that backend doesn't have
  return (
    typeof raw.summary.total_sku_count === 'number' &&
    typeof raw.summary.distribution === 'object' &&
    raw.summary.distribution !== null &&
    typeof raw.summary.benchmarks === 'object'
  )
}

/**
 * Map raw backend response to LiquidityResponse.
 * Handles both already-conforming (mock) and backend-shaped data.
 */
export function mapBackendResponse(raw: any): LiquidityResponse {
  // If already conforms to frontend types (e.g. mock data), pass through
  if (isAlreadyMapped(raw)) {
    return raw as LiquidityResponse
  }

  const rawItems: any[] = Array.isArray(raw.data) ? raw.data : []
  const items = rawItems.map(mapItem)

  return {
    meta: mapMeta(raw.meta),
    summary: mapSummary(raw.summary, items),
    data: items,
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
