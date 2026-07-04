'use client'

/**
 * Transient «себестоимость обновлена» badge (M5 — COGS-recalc visibility).
 * Contract: docs/epics/epic-moysklad-order-management.md (story M5).
 *
 * Informational: signals that the row was linked this session and we expect the
 * backend COGS-recalc to apply the МС buy price on the next sync. The actual
 * recalc is backend-side; this badge only says "we linked → expect updated COGS".
 * Shown for recently-linked rows that carry a buy price; cleared on next sync.
 */

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Amber badge + tooltip. Rendered only by the row when the mapping id is in the
 * table's `recentlyLinked` set AND `buyPriceRub != null` (AC #2/#3).
 */
export function CogsRecalcBadge() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="border-yellow-400 bg-yellow-100 text-yellow-800 whitespace-nowrap"
          >
            себестоимость обновлена
          </Badge>
        </TooltipTrigger>
        <TooltipContent size="md">
          Цена закупки из МойСклад → себестоимость; маржа пересчитается
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
