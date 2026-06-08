import { formatCurrency } from '@/lib/utils'
import type { ChartInputParams, ChartSegment } from './cost-breakdown-types'
import { CHART_COLORS, MIN_SEGMENT_WIDTH_PX } from './cost-breakdown-types'

// Re-export types and constants for backward compatibility
export type { ChartInputParams, ChartSegment } from './cost-breakdown-types'
export { CHART_COLORS, MIN_SEGMENT_WIDTH_PX } from './cost-breakdown-types'

/**
 * Format percentage with Russian locale (comma separator, 1 decimal)
 */
export function formatPctRu(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

/**
 * Build dynamic label for a segment using the user's input percentage
 * Fix #1: Labels reflect actual user inputs
 */
function buildLabel(baseName: string, inputPct: number): string {
  if (inputPct <= 0) return baseName
  return `${baseName} ${formatPctRu(inputPct)}%`
}

/**
 * Build sorted chart segments from API data + user inputs
 * Implements: #1 dynamic labels, #8 sort by size, #9 color fix
 */
export function buildChartSegments(
  breakdown: {
    commission_wb: number
    acquiring: number
    advertising: number
    vat: number
    margin: number
  },
  recommendedPrice: number,
  params: ChartInputParams
): ChartSegment[] {
  if (recommendedPrice <= 0) return []

  const toPct = (rub: number): number => (rub / recommendedPrice) * 100

  // Fixed-cost base = price minus all percentage segments and margin.
  const fixedRub =
    recommendedPrice -
    (breakdown.commission_wb +
      breakdown.acquiring +
      breakdown.advertising +
      breakdown.vat +
      breakdown.margin)

  // Cost segments (excluding margin)
  const costSegments: ChartSegment[] = [
    {
      key: 'fixed',
      label: 'Себестоимость, логистика, хранение',
      pct: toPct(fixedRub),
      rub: fixedRub > 0 ? fixedRub : 0,
      color: CHART_COLORS.fixed,
      isMargin: false,
      inputPct: 0,
    },
    {
      key: 'commission_wb',
      label: buildLabel('Комиссия WB', params.commissionPct),
      pct: toPct(breakdown.commission_wb),
      rub: breakdown.commission_wb || 0,
      color: CHART_COLORS.commission_wb,
      isMargin: false,
      inputPct: params.commissionPct,
    },
    {
      key: 'acquiring',
      label: buildLabel('Эквайринг', params.acquiringPct),
      pct: toPct(breakdown.acquiring),
      rub: breakdown.acquiring || 0,
      color: CHART_COLORS.acquiring,
      isMargin: false,
      inputPct: params.acquiringPct,
    },
    {
      key: 'advertising',
      label: `Реклама (ДРР ${formatPctRu(params.drrPct)}%)`,
      pct: toPct(breakdown.advertising),
      rub: breakdown.advertising || 0,
      color: CHART_COLORS.advertising,
      isMargin: false,
      inputPct: params.drrPct,
    },
    {
      key: 'vat',
      label: buildLabel('НДС', params.vatPct),
      pct: toPct(breakdown.vat),
      rub: breakdown.vat || 0,
      color: CHART_COLORS.vat,
      isMargin: false,
      inputPct: params.vatPct,
    },
  ]
    .filter(s => s.pct > 0)
    .sort((a, b) => b.pct - a.pct)

  // Margin is always last
  const marginPct = toPct(breakdown.margin)
  if (marginPct > 0) {
    costSegments.push({
      key: 'margin',
      label: 'Маржа',
      pct: marginPct,
      rub: breakdown.margin || 0,
      color: CHART_COLORS.margin,
      isMargin: true,
      inputPct: 0,
    })
  }

  return costSegments
}

/**
 * Build ARIA label describing all segments for screen readers (#3)
 */
export function buildAriaLabel(segments: ChartSegment[]): string {
  const parts = segments.map(s => `${s.label} ${formatPctRu(s.pct)}% (${formatCurrency(s.rub)})`)
  return `Структура цены: ${parts.join(', ')}`
}

/**
 * Calculate adjusted widths ensuring minimum visibility (#7)
 * Returns percentage widths that sum to 100% with min 24px equivalent
 */
export function calcSegmentWidths(segments: ChartSegment[], containerWidthPx: number): number[] {
  if (segments.length === 0 || containerWidthPx <= 0) return []

  const minPct = (MIN_SEGMENT_WIDTH_PX / containerWidthPx) * 100
  const rawPcts = segments.map(s => s.pct)
  const total = rawPcts.reduce((sum, p) => sum + p, 0)

  if (total <= 0) return rawPcts

  // Normalize to 100%
  const normalized = rawPcts.map(p => (p / total) * 100)

  // Find segments below minimum
  const belowMin = normalized.filter(p => p < minPct)
  if (belowMin.length === 0) return normalized

  // Boost small segments and proportionally shrink the rest
  const boosted = normalized.map(p => (p < minPct ? minPct : p))
  const boostedTotal = boosted.reduce((sum, p) => sum + p, 0)

  // Re-normalize to 100%
  return boosted.map(p => (p / boostedTotal) * 100)
}
