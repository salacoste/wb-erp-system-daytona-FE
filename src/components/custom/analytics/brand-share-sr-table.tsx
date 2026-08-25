/**
 * BrandShareSrTable — sr-only data alternative for the brand-share chart.
 *
 * Story 170.4 (169.11-13 sr-table canon): screen-reader table exposing every
 * day × all 3 metrics at tooltip precision with named units, so the chart has
 * a non-hover equivalent. Nulls render «—» (AP#8), never 0.
 */
import { formatPercentage } from '@/lib/utils'
import type { BrandShareReportPoint } from '@/types/brand-share'

/** Rating is a position («место в рейтинге») — plain ru-RU number. */
function formatSrRating(value: number | null): string {
  return value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('ru-RU')
}

/** Percents already in 0–100 units → formatPercentage divides by 100. */
function formatSrPercent(value: number | null): string {
  return value == null || !Number.isFinite(value) ? '—' : formatPercentage(value)
}

export function BrandShareSrTable({ data }: { data: BrandShareReportPoint[] }) {
  if (data.length === 0) return null
  return (
    <table className="sr-only" data-testid="brand-share-sr-table">
      <caption>
        Данные доли бренда по дням. Доли по цене и количеству — % от категории; рейтинг бренда —
        место в рейтинге.
      </caption>
      <thead>
        <tr>
          <th scope="col">Дата</th>
          <th scope="col">Рейтинг бренда, место в рейтинге</th>
          <th scope="col">Доля по цене, % от категории</th>
          <th scope="col">Доля по количеству, % от категории</th>
        </tr>
      </thead>
      <tbody>
        {data.map(point => (
          <tr key={point.applyDate}>
            <th scope="row">{point.applyDate}</th>
            <td>{formatSrRating(point.brandRating)}</td>
            <td>{formatSrPercent(point.pricePercent)}</td>
            <td>{formatSrPercent(point.qtyPercent)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
