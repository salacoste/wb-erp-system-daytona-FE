'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Warehouse Badges with overflow indicator
 * Story 24.3-FE: Storage by SKU Table
 * UX Decision Q6: Badges with +N overflow for visual scannability
 */
interface WarehouseBadgesProps {
  warehouses: string[]
  maxVisible?: number
}

export function WarehouseBadges({ warehouses, maxVisible = 2 }: WarehouseBadgesProps) {
  if (!warehouses || warehouses.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const visible = warehouses.slice(0, maxVisible)
  const overflow = warehouses.length - maxVisible

  return (
    <div className="flex gap-1 flex-wrap">
      {visible.map((warehouse) => (
        <Badge key={warehouse} variant="outline" className="text-xs font-normal">
          {warehouse}
        </Badge>
      ))}
      {overflow > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs cursor-help">
                +{overflow}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[200px]">{warehouses.slice(maxVisible).join(', ')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
