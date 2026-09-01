import { formatNumber, formatPercentage } from '@/lib/formatters'
import type { DailyBuyoutPoint } from '@/types/buyout-daily'

import { BUYOUT_TREND_SERIES, type BuyoutTrendMetricKey } from './buyout-daily-trend-config'

export const BUYOUT_TREND_DATA_TABLE_ID = 'buyout-trend-chart-data'

function formatMetric(point: DailyBuyoutPoint, key: BuyoutTrendMetricKey): string {
  const value = point[key]
  if (value === null) return '—'
  return key === 'ordersCount' ? formatNumber(value) : formatPercentage(value)
}

export function BuyoutTrendDataTable({
  daily,
  from,
  to,
  visibleSeries = BUYOUT_TREND_SERIES.map(series => series.key),
}: {
  daily: DailyBuyoutPoint[]
  from: string
  to: string
  visibleSeries?: string[]
}) {
  const series = BUYOUT_TREND_SERIES.filter(item => visibleSeries.includes(item.key))

  return (
    <table id={BUYOUT_TREND_DATA_TABLE_ID} className="sr-only" data-chart-summary>
      <caption>{`Данные графика ежедневной динамики выкупа; период: ${from} — ${to}; единицы: выкуп и возвраты — проценты, заказы — штуки`}</caption>
      <thead>
        <tr>
          <th scope="col">Дата</th>
          {series.map(item => (
            <th scope="col" key={item.key}>
              {item.label}, {item.key === 'ordersCount' ? 'шт.' : '%'}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {daily.map(point => (
          <tr key={point.date}>
            <th scope="row">{point.date}</th>
            {series.map(item => (
              <td key={item.key}>{formatMetric(point, item.key)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
