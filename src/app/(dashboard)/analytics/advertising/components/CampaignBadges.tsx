'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getCampaignStatusLabel, getCampaignTypeLabel } from '@/lib/campaign-utils'
// Story 170.1: dot color from route-local token map — lib getCampaignStatusDotColor
// stays read-only for the dashboard/widget lockstep consumers.
import { getCampaignStatusDotToken } from './advertising-tokens'

// Re-export PlacementBadges from its own file
export { PlacementBadges } from './PlacementBadges'

// ============================================================================
// Campaign Status Dot
// ============================================================================

interface CampaignStatusDotProps {
  /** WB status code */
  status: number
  /** Fallback label from API (status_name) */
  statusName?: string
  /** Size of the dot */
  size?: 'sm' | 'md'
  /** Additional class names */
  className?: string
}

/**
 * Campaign Status Dot Component
 * Story 33.5-FE: Campaign List & Filtering (AC2)
 *
 * Shows a colored dot indicating campaign status with tooltip.
 * Colors per AC2:
 * - Active (9): Green
 * - Paused (11): Yellow
 * - Ended (7): Gray
 * - Ready (4): Blue
 * - Declined (8): Red
 */
export function CampaignStatusDot({
  status,
  statusName,
  size = 'md',
  className,
}: CampaignStatusDotProps) {
  const dotColor = getCampaignStatusDotToken(status)
  const label = getCampaignStatusLabel(status, statusName)
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('rounded-full flex-shrink-0', sizeClass, dotColor, className)}
            aria-label={label}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// Campaign Type Badge
// ============================================================================

interface CampaignTypeBadgeProps {
  /** WB type code */
  type: number
  /** Fallback label from API (type_name) */
  typeName?: string
  /** Additional class names */
  className?: string
}

/**
 * Campaign Type Badge Component
 * Story 33.5-FE: Campaign List & Filtering (AC3)
 *
 * Shows campaign type as a badge.
 * Types per AC3:
 * - Auto (8): "Авто"
 * - Auction (9): "Аукцион"
 * - Other types: Show type_name from API
 */
export function CampaignTypeBadge({ type, typeName, className }: CampaignTypeBadgeProps) {
  const label = getCampaignTypeLabel(type, typeName)

  return (
    <Badge variant="outline" className={cn('text-xs font-normal', className)}>
      {label}
    </Badge>
  )
}
