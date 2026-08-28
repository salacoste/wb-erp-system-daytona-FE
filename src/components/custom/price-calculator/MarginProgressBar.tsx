'use client'

import { cn } from '@/lib/utils'

/**
 * Visual progress bar for margin percentage
 * Extracted from MarginSection for file-size compliance
 */

/** Get progress bar fill color class based on margin percentage */
function getBarColorClass(pct: number): string {
  if (pct >= 20) return 'bg-financial-positive'
  if (pct >= 10) return 'bg-status-success'
  if (pct >= 5) return 'bg-status-warning'
  return 'bg-status-error'
}

export function MarginProgressBar({ marginPct }: { marginPct: number }) {
  return (
    <div className="space-y-1.5">
      <div className="relative h-3">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
          {/* Colored fill. The aria-label below intentionally keeps the dot-locale
              `${marginPct}%` form — spoken text is a Russian-locale exception (a comma
              decimal can confuse screen-reader number parsing; consolidation-proposal §4).
              The VISIBLE badge above uses formatPercentage. CSS width% is not locale text. */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              getBarColorClass(marginPct)
            )}
            style={{ width: `${Math.min((marginPct / 30) * 100, 100)}%` }}
            role="progressbar"
            aria-valuenow={marginPct}
            aria-valuemin={0}
            aria-valuemax={30}
            aria-label={`Маржа ${marginPct}%`}
          />
        </div>
        {/* Threshold markers at 10% and 20% */}
        <div
          className="absolute top-0 h-full w-px bg-muted-foreground/30"
          style={{ left: '33.3%' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 h-full w-px bg-muted-foreground/30"
          style={{ left: '66.6%' }}
          aria-hidden="true"
        />
      </div>
      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span className="text-status-warning">10%</span>
        <span className="text-financial-positive">20%</span>
        <span>30%+</span>
      </div>
    </div>
  )
}
