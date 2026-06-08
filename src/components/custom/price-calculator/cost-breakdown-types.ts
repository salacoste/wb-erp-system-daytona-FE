/**
 * Cost Breakdown Chart types and constants
 * Extracted from cost-breakdown-helpers.ts (file size compliance).
 */

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
  fixed: '#64748b', // slate — base cost (COGS + logistics + storage)
} as const

/** Minimum visual width in pixels for any non-zero segment (#7) */
export const MIN_SEGMENT_WIDTH_PX = 24
