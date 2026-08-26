'use client'

/**
 * ForecastTable — renders prediction rows with enriched columns.
 * Story 109.1-FE: added naiveBaseline, aiVsNaive, predictedRevenue columns.
 * Story 110.4-FE: added Оценка column with FeedbackButtons (forecastId optional per AC 6).
 * Column order: Дата → Прогноз продаж → Базовая оценка → AI vs базовая → Прогноз выручки → Уверенность → Диапазон → Оценка
 */
import { getConfidenceBand, type AiForecastPrediction } from '@/types/ai-forecast'
import { formatDate, formatCurrency, formatPercentageInt, formatDecimal } from '@/lib/utils'
import { FeedbackButtons } from '@/components/custom/ai/FeedbackButtons'

// Story 171.4: status token pairs (text + /15 bg, 169.5 canon); labels below
// are preserved verbatim (non-color markers distinguish tiers).
const BAND_STYLES: Record<string, string> = {
  high: 'text-status-success bg-status-success/15',
  medium: 'text-status-warning bg-status-warning/15',
  low: 'text-status-error bg-status-error/15',
}

const BAND_LABELS: Record<string, string> = {
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
}

/**
 * Returns Tailwind color class for aiVsNaive delta string.
 * Exported for direct unit testing (pure-function discipline, Epic 89-FE lesson).
 * Story 171.4: financial valence tokens (169.4 canon).
 * '+...' → financial-positive, '-...' → financial-negative, null/other → muted-foreground.
 */
export function getAiVsNaiveColor(
  value: string | null
): 'text-financial-positive' | 'text-financial-negative' | 'text-muted-foreground' {
  if (value === null) return 'text-muted-foreground'
  if (value.startsWith('+')) return 'text-financial-positive'
  if (value.startsWith('-')) return 'text-financial-negative'
  return 'text-muted-foreground'
}

interface ForecastTableProps {
  predictions: AiForecastPrediction[]
  /** Optional — when provided, feedback submission invalidates model cache (AC 6) */
  modelId?: string
}

export function ForecastTable({ predictions, modelId }: ForecastTableProps) {
  return (
    // Story 171.4: keyboard-reachable scroll region + static caption (169.11/169.12 canon)
    <div
      className="overflow-x-auto rounded-lg border"
      tabIndex={0}
      role="region"
      aria-label="Таблица прогноза продаж"
    >
      <table className="w-full text-sm">
        <caption className="mt-3 text-xs text-muted-foreground">Прогноз продаж</caption>
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left font-medium">Дата</th>
            <th className="py-2 text-right font-medium">Прогноз продаж</th>
            <th className="py-2 text-right font-medium">Базовая оценка</th>
            <th className="py-2 text-right font-medium">AI vs базовая</th>
            <th className="py-2 text-right font-medium">Прогноз выручки</th>
            <th className="py-2 text-right font-medium">Уверенность</th>
            <th className="py-2 text-center font-medium">Диапазон</th>
            <th className="py-2 text-center font-medium">Оценка</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map(p => {
            const band = p.confidence != null ? getConfidenceBand(p.confidence) : 'low'
            const aiVsNaiveColor = getAiVsNaiveColor(p.aiVsNaive)
            return (
              <tr key={p.date} className="border-b last:border-0">
                <td className="py-2">{formatDate(p.date)}</td>
                {/* Epic 113 I1: predictedSales is null for revenue-target models
                    (daily_revenue_forecast) — null-guard to render '—', NOT crash on .toFixed. */}
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.predictedSales != null ? formatDecimal(p.predictedSales) : '—'}
                </td>
                {/* iter-78: naiveBaseline is UNITS, not currency — the backend assigns it
                    directly to predictedUnits (ai-forecast.service.ts:109) and groups it with
                    the units columns in CSV export. Render as units (matching "Прогноз продаж"),
                    NOT formatCurrency (was "0,99 ₽" for a 0.99-units/day baseline). */}
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.naiveBaseline != null ? formatDecimal(p.naiveBaseline) : '—'}
                </td>
                <td className={`py-2 text-right font-mono tabular-nums ${aiVsNaiveColor}`}>
                  {p.aiVsNaive ?? '—'}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.predictedRevenue != null ? formatCurrency(p.predictedRevenue) : '—'}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {p.confidence != null ? formatPercentageInt(p.confidence * 100) : '—'}
                </td>
                <td className="py-2 text-center">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BAND_STYLES[band]}`}
                  >
                    {BAND_LABELS[band]}
                  </span>
                </td>
                <td className="py-2 text-center">
                  {p.forecastId ? (
                    <FeedbackButtons forecastId={p.forecastId} modelId={modelId} />
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
