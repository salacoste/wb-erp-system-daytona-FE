import { formatCurrency } from '@/lib/utils'
import type { StorageTrendPoint } from '@/types/storage-analytics'

export const DASHBOARD_STORAGE_TREND_TABLE_ID = 'dashboard-storage-trend-data-table'

export function DashboardStorageTrendDataTable({ data }: { data: StorageTrendPoint[] }) {
  return (
    <table id={DASHBOARD_STORAGE_TREND_TABLE_ID} className="sr-only" data-chart-summary>
      <caption>Данные графика расходов на хранение на главной странице</caption>
      <thead>
        <tr>
          <th scope="col">Неделя</th>
          <th scope="col">Расходы на хранение, ₽</th>
        </tr>
      </thead>
      <tbody>
        {data.map(point => (
          <tr key={point.week}>
            <th scope="row">{point.week}</th>
            <td>
              {point.storage_cost === null || point.storage_cost === undefined
                ? 'нет данных'
                : formatCurrency(point.storage_cost)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
