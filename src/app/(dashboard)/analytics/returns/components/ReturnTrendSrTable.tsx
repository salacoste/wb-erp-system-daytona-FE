/**
 * ReturnTrendSrTable — sr-only data alternative for the returns daily trend.
 *
 * Extracted from ReturnTrendChartTooltip.tsx in round-1 review (169.11 F5):
 * isolates the sr-table so ReturnTrendChart stays under the max-lines cap.
 *
 * Screen-reader table exposing every day and every series value at tooltip
 * precision (formatReturnCount for counts, formatPercentage for the rate),
 * with the exact period, units (шт / %), and non-color series labels.
 * Heading text intentionally does not duplicate the visible card title.
 *
 * DOM-cost decision (169.11, documented): no cap for ≤365-day ranges this
 * story; typical use is 30-90d. Revisit only if perf evidence demands.
 */

import {
  RETURNS_BAR_SERIES,
  RETURNS_DAILY_LABELS,
  formatReturnCount,
} from './returns-daily-trend-config'
import { formatPercentage } from '@/lib/utils'
import type { DailyReturnItem } from '@/types/returns-daily'

export function ReturnTrendSrTable({
  daily,
  period,
}: {
  daily: DailyReturnItem[]
  period: { from: string; to: string } | undefined
}) {
  if (daily.length === 0) return null
  const periodText = period ? `с ${period.from} по ${period.to}` : ''
  return (
    <table className="sr-only">
      <caption>
        Данные о возвратах по дням{periodText ? ` (${periodText})` : ''}. Отмены, отказы, брак и
        итого — штуки; доля возвратов — проценты.
      </caption>
      <thead>
        <tr>
          <th scope="col">Дата</th>
          {RETURNS_BAR_SERIES.map(s => (
            <th key={s.key} scope="col">
              {s.label}, шт
            </th>
          ))}
          <th scope="col">{RETURNS_DAILY_LABELS.totalReturns}, шт</th>
          <th scope="col">{RETURNS_DAILY_LABELS.returnRate}, %</th>
        </tr>
      </thead>
      <tbody>
        {daily.map(item => (
          <tr key={item.date}>
            <th scope="row">{item.date}</th>
            {RETURNS_BAR_SERIES.map(s => (
              <td key={s.key}>{formatReturnCount(item[s.key])}</td>
            ))}
            <td>{formatReturnCount(item.totalReturns)}</td>
            <td>{formatPercentage(item.returnRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
