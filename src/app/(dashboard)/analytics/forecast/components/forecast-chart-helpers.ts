/**
 * Forecast chart helpers — pure functions extracted from ForecastChart.tsx.
 * Story 109.2-FE: confidence band formula + chart data transformer.
 * Extracted proactively to keep ForecastChart.tsx ≤150 lines (200-line ESLint cap).
 */
import { type AiForecastPrediction } from '@/types/ai-forecast'
import { formatDate } from '@/lib/utils'

/**
 * Computes the lower/upper bounds of the confidence band for a single forecast row.
 *
 * LOCKED formula (Epic 109-FE spec § Risks/Open Questions Q2):
 *   spread = max(0.10, 1 − confidence) × predictedUnits
 * The 0.10 floor prevents band from visually collapsing on confidence ≥ 0.9 days.
 *
 * Edge cases:
 * - confidence === null → treat as 0 (low confidence) → spread = 1 × predictedUnits
 * - predictedUnits === 0 → both bounds = 0
 * - negative predictedUnits → degenerate flat band (lower = upper = predictedUnits)
 */
export function getForecastBand(
  predictedUnits: number,
  confidence: number | null
): { lower: number; upper: number } {
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
  predictedSales: number
  naiveBaseline: number | null
  confidence: number | null
  bandLower: number
  bandUpper: number
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
      predictedSales: Math.round(p.predictedSales),
      naiveBaseline: p.naiveBaseline !== null ? Math.round(p.naiveBaseline) : null,
      confidence: p.confidence,
      bandLower: lower,
      bandUpper: upper,
    }
  })
}

/** Formats confidence (0-1 scale) as "85%" or "—" for null */
export function formatConfidence(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

/** Formats a band range as "lower–upper" with em-dash (U+2013) */
export function formatBandRange(lower: number, upper: number): string {
  return `${Math.round(lower)}–${Math.round(upper)}`
}
