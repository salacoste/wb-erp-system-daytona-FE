/**
 * Cross-Reference Utilities — Story 73.7-FE
 * Merge search orders (groupBy=product) with advertising analytics (view_by=sku)
 * Join on nmId client-side. No backend cross-reference endpoint.
 */

import type { SearchOrderItem } from '@/types/search-analytics'
import type { AdvertisingItem } from '@/types/advertising-analytics'

export type Channel = 'organic' | 'ad' | 'both'

export interface CrossReferenceItem {
  nmId: number
  vendorCode: string | null
  totalOrders: number
  uniqueQueries: number | null
  adSpend: number
  adClicks: number
  /** Ad-attributed revenue. null when ads RAN but WB returned no revenue (unknown) — rendered
   *  "—", NOT 0 (anti-pattern #8). 0 means a genuinely organic row (no ads → no ad-revenue). */
  adRevenue: number | null
  channel: Channel
  /** Percentage of orders attributed to organic search (vs ads). null when not computed. */
  organicContribution?: number | null
}

export interface OverlapSummary {
  organicOnly: number
  adOnly: number
  both: number
  total: number
}

/** Parse nmId from advertising key format "sku:270937054" */
function parseNmId(adKey: string): number | null {
  const match = adKey.match(/^sku:(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

/** Merge search orders (groupBy=product) with advertising items (view_by=sku) */
export function mergeSearchAndAdData(
  searchItems: SearchOrderItem[],
  adItems: AdvertisingItem[]
): CrossReferenceItem[] {
  const searchMap = new Map<number, SearchOrderItem>()
  for (const item of searchItems) {
    // Defense-in-depth: post-Story-119.1-FE the search-analytics normalizer
    // coerces numeric keys to strings before they reach here. This typeof
    // branch is now dead in production but retained as a safety net for any
    // boundary-bypass path (consistent with Story 119.1-FE defense-in-depth
    // convention).
    const nmId = typeof item.key === 'number' ? item.key : parseInt(String(item.key), 10)
    if (!isNaN(nmId)) searchMap.set(nmId, item)
  }

  const adMap = new Map<number, AdvertisingItem>()
  for (const item of adItems) {
    const nmId = parseNmId(item.key)
    if (nmId !== null) adMap.set(nmId, item)
  }

  const allNmIds = new Set([...searchMap.keys(), ...adMap.keys()])
  const result: CrossReferenceItem[] = []

  for (const nmId of allNmIds) {
    const search = searchMap.get(nmId)
    const ad = adMap.get(nmId)
    const inSearch = !!search
    const inAd = !!ad

    result.push({
      nmId,
      vendorCode: search?.vendorCode ?? ad?.sku_id ?? null,
      totalOrders: search?.totalOrders ?? 0,
      uniqueQueries: search?.uniqueQueries ?? null,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: organic row (no ad item) → ad spend is genuinely 0, not unknown (AdvertisingItem.spend is non-null, so only the ad?-undefined branch fires)
      adSpend: ad?.spend ?? 0,
      adClicks: ad?.clicks ?? 0,
      // adRevenue is DISPLAYED per row (not aggregated), so preserve null: ad ran but WB returned
      // no revenue → null → "—" (anti-pattern #8). Organic rows (no ad item) → genuine 0.
      adRevenue: ad ? ad.revenue : 0,
      channel: inSearch && inAd ? 'both' : inSearch ? 'organic' : 'ad',
    })
  }

  // Default sort: ad spend DESC
  result.sort((a, b) => b.adSpend - a.adSpend)
  return result
}

/** Count organic-only, ad-only, and both-channel items */
export function computeOverlapSummary(items: CrossReferenceItem[]): OverlapSummary {
  let organicOnly = 0
  let adOnly = 0
  let both = 0
  for (const item of items) {
    if (item.channel === 'organic') organicOnly++
    else if (item.channel === 'ad') adOnly++
    else both++
  }
  return { organicOnly, adOnly, both, total: items.length }
}

/**
 * Format number as Russian currency string (whole rubles).
 * Uses Intl currency style so the ₽ is preceded by a NON-breaking space (it must not wrap to
 * a new line) — the prior template `${...} ₽` used a regular U+0020 space.
 */
export function fmtCurrency(n: number | null): string {
  if (n == null) return '—' // unknown (e.g. ad-attributed revenue not returned) — not "0 ₽"
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

/** Format number with Russian locale separators */
export function fmtNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

/** Get top products with high ad spend (potential overspend on organic-strong products) */
export function getTopWastedSpend(items: CrossReferenceItem[], limit = 5): CrossReferenceItem[] {
  return items
    .filter(item => item.channel === 'both' && item.adSpend > 0)
    .sort((a, b) => b.adSpend - a.adSpend)
    .slice(0, limit)
}
