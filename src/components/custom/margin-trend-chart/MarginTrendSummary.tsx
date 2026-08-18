'use client'

import { formatMarginPercent } from '@/components/custom/MarginDisplay'

interface MarginTrendSummaryProps {
  weeksCount: number
  hasMarginData: boolean
  marginValues: number[]
  maxMargin: number
  minMargin: number
}

/**
 * Summary statistics displayed below the chart
 * Shows: weeks count, average margin, max margin, min margin
 */
export function MarginTrendSummary({
  weeksCount,
  hasMarginData,
  marginValues,
  maxMargin,
  minMargin,
}: MarginTrendSummaryProps) {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-muted-foreground">Недель</p>
        <p className="font-semibold">{weeksCount}</p>
      </div>
      {hasMarginData && (
        <>
          <div>
            <p className="text-muted-foreground">Средняя маржа</p>
            <p className="font-semibold">
              {formatMarginPercent(marginValues.reduce((a, b) => a + b, 0) / marginValues.length)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Макс. маржа</p>
            <p className="font-semibold text-financial-positive">
              {formatMarginPercent(maxMargin)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Мин. маржа</p>
            <p className="font-semibold text-financial-negative">
              {formatMarginPercent(minMargin)}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
