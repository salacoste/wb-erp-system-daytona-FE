/**
 * Defensive Frontend Principle (#191): warning affordance next to an impossible
 * funnel conversion value. AlertTriangle (not Info) — a >100% conversion is a
 * genuine backend defect, mirroring the orders price-inversion #165 pattern.
 * Shared by FunnelSummaryCards (summary card) and funnel-table-columns (per-SKU).
 * The raw value is always rendered by the caller; this only flags it.
 */
'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { FUNNEL_CONVERSION_ANOMALY_MESSAGE } from './funnel-anomaly'

export function FunnelAnomalyIndicator() {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="inline-flex h-11 w-11 shrink-0 cursor-help text-status-warning hover:text-status-warning"
            aria-label={FUNNEL_CONVERSION_ANOMALY_MESSAGE}
            onClick={() => setOpen(current => !current)}
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{FUNNEL_CONVERSION_ANOMALY_MESSAGE}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
