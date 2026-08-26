/**
 * ForecastChartSrTable — sr-only data alternative for the forecast chart.
 *
 * Story 171.4 (169.11/169.12 canon): screen-reader table exposing every date
 * with AI/naive values at tooltip precision (numeric formatting matches
 * ForecastChartTooltip; nulls render «нет данных» here vs tooltip «—» — sr-row
 * convention, disclosed r1-L2) plus the band range. Null values render
 * «нет данных» (AP#8: real nulls, never fabricated 0s). Extracted into its own
 * file to keep ForecastChart.tsx under the 200-line cap.
 */
import { formatDate } from '@/lib/utils'
import { formatBandRange, type ForecastChartRow } from './forecast-chart-helpers'

export function ForecastChartSrTable({ rows }: { rows: ForecastChartRow[] }) {
  if (rows.length === 0) return null
  return (
    <table className="sr-only">
      <caption>
        Данные графика прогноза продаж по дням. Прогноз AI и базовая оценка — единиц/день, округлены
        до целых; диапазон — нижняя–верхняя граница доверительного интервала. Дни без данных
        отмечены как «нет данных».
      </caption>
      <thead>
        <tr>
          <th scope="col">Дата</th>
          <th scope="col">Прогноз (AI)</th>
          <th scope="col">Базовая оценка</th>
          <th scope="col">Диапазон</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.date}>
            <th scope="row">{formatDate(row.date)}</th>
            <td>{row.predictedSales != null ? Math.round(row.predictedSales) : 'нет данных'}</td>
            <td>{row.naiveBaseline != null ? Math.round(row.naiveBaseline) : 'нет данных'}</td>
            <td>{formatBandRange(row.bandLower, row.bandUpper)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
