'use client'

/**
 * BrandShareTooltip — extracted from BrandShareChart (Story 170.4) to keep the
 * Chart under the 200-line cap. Token canon: bg-popover / border-border /
 * text-popover-foreground + muted-foreground labels (168.10+ tooltip canon).
 */
import { BRAND_SHARE_COLORS, formatBrandShareTooltipDate } from './brand-share-chart-config'
import { formatPercentage } from '@/lib/utils'
import type { BrandShareReportPoint } from '@/types/brand-share'

export interface TooltipEntryLike {
  dataKey?: string | number
  value?: number | null
}

/** Render a metric value; percents → formatPercentage, rating → plain number, null → «—». */
export function formatBrandShareMetricValue(
  dataKey: string | number | undefined,
  value: number | null
): string {
  if (value == null || !Number.isFinite(value)) return '—'
  if (dataKey === 'brandRating') return value.toLocaleString('ru-RU')
  // pricePercent / qtyPercent already in 0–100 units → formatPercentage divides by 100.
  return formatPercentage(value)
}

export function BrandShareTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipEntryLike[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const first = payload[0] as { payload?: BrandShareReportPoint } | undefined
  const point = first?.payload ?? null
  return (
    <div
      className="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ maxWidth: 260 }}
    >
      <p className="mb-2 border-b border-border pb-2 text-sm font-semibold">
        {point ? formatBrandShareTooltipDate(point.applyDate) : ''}
      </p>
      <div className="space-y-1.5">
        {payload.map(entry => {
          const key = String(entry.dataKey ?? '')
          const color = BRAND_SHARE_COLORS[key as keyof typeof BRAND_SHARE_COLORS]
          if (!color) return null
          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {/* Swatch style stays inline; the VALUE is the chart token (170.1 canon). */}
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground">
                  {key === 'brandRating'
                    ? 'Рейтинг бренда'
                    : key === 'pricePercent'
                      ? 'Доля по цене'
                      : 'Доля по количеству'}
                </span>
              </span>
              <span className="font-medium tabular-nums">
                {formatBrandShareMetricValue(key, entry.value ?? null)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
