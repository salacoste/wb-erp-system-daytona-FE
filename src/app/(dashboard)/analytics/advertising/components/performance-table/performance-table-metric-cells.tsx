/** ROI and Organic Contribution cell renderers — extracted for 200-line limit */

'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { AdvertisingItem } from '@/types/advertising-analytics'
import { formatCurrency, formatPercent, formatPercentRaw } from './performance-table-formatters'

// ============================================================================
// ROI with formula tooltip
// ============================================================================

export function renderROI(item: AdvertisingItem) {
  // Handle unknown status
  if (item.efficiency_status === 'unknown') {
    return <span className="text-muted-foreground">—</span>
  }

  if (item.roi === undefined || item.roi === null) {
    return <span className="text-muted-foreground">—</span>
  }

  const isNegative = item.roi < 0

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'cursor-help underline decoration-dotted underline-offset-4',
              isNegative && 'text-destructive font-medium'
            )}
          >
            {formatPercent(item.roi)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">Return on Investment (ROI)</p>
            <p className="text-muted-foreground">
              Формула: (Прибыль - Расход на рекламу) / Расход на рекламу
            </p>
            <p className="mt-1">
              ({formatCurrency(item.profit || 0)} - {formatCurrency(item.spend || 0)}) /{' '}
              {formatCurrency(item.spend || 0)} = {formatPercent(item.roi)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// Organic Contribution % with formula tooltip
// ============================================================================

export function renderOrganicContribution(item: AdvertisingItem) {
  if (item.organic_contribution === undefined || item.organic_contribution === null) {
    return <span className="text-muted-foreground">—</span>
  }

  // WB re-attribution can drive organic contribution <0% — a real value, not no-data.
  // Indicate it in red (mirroring renderROI above) instead of masking it as "—"
  // (Defensive Frontend: indicate, don't hide; consistent with AdvertisingSummaryCards).
  const isNegative = item.organic_contribution < 0

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'cursor-help underline decoration-dotted underline-offset-4',
              isNegative && 'text-destructive font-medium'
            )}
          >
            {formatPercentRaw(item.organic_contribution)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">Вклад органики</p>
            <p className="text-muted-foreground">Формула: Органика / Общая выручка x 100%</p>
            <p className="mt-1">
              {formatCurrency(item.organic_sales || 0)} / {formatCurrency(item.total_sales || 0)} ={' '}
              {formatPercentRaw(item.organic_contribution)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
