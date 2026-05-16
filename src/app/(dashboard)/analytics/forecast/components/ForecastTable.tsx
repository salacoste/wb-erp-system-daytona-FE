'use client'

import { getConfidenceBand } from '@/types/ai-forecast'
import { formatDate } from '@/lib/utils'

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

interface Prediction {
  date: string
  predictedSales: number
  /** null when backend omits — rendered as em-dash */
  confidence: number | null
}

export function ForecastTable({ predictions }: { predictions: Prediction[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left font-medium">Дата</th>
            <th className="py-2 text-right font-medium">Прогноз продаж</th>
            <th className="py-2 text-right font-medium">Уверенность</th>
            <th className="py-2 text-center font-medium">Диапазон</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map(p => {
            const band = p.confidence != null ? getConfidenceBand(p.confidence) : 'low'
            return (
              <tr key={p.date} className="border-b last:border-0">
                <td className="py-2">{formatDate(p.date)}</td>
                <td className="py-2 text-right font-mono">{p.predictedSales.toFixed(1)}</td>
                <td className="py-2 text-right font-mono">
                  {p.confidence != null ? `${(p.confidence * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="py-2 text-center">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BAND_STYLES[band]}`}
                  >
                    {BAND_LABELS[band]}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
