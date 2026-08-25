'use client'

/**
 * MultiCampaignWarningBadge Component
 * Story 72.4-FE: Advertising Profit Multiplication Warning
 *
 * Displays a ⚠️ badge on SKUs appearing in multiple campaigns.
 * Follows MergedProductBadge pattern (Badge + TooltipProvider).
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MultiCampaignWarningBadgeProps {
  campaigns: number[]
  message: string
}

export function MultiCampaignWarningBadge({ campaigns, message }: MultiCampaignWarningBadgeProps) {
  const campaignCount = campaigns.length

  if (campaignCount < 2) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Story 170.1: yellow palette → status-warning /15+/30 matched pair (169.5) */}
          <button
            type="button"
            className="ml-1 inline-flex cursor-help items-center rounded border border-status-warning/30 bg-status-warning/15 px-1 py-0.5 text-xs text-status-warning hover:bg-status-warning/25 focus:outline-none focus:ring-2 focus:ring-status-warning focus:ring-offset-1"
            aria-label={`Товар участвует в ${campaignCount} кампаниях — прибыль может быть завышена`}
          >
            ⚠️
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">Кампании: {campaigns.join(', ')}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
