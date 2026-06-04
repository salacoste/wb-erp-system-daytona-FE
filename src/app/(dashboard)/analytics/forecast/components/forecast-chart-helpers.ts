/**
 * Forecast chart helpers — pure functions extracted from ForecastChart.tsx.
 * Story 109.2-FE: confidence band formula + chart data transformer.
 * Extracted proactively to keep ForecastChart.tsx ≤150 lines (200-line ESLint cap).
 */
import { type AiForecastPrediction } from '@/types/ai-forecast'
import { formatDate, formatPercentageInt } from '@/lib/utils'

/**
 * Computes the lower/upper bounds of the confidence band for a single forecast row.
 *
 * LOCKED formula (Epic 109-FE spec § Risks/Open Questions Q2):
 *   spread = max(0.10, 1 − confidence) × predictedUnits
 * The 0.10 floor prevents band from visually collapsing on confidence ≥ 0.9 days.
 *
 * Edge cases:
 * - confidence === null → treat as 0 (low confidence) → spread = 1 × predictedUnits
 * - predictedUnits === null → no units series (revenue-target model, Epic 113 I1) → no band
 * - predictedUnits === 0 → both bounds = 0
 * - negative predictedUnits → degenerate flat band (lower = upper = predictedUnits)
 */
export function getForecastBand(
  predictedUnits: number | null,
  confidence: number | null
): { lower: number | null; upper: number | null } {
  // Epic 113 I1: revenue-target models send predictedUnits:null → no units band.
  // Emit null bounds so the recharts Area series skips the point (no NaN, no flat 0 band).
  if (predictedUnits === null) {
    return { lower: null, upper: null }
  }
  // Negative predictedUnits → degenerate flat band (not expected from backend)
  if (predictedUnits < 0) {
    return { lower: predictedUnits, upper: predictedUnits }
  }
  // Zero → no visible band
  if (predictedUnits === 0) {
    return { lower: 0, upper: 0 }
  }

  // SEMANTIC-ZERO (CLAUDE-PATTERNS.md § AP#8 Exceptions): null confidence
  // → treat as worst-case low-confidence to produce a wide band per AC-2.
  const conf = confidence ?? 0
  const spread = Math.max(0.1, 1 - conf) * predictedUnits
  const lower = Math.max(0, predictedUnits - spread)
  const upper = predictedUnits + spread

  return { lower, upper }
}

/** Chart row shape consumed by recharts ComposedChart */
export interface ForecastChartRow {
  date: string
  /** Formatted date label for x-axis (DD.MM) */
  dateLabel: string
  /** null for revenue-target models (Epic 113 I1) → recharts skips the units Line point */
  predictedSales: number | null
  naiveBaseline: number | null
  confidence: number | null
  /** null when predictedSales is null (no units band) */
  bandLower: number | null
  bandUpper: number | null
}

/**
 * Transforms AiForecastPrediction[] into recharts-ready chart rows.
 * Computes bandLower/bandUpper via getForecastBand for each row.
 * Rounds predictedSales + naiveBaseline at the boundary so chart Line series
 * and tooltip render byte-identical values (F-3 fix — was visual mismatch
 * when backend sent fractional values).
 */
export function transformPredictionsForChart(
  predictions: AiForecastPrediction[]
): ForecastChartRow[] {
  return predictions.map(p => {
    const { lower, upper } = getForecastBand(p.predictedSales, p.confidence)
    // formatDate returns DD.MM.YYYY — take first 5 chars for DD.MM x-axis label
    const dateLabel = formatDate(p.date).slice(0, 5)
    return {
      date: p.date,
      dateLabel,
      // Epic 113 I1: null predictedSales (revenue-target model) stays null →
      // recharts Line skips the point instead of plotting NaN/Math.round(null)=0.
      predictedSales: p.predictedSales !== null ? Math.round(p.predictedSales) : null,
      naiveBaseline: p.naiveBaseline !== null ? Math.round(p.naiveBaseline) : null,
      confidence: p.confidence,
      bandLower: lower,
      bandUpper: upper,
    }
  })
}

/** Formats confidence (0-1 scale) as "85 %" (ru-RU, NBSP) or "—" for null. Visible tooltip text
 *  in ForecastChart — was dot-locale `${Math.round(value * 100)}%` (a gate-blind site: the
 *  locale-percent gate only matches the toFixed form, not Math.round). */
export function formatConfidence(value: number | null): string {
  if (value === null) return '—'
  return formatPercentageInt(value * 100)
}

/**
 * Formats a band range as "lower–upper" with en-dash (U+2013).
 * Epic 113 I1: null bounds (revenue-target model, no units band) render '—'.
 */
export function formatBandRange(lower: number | null, upper: number | null): string {
  if (lower === null || upper === null) return '—'
  return `${Math.round(lower)}–${Math.round(upper)}`
}
