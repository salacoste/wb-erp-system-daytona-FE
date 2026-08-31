import { formatCurrency } from '@/lib/utils'
import type { TrendDataPoint } from '@/types/liquidity'

/** Exact non-hover alternative for both liquidity trend charts. */
export function LiquidityTrendSummary({ data }: { data: TrendDataPoint[] }) {
  return (
    <table className="sr-only" data-chart-summary>
      <caption>Динамика ликвидности по дням</caption>
      <thead>
        <tr>
          <th scope="col">Дата</th>
          <th scope="col">Замороженный капитал</th>
          <th scope="col">Средний оборот, дней</th>
          <th scope="col">Высоколиквидные</th>
          <th scope="col">Средняя ликвидность</th>
          <th scope="col">Низкая ликвидность</th>
          <th scope="col">Неликвид</th>
        </tr>
      </thead>
      <tbody>
        {data.map(point => (
          <tr key={point.date}>
            <th scope="row">{point.date}</th>
            <td>{formatCurrency(point.frozen_capital)}</td>
            <td>{Math.round(point.avg_turnover_days)}</td>
            <td>{point.distribution.highly_liquid_pct}</td>
            <td>{point.distribution.medium_pct}</td>
            <td>{point.distribution.low_pct}</td>
            <td>{point.distribution.illiquid_pct}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
