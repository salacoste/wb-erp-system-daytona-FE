/**
 * Defensive Frontend Principle (#191): warning affordance next to an impossible
 * funnel conversion value. AlertTriangle (not Info) — a >100% conversion is a
 * genuine backend defect, mirroring the orders price-inversion #165 pattern.
 * Shared by FunnelSummaryCards (summary card) and funnel-table-columns (per-SKU).
 * The raw value is always rendered by the caller; this only flags it.
 */
'use client'

import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FUNNEL_CONVERSION_ANOMALY_MESSAGE } from './funnel-anomaly'

export function FunnelAnomalyIndicator() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex cursor-help text-amber-600"
            aria-label={FUNNEL_CONVERSION_ANOMALY_MESSAGE}
          >
            <AlertTriangle className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{FUNNEL_CONVERSION_ANOMALY_MESSAGE}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
