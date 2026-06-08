/**
 * Liquidity Distribution Mappers — Epic 7 (Ликвидность товаров)
 * Extracted from liquidity-summary-mapper.ts (200-line ESLint cap, batch 2)
 *
 * Contains: sumStockValue, mapDistribution, avgTurnoverDays, computeBenchmarks.
 * Only mapDistribution and computeBenchmarks are used externally by liquidity-summary-mapper.
 */

import type {
  LiquidityItem,
  LiquidityDistribution,
  LiquidityDistributionItem,
  LiquidityBenchmarks,
  LiquidityCategory,
} from '@/types/liquidity'
import type { RawLiquidityBreakdown, RawLiquidityBreakdownEntry } from './liquidity-raw-types'

/**
 * Sum `stock_value` across items for inventory totals. stock_value is `number | null` (null = COGS
 * unassigned); an unknown value can only contribute 0 to a SUM, so we coalesce here in one place.
 */
export function sumStockValue(items: LiquidityItem[]): number {
  // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: null stock_value (no COGS) contributes 0 to an inventory total
  return items.reduce((sum, i) => sum + (i.stock_value ?? 0), 0)
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
 * no_sales_count is computed alongside and surfaces the count of zero-sales SKUs per category.
 */
export function avgTurnoverDays(items: LiquidityItem[]): number {
  if (items.length === 0) return 0
  const selling = items.filter(i => i.turnover_days < 999)
  if (selling.length === 0) return 999
  return Math.round(selling.reduce((s, i) => s + i.turnover_days, 0) / selling.length)
}

/** Map backend distribution (liquidity_breakdown) to frontend LiquidityDistribution */
export function mapDistribution(
  breakdown: RawLiquidityBreakdown | undefined,
  items: LiquidityItem[]
): LiquidityDistribution {
  const makeDefault = (cat: LiquidityCategory): LiquidityDistributionItem => {
    const catItems = items.filter(i => i.liquidity_category === cat)
    const totalValue = sumStockValue(items)
    const catValue = sumStockValue(catItems)
    return {
      count: catItems.length,
      value: catValue,
      pct: totalValue > 0 ? (catValue / totalValue) * 100 : 0,
      avg_turnover_days: avgTurnoverDays(catItems),
      no_sales_count: catItems.filter(i => i.turnover_days >= 999).length,
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
  // category — NO `pct`, NO `avg_turnover_days`. The old `?? 0` made every distribution cards
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
    (sum, e) =>
      sum +
      ((e as RawLiquidityBreakdownEntry)?.capital ?? (e as RawLiquidityBreakdownEntry)?.value ?? 0),
    0
  )
  const mapCat = (cat: LiquidityCategory): LiquidityDistributionItem => {
    const entry = breakdown[cat] as RawLiquidityBreakdownEntry | undefined
    if (entry && typeof entry === 'object') {
      const value = entry.capital ?? entry.value ?? 0
      const catItems = items.filter(i => i.liquidity_category === cat)
      return {
        count: entry.count ?? entry.sku_count ?? 0,
        value,
        pct: entry.pct ?? entry.percentage ?? (totalCapital > 0 ? (value / totalCapital) * 100 : 0),
        avg_turnover_days:
          entry.avg_turnover_days ?? entry.avg_turnover ?? avgTurnoverDays(catItems),
        no_sales_count: catItems.filter(i => i.turnover_days >= 999).length,
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

/** Compute benchmarks from distribution data (hardcoded targets per spec) */
export function computeBenchmarks(
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
