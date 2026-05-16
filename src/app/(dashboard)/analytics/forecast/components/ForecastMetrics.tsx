'use client'

import { getConfidenceBand } from '@/types/ai-forecast'
import type { AiForecastResponse } from '@/types/ai-forecast'
import { Card, CardContent } from '@/components/ui/card'

export function ForecastMetrics({ data }: { data: AiForecastResponse }) {
  const confidenceValues = data.predictions.filter(p => p.confidence != null)
  const avgConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((s, p) => s + (p.confidence ?? 0), 0) / confidenceValues.length
      : 0

  const metrics = [
    { label: 'Движок', value: data.engine, sub: `v${data.modelVersion}` },
    { label: 'Прогнозов', value: String(data.predictions.length), sub: 'точек данных' },
    {
      label: 'Кэш',
      value: data.cached ? 'Да' : 'Нет',
      sub: data.cached ? 'из кэша' : 'свежий',
    },
    {
      label: 'Средняя уверенность',
      value: `${(avgConfidence * 100).toFixed(0)}%`,
      sub: getConfidenceBand(avgConfidence),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {metrics.map(m => (
        <Card key={m.label}>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-semibold">{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
