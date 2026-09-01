/** Column cell renderers for PerformanceMetricsTable — extracted for 200-line limit */

'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { AdvertisingItem } from '@/types/advertising-analytics'
import { truncateText } from './performance-table-formatters'

// Re-export for backward compatibility
export {
  renderOrganicSales,
  renderTotalSales,
  renderROAS,
} from './performance-table-tooltip-renderers'

// Generic value renderer with unknown status handling (AC7)

export function renderValue(
  item: AdvertisingItem,
  field: keyof AdvertisingItem,
  formatter: (v: number) => string
) {
  // For unknown status, show dash for profit-related fields
  if (item.efficiency_status === 'unknown') {
    if (field === 'profit' || field === 'roas' || field === 'roi' || field === 'profit_after_ads') {
      return <span className="text-muted-foreground">—</span>
    }
  }

  const value = item[field]
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>
  }

  const numValue = Number(value)
  const isNegative = numValue < 0

  return (
    <span className={cn(isNegative && 'text-destructive font-medium')}>{formatter(numValue)}</span>
  )
}

// ============================================================================
// Name cell with truncation + tooltip
// ============================================================================

export function renderName(item: AdvertisingItem, viewBy: string) {
  const name = viewBy === 'sku' ? item.product_name : undefined
  if (!name) return null

  if (name.length > 45) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">{truncateText(name, 45)}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  return name
}
