/**
 * Brand-Share chart configuration — PR4b.
 * Colors, labels and formatting helpers for the brand-share line chart.
 *
 * brandRating lives on the RIGHT axis (reversed: lower is better); the two
 * share percents live on the LEFT axis (0–100 %). All series use
 * `connectNulls={false}` so low-volume days (null percent) produce visible
 * gaps rather than misleading interpolations.
 */

export const BRAND_SHARE_COLORS = {
  brandRating: '#7C3AED', // Purple — position/rating (lower is better)
  pricePercent: '#3B82F6', // Blue — share by price
  qtyPercent: '#22C55E', // Green — share by quantity
} as const

export type BrandShareMetricKey = keyof typeof BRAND_SHARE_COLORS

export const BRAND_SHARE_LABELS: Record<BrandShareMetricKey, string> = {
  brandRating: 'Рейтинг бренда',
  pricePercent: 'Доля по цене',
  qtyPercent: 'Доля по количеству',
}

/** Format an applyDate (`YYYY-MM-DD...`) as DD.MM for the x-axis. */
export function formatBrandShareAxisDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

/** Format an applyDate as a full RU date for the tooltip. */
export function formatBrandShareTooltipDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
