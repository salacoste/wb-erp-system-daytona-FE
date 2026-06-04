'use client'

/**
 * Profitability Badge Component
 * Extracted from SkuFinancialsTable.tsx
 * Displays operating margin as a color-coded badge with tooltip
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn, formatPercentage } from '@/lib/utils'
import type { ProfitabilityStatus } from '@/types/sku-financials'
import { getProfitabilityBadgeClass, getProfitabilityLabel } from '@/types/sku-financials'

interface ProfitabilityBadgeProps {
  status: ProfitabilityStatus
  marginPct: number | null
}

export function ProfitabilityBadge({ status, marginPct }: ProfitabilityBadgeProps) {
  const colorClass = getProfitabilityBadgeClass(status)
  const label = getProfitabilityLabel(status)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn('cursor-help', colorClass)}>
            {marginPct !== null ? formatPercentage(marginPct, 1) : label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{label}</p>
          {marginPct !== null && (
            <p className="text-xs text-gray-400">
              Операционная маржа: {formatPercentage(marginPct, 2)}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
