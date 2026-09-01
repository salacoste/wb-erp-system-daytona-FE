import { formatCurrency } from '@/lib/liquidity-utils'
import { formatPercentage } from '@/lib/utils'

interface LiquidityDistributionSummaryRow {
  category: string
  name: string
  value: number
  count: number
  stockValue: number
}

/** Exact non-hover alternative for the liquidity distribution chart. */
export function LiquidityDistributionSummary({
  data,
}: {
  data: LiquidityDistributionSummaryRow[]
}) {
  return (
    <table className="sr-only" data-chart-summary>
      <caption>Распределение товаров по ликвидности</caption>
      <thead>
        <tr>
          <th scope="col">Категория</th>
          <th scope="col">Доля стоимости запасов</th>
          <th scope="col">SKU</th>
          <th scope="col">Стоимость запасов</th>
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.category}>
            <th scope="row">{row.name}</th>
            <td>{formatPercentage(row.value)}</td>
            <td>{row.count}</td>
            <td>{formatCurrency(row.stockValue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
