/**
 * Brand-Share chart configuration — PR4b (Story 170.4 token migration).
 * Colors, labels and formatting helpers for the brand-share line chart.
 *
 * brandRating lives on the RIGHT axis (reversed: lower is better); the two
 * share percents live on the LEFT axis (0–100 %). The share percents use
 * `connectNulls={false}` so low-volume days (null percent) produce visible
 * gaps rather than misleading interpolations; brandRating keeps
 * `connectNulls` (true) since a single missed day does not break the
 * position reading.
 */

// Story 170.1 canon: categorical series → chart-1/2/3 tokens (position-rank,
// not money-valence). The dashed stroke (Chart) additionally non-color
// distinguishes the rating series.
export const BRAND_SHARE_COLORS = {
  pricePercent: 'var(--color-chart-1)',
  qtyPercent: 'var(--color-chart-2)',
  brandRating: 'var(--color-chart-3)',
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
