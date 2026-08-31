import { formatCurrency, formatPercentage } from '@/lib/unit-economics-utils'
import type { WaterfallChartDataPoint } from './waterfall-chart-utils'

interface UnitEconomicsWaterfallSummaryProps {
  title: string
  data: WaterfallChartDataPoint[]
}

/** Exact non-hover alternative for the interactive waterfall chart. */
export function UnitEconomicsWaterfallSummary({ title, data }: UnitEconomicsWaterfallSummaryProps) {
  return (
    <table className="sr-only" data-chart-summary>
      <caption>Структура затрат: {title}</caption>
      <thead>
        <tr>
          <th scope="col">Категория</th>
          <th scope="col">Доля от выручки</th>
          <th scope="col">Сумма</th>
        </tr>
      </thead>
      <tbody>
        {data.map(point => (
          <tr key={point.name}>
            <th scope="row">{point.name}</th>
            <td>{formatPercentage(point.percentage)}</td>
            <td>{formatCurrency(point.absoluteValue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
