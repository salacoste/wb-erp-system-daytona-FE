import { formatMarginPercent } from '@/components/custom/MarginDisplay'
import { formatCurrency } from '@/lib/utils'
import type { MarginTrendPoint } from '@/types/api'

export const MARGIN_TREND_DATA_TABLE_ID = 'margin-trend-chart-data'

function formatNullableCurrency(value: number | null): string {
  return value === null ? '—' : formatCurrency(value)
}

export function MarginTrendDataTable({ data }: { data: MarginTrendPoint[] }) {
  const firstWeek = data[0]?.week ?? '—'
  const lastWeek = data.at(-1)?.week ?? '—'

  return (
    <table id={MARGIN_TREND_DATA_TABLE_ID} className="sr-only" data-chart-summary>
      <caption>{`Данные графика маржинальности по неделям; период: ${firstWeek} — ${lastWeek}; единицы: маржа — проценты, финансовые показатели — рубли, продажи и SKU — штуки`}</caption>
      <thead>
        <tr>
          <th scope="col">Неделя</th>
          <th scope="col">Маржа, %</th>
          <th scope="col">Выручка, ₽</th>
          <th scope="col">COGS, ₽</th>
          <th scope="col">Прибыль, ₽</th>
          <th scope="col">Продажи, шт.</th>
          <th scope="col">SKU, шт.</th>
          <th scope="col">SKU без COGS, шт.</th>
        </tr>
      </thead>
      <tbody>
        {data.map(point => (
          <tr key={point.week}>
            <th scope="row">{point.week}</th>
            <td>{point.margin_pct === null ? '—' : formatMarginPercent(point.margin_pct)}</td>
            <td>{formatCurrency(point.revenue_net)}</td>
            <td>{formatNullableCurrency(point.cogs)}</td>
            <td>{formatNullableCurrency(point.profit)}</td>
            <td>{point.qty.toLocaleString('ru-RU')}</td>
            <td>{point.sku_count.toLocaleString('ru-RU')}</td>
            <td>{point.missing_cogs_count.toLocaleString('ru-RU')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
