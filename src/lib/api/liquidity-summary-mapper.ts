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
      avg_turnover_days: avgTurnoverDays(catItems),
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

  // liquidity iter-60: the backend `liquidity_breakdown` ships only {count, capital} per
  // category — NO `pct`, NO `avg_turnover_days`. The old `?? 0` made every distribution card
  // render a "0 %" headline + "0 дней" (and skewed computeBenchmarks → wrong 'warning' status
  // when all capital is illiquid). Derive both from data already present, keeping the SAME
  // semantic as makeDefault + the `pct` type doc ("% of total inventory value") + the
  // computeBenchmarks thresholds + the targetShare labels — all of which are CAPITAL-share:
  //   pct = this category's capital / total capital across categories.
  // (Capital-share is correct here: e.g. illiquid 100% surfaces "all frozen capital is dead
  // stock"; highly_liquid 0% means those SKUs tie up no capital — both honest, not fabricated.)
  // avg_turnover_days is derived from this category's items; note that derivation is
  // items-page-scoped and reads 0 if no items for the category are in the returned page.
  // Backend-provided pct/turnover still win if ever sent.
  const totalCapital = Object.values(breakdown).reduce(
    (sum: number, e: any) => sum + (e?.capital ?? e?.value ?? 0),
    0
  )
  const mapCat = (cat: LiquidityCategory): LiquidityDistributionItem => {
    const entry = breakdown[cat]
    if (entry && typeof entry === 'object') {
      const value = entry.capital ?? entry.value ?? 0
      const catItems = items.filter(i => i.liquidity_category === cat)
      return {
        count: entry.count ?? entry.sku_count ?? 0,
        value,
        pct: entry.pct ?? entry.percentage ?? (totalCapital > 0 ? (value / totalCapital) * 100 : 0),
        avg_turnover_days:
          entry.avg_turnover_days ?? entry.avg_turnover ?? avgTurnoverDays(catItems),
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

/**
 * Average turnover days from items, EXCLUDING the "never sells" sentinel (turnover_days >= 999).
 * Averaging an ∞-sentinel with real day-counts yields a meaningless midpoint (e.g. [120, 999] →
 * 560 "дней") that hides dead stock and inflates the headline turnover. Average only items that
 * actually turn over; if NONE sell (all >= 999), return 999 so formatTurnoverDays renders
 * "Нет продаж" (preserves the all-no-sales behavior). Empty → 0.
 * Reused by category cards (mapDistribution), computeBenchmarks, and mapSummary.
 *
 * NOTE: mapItem defaults a missing backend `turnover_days` to 0 (LiquidityItem.turnover_days is
 * non-nullable `number`), so such items count as "selling" with 0 days and pull the mean down.
 * That is the pre-existing item-mapper contract; this filter just makes it load-bearing here.
 * FUTURE: the illiquid card's single avg understates dead stock when only a minority sell
 * (e.g. [120, 999, 999] → 120, no "2 без продаж" signal) — surface a no_sales_count on
 * LiquidityDistributionItem so the UI can render "120 дней (2 без продаж)".
 */
function avgTurnoverDays(items: LiquidityItem[]): number {
  if (items.length === 0) return 0
  const selling = items.filter(i => i.turnover_days < 999)
  if (selling.length === 0) return 999
  return Math.round(selling.reduce((s, i) => s + i.turnover_days, 0) / selling.length)
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
    // Backend sends avg_turnover_days: 0 for no-sales cabinets; 0 renders "< 1 дня"
    // (false instant-turnover), so treat a non-positive value as missing and prefer the
    // item-derived avg (all-999 items → 999 → formatTurnoverDays → "Нет продаж", correct).
    avg_turnover_days:
      typeof raw.avg_turnover_days === 'number' && raw.avg_turnover_days > 0
        ? raw.avg_turnover_days
        : avgTurnoverDays(items),
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
