import { formatCurrency } from '@/lib/utils'

/**
 * Input parameters from the form for dynamic chart labels
 * Passed through PriceCalculatorResults -> CostBreakdownChart
 */
export interface ChartInputParams {
  /** Commission percentage from category selection */
  commissionPct: number
  /** Acquiring percentage (usually 1.5-2.5%) */
  acquiringPct: number
  /** Advertising/DRR percentage */
  drrPct: number
  /** VAT percentage (0 if not VAT payer) */
  vatPct: number
}

/** Single chart segment data */
export interface ChartSegment {
  /** Unique key for the segment */
  key: string
  /** Display label with input percentage */
  label: string
  /** Percentage of total price */
  pct: number
  /** Ruble amount */
  rub: number
  /** Segment color */
  color: string
  /** Whether this is the margin (always last) */
  isMargin: boolean
  /** Input percentage for tooltip */
  inputPct: number
}

/** Color palette for chart segments (fix #9: teal for acquiring instead of green) */
export const CHART_COLORS = {
  commission_wb: '#8b5cf6', // purple
  acquiring: '#3b82f6', // blue (was green, changed for color-blind safety)
  advertising: '#f97316', // orange
  vat: '#ef4444', // red
  margin: '#10b981', // emerald
} as const

/** Minimum visual width in pixels for any non-zero segment (#7) */
export const MIN_SEGMENT_WIDTH_PX = 24

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

  // Cost segments (excluding margin)
  const costSegments: ChartSegment[] = [
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
    // #8: Sort cost segments largest -> smallest
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
