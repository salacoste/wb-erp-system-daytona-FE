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

const BAND_STYLES: Record<string, string> = {
  high: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-red-600 bg-red-50',
}

const BAND_LABELS: Record<string, string> = {
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
}

/**
 * Returns Tailwind color class for aiVsNaive delta string.
 * Exported for direct unit testing (pure-function discipline, Epic 89-FE lesson).
 * '+...' → green-600, '-...' → red-600, null/other → muted-foreground.
 */
export function getAiVsNaiveColor(
  value: string | null
): 'text-green-600' | 'text-red-600' | 'text-muted-foreground' {
  if (value === null) return 'text-muted-foreground'
  if (value.startsWith('+')) return 'text-green-600'
  if (value.startsWith('-')) return 'text-red-600'
  return 'text-muted-foreground'
}

interface ForecastTableProps {
  predictions: AiForecastPrediction[]
  /** Optional — when provided, feedback submission invalidates model cache (AC 6) */
  modelId?: string
}

export function ForecastTable({ predictions, modelId }: ForecastTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
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
                <td className="py-2 text-right font-mono">
                  {p.predictedSales != null ? formatDecimal(p.predictedSales) : '—'}
                </td>
                {/* iter-78: naiveBaseline is UNITS, not currency — the backend assigns it
                    directly to predictedUnits (ai-forecast.service.ts:109) and groups it with
                    the units columns in CSV export. Render as units (matching "Прогноз продаж"),
                    NOT formatCurrency (was "0,99 ₽" for a 0.99-units/day baseline). */}
                <td className="py-2 text-right font-mono">
                  {p.naiveBaseline != null ? formatDecimal(p.naiveBaseline) : '—'}
                </td>
                <td className={`py-2 text-right font-mono ${aiVsNaiveColor}`}>
                  {p.aiVsNaive ?? '—'}
                </td>
                <td className="py-2 text-right font-mono">
                  {p.predictedRevenue != null ? formatCurrency(p.predictedRevenue) : '—'}
                </td>
                <td className="py-2 text-right font-mono">
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
