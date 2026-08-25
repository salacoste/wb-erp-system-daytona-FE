/**
 * DailyTrendSrTable — sr-only data alternative for the advertising daily trend.
 *
 * Story 170.1 (169.11 ReturnTrendSrTable canon): screen-reader table exposing
 * every day and every visible-default series value at tooltip precision
 * (formatCurrency for spend, ru-RU counts, x for ROAS) with units, so the chart
 * has a non-hover equivalent. ROAS column included only when toggled visible —
 * matches DEFAULT_DAILY_VISIBLE hiding roas by default (Story 72.3 contract).
 */

import { formatCurrency } from '@/lib/utils'
import {
  DAILY_TREND_LABELS,
  DAILY_TREND_SERIES,
  type DailyTrendMetricKey,
} from './daily-trend-config'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

function formatSrValue(key: DailyTrendMetricKey, value: number | null): string {
  if (value == null) return '—'
  if (key === 'roas') return `${value.toFixed(2)}x`
  if (key === 'spend') return formatCurrency(value)
  return value.toLocaleString('ru-RU')
}

export function DailyTrendSrTable({
  data,
  visibleSeries,
}: {
  data: AdvertisingDailyItem[]
  visibleSeries: string[]
}) {
  if (data.length === 0) return null
  const series = DAILY_TREND_SERIES.filter(s => visibleSeries.includes(s.key))
  return (
    <table className="sr-only">
      <caption>
        Данные рекламной динамики по дням. Расходы — рубли; показы, клики и заказы — штуки; ROAS —
        множитель (x).
      </caption>
      <thead>
        <tr>
          <th scope="col">Дата</th>
          {series.map(s => (
            <th key={s.key} scope="col">
              {DAILY_TREND_LABELS[s.key]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.date}>
            <th scope="row">{item.date}</th>
            {series.map(s => (
              <td key={s.key}>
                {formatSrValue(s.key, item[s.key as keyof AdvertisingDailyItem] as number | null)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
