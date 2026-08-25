/**
 * Ad ↔ Search Correlation Utilities — Feature 3.6
 * Pure functions for advertising + organic search cross-analysis.
 *
 * Three analyses:
 *   1. Keyword Overlap (Jaccard similarity between search queries and ad keywords)
 *   2. Position-Spend Correlation (Pearson r between organic orders and ad spend)
 *   3. Cannibalization Risk (organic contribution % vs ad spend classification)
 */

import type { CrossReferenceItem } from './cross-reference-utils'

// ---------------------------------------------------------------------------
// 1. Keyword Overlap — Jaccard similarity
// ---------------------------------------------------------------------------

export interface KeywordOverlapResult {
  /** Jaccard index: |A ∩ B| / |A ∪ B| (0..1) */
  jaccard: number
  /** Keywords found in BOTH search and ad sets */
  intersection: string[]
  /** Total unique keywords across both sets */
  unionSize: number
}

/** Case-insensitive set intersection of two keyword arrays */
export function computeKeywordOverlap(
  searchKeywords: string[],
  adKeywords: string[]
): KeywordOverlapResult {
  const searchSet = new Set(searchKeywords.map(k => k.toLowerCase().trim()))
  const adSet = new Set(adKeywords.map(k => k.toLowerCase().trim()))

  const intersection: string[] = []
  for (const kw of searchSet) {
    if (adSet.has(kw)) intersection.push(kw)
  }

  const unionSize = searchSet.size + adSet.size - intersection.length
  const jaccard = unionSize === 0 ? 0 : intersection.length / unionSize

  return { jaccard, intersection, unionSize }
}

// ---------------------------------------------------------------------------
// 2. Position-Spend Correlation — Pearson r
// ---------------------------------------------------------------------------

export interface CorrelationResult {
  /** Pearson correlation coefficient (-1..1). null when < 3 data points. */
  pearsonR: number | null
  /** Number of data points used */
  sampleSize: number
  /** Interpretation label (Russian) */
  label: string
}

/**
 * Pearson correlation between organic order count (proxy for search position)
 * and ad spend. Positive r = higher organic presence correlates with higher spend.
 */
export function computePositionSpendCorrelation(items: CrossReferenceItem[]): CorrelationResult {
  const filtered = items.filter(i => i.totalOrders > 0 || i.adSpend > 0)
  const n = filtered.length

  if (n < 3) {
    return { pearsonR: null, sampleSize: n, label: 'Недостаточно данных' }
  }

  const sumX = filtered.reduce((s, i) => s + i.totalOrders, 0)
  const sumY = filtered.reduce((s, i) => s + i.adSpend, 0)
  const sumXY = filtered.reduce((s, i) => s + i.totalOrders * i.adSpend, 0)
  const sumX2 = filtered.reduce((s, i) => s + i.totalOrders ** 2, 0)
  const sumY2 = filtered.reduce((s, i) => s + i.adSpend ** 2, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))

  if (denominator === 0) {
    return { pearsonR: null, sampleSize: n, label: 'Нет вариации данных' }
  }

  const r = numerator / denominator

  return {
    pearsonR: Math.max(-1, Math.min(1, r)),
    sampleSize: n,
    label: interpretCorrelation(r).label,
  }
}

/** Unified correlation taxonomy (Story 170.6-FE): label AND badge tint bands both
 *  live HERE — PositionSpendChart's former local label ladder («Заметная»…) and its
 *  divergent 30/60 color bands are deleted; the chart consumes this function only. */
export interface CorrelationInterpretation {
  label: string
  /** Badge tint by |r| valence: <0.4 muted, 0.4–<0.8 warning, ≥0.8 error (status tokens). */
  badgeClassName: string
}

const BAND_MUTED = 'bg-muted text-muted-foreground border-border'
const BAND_WARNING = 'bg-status-warning/15 text-status-warning border-status-warning/30'
const BAND_ERROR = 'bg-status-error/15 text-status-error border-status-error/30'

export function interpretCorrelation(r: number): CorrelationInterpretation {
  const abs = Math.abs(r)
  if (abs < 0.2) return { label: 'Очень слабая корреляция', badgeClassName: BAND_MUTED }
  if (abs < 0.4) return { label: 'Слабая корреляция', badgeClassName: BAND_MUTED }
  if (abs < 0.6) return { label: 'Умеренная корреляция', badgeClassName: BAND_WARNING }
  if (abs < 0.8) return { label: 'Сильная корреляция', badgeClassName: BAND_WARNING }
  return { label: 'Очень сильная корреляция', badgeClassName: BAND_ERROR }
}

// ---------------------------------------------------------------------------
// 3. Cannibalization Risk Classification
// ---------------------------------------------------------------------------

export type CannibalizationRisk = 'high' | 'medium' | 'low'

export interface CannibalizationItem {
  nmId: number
  vendorCode: string | null
  organicContribution: number | null
  adSpend: number
  totalOrders: number
  risk: CannibalizationRisk
  /** Human-readable reason (Russian) */
  reason: string
}

const HIGH_ORGANIC_THRESHOLD = 70
const MEDIUM_ORGANIC_THRESHOLD = 40
const HIGH_SPEND_PERCENTILE = 0.75

/**
 * Classify products by cannibalization risk:
 *   - HIGH: organic contribution >70% AND ad spend in top quartile
 *   - MEDIUM: organic contribution >40% AND ad spend above median
 *   - LOW: everything else
 *
 * Requires items with channel='both' (present in both organic and ad results).
 */
export function classifyCannibalization(items: CrossReferenceItem[]): CannibalizationItem[] {
  const bothItems = items.filter(i => i.channel === 'both' && i.adSpend > 0)

  if (bothItems.length === 0) return []

  // Compute ad spend thresholds
  const sortedSpend = [...bothItems].sort((a, b) => a.adSpend - b.adSpend)
  const medianIdx = Math.floor(sortedSpend.length / 2)
  const p75Idx = Math.floor(sortedSpend.length * HIGH_SPEND_PERCENTILE)
  const spendP75 = sortedSpend[p75Idx]?.adSpend ?? 0
  const spendMedian = sortedSpend[medianIdx]?.adSpend ?? 0

  return bothItems.map(item => {
    const org = item.organicContribution ?? 0
    let risk: CannibalizationRisk
    let reason: string

    if (org > HIGH_ORGANIC_THRESHOLD && item.adSpend >= spendP75) {
      risk = 'high'
      reason = 'Высокая органика + топ-расходы — реклама может заменять органику'
    } else if (org > MEDIUM_ORGANIC_THRESHOLD && item.adSpend >= spendMedian) {
      risk = 'medium'
      reason = 'Значительная органика + заметные расходы — проверьте необходимость рекламы'
    } else {
      risk = 'low'
      reason = 'Реклама дополняет или расширяет охват'
    }

    return {
      nmId: item.nmId,
      vendorCode: item.vendorCode,
      organicContribution: item.organicContribution ?? null,
      adSpend: item.adSpend,
      totalOrders: item.totalOrders,
      risk,
      reason,
    }
  })
}
