/**
 * StorageTrendSrTable — sr-only data alternative for the storage trends chart.
 *
 * Story 169.12 (169.11 ReturnTrendSrTable precedent): screen-reader table
 * exposing every week and its storage cost at tooltip precision
 * (formatCurrency), with explicit «нет данных» for gap weeks (UX Q12: gaps are
 * real nulls, connectNulls=false — preserved verbatim here). Heading/caption
 * text is name-distinct from the sr-only h2 «Детализация по хранению» in
 * StoragePageTableSection (no duplicate landmark text).
 */

import { formatCurrency } from './storage-format'
import type { StorageTrendPoint } from '@/types/storage-analytics'

export function StorageTrendSrTable({ data }: { data: StorageTrendPoint[] }) {
  if (data.length === 0) return null
  return (
    <table className="sr-only">
      <caption>
        Данные о расходах на платное хранение по неделям. Расходы — рубли; недели без начислений
        отмечены как «нет данных».
      </caption>
      <thead>
        <tr>
          <th scope="col">Неделя</th>
          <th scope="col">Расходы на хранение, ₽</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.week}>
            <th scope="row">{item.week}</th>
            <td>
              {item.storage_cost === null || item.storage_cost === undefined
                ? 'нет данных'
                : formatCurrency(item.storage_cost)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
