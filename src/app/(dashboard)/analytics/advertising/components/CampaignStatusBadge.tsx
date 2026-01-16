'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Search, Star, Layers } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  getCampaignStatusDotColor,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
} from '@/lib/campaign-utils'
import type { CampaignPlacements } from '@/types/advertising-analytics'

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
  const dotColor = getCampaignStatusDotColor(status)
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
export function CampaignTypeBadge({
  type,
  typeName,
  className,
}: CampaignTypeBadgeProps) {
  const label = getCampaignTypeLabel(type, typeName)

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal', className)}
    >
      {label}
    </Badge>
  )
}

// ============================================================================
// Campaign Placement Badges
// ============================================================================

interface PlacementBadgesProps {
  /** Campaign placement settings */
  placements: CampaignPlacements | null;
  /** Display mode: icons with tooltips or text badges */
  mode?: 'icons' | 'badges';
  /** Additional class names */
  className?: string;
}

/**
 * Campaign Placement Badges Component
 * Story 33.9: Request #79 - Placement Field
 *
 * Shows active placements for Type 9 campaigns.
 * Displays "N/A" for legacy campaigns (types 4-8) with null placements.
 *
 * Placement types:
 * - Search (🔍): Размещение в поиске
 * - Recommendations (⭐): Рекомендации (витрина/карточка товара)
 * - Carousel (📚): Карусель на главной
 */
export function PlacementBadges({
  placements,
  mode = 'icons',
  className,
}: PlacementBadgesProps) {
  // Legacy campaigns (types 4-8) have null placements
  if (!placements) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        N/A
      </span>
    )
  }

  const activePlacements = [
    { key: 'search', active: placements.search, label: 'Поиск', Icon: Search },
    { key: 'recommendations', active: placements.recommendations, label: 'Рекомендации', Icon: Star },
    { key: 'carousel', active: placements.carousel, label: 'Карусель', Icon: Layers },
  ].filter(p => p.active)

  // No active placements
  if (activePlacements.length === 0) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        Нет активных
      </span>
    )
  }

  // Icons mode (compact)
  if (mode === 'icons') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {activePlacements.map(({ key, label, Icon }) => (
          <TooltipProvider key={key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-label={label} />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    )
  }

  // Badges mode (explicit)
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {activePlacements.map(({ key, label }) => (
        <Badge
          key={key}
          variant="secondary"
          className="text-xs font-normal"
        >
          {label}
        </Badge>
      ))}
    </div>
  )
}

// ============================================================================
// Combined Campaign Info
// ============================================================================

interface CampaignInfoProps {
  /** Campaign name */
  name: string
  /** WB status code */
  status: number
  /** Fallback status label from API */
  statusName?: string
  /** WB type code */
  type: number
  /** Fallback type label from API */
  typeName?: string
  /** Campaign creation date (ISO string) */
  createdAt?: string
  /** Campaign placement settings (Story 33.9) */
  placements?: CampaignPlacements | null
  /** Whether to show type badge */
  showType?: boolean
  /** Whether to show creation date */
  showCreatedAt?: boolean
  /** Whether to show placements */
  showPlacements?: boolean
  /** Truncate name to this length */
  maxNameLength?: number
  /** Additional class names */
  className?: string
}

/**
 * Combined Campaign Info Component
 *
 * Shows campaign name with status dot, optional type badge, creation date, and placements.
 * Used in CampaignSelector dropdown items.
 */
export function CampaignInfo({
  name,
  status,
  statusName,
  type,
  typeName,
  createdAt,
  placements,
  showType = true,
  showCreatedAt = false,
  showPlacements = false,
  maxNameLength = 30,
  className,
}: CampaignInfoProps) {
  const displayName = maxNameLength && name.length > maxNameLength
    ? name.slice(0, maxNameLength) + '...'
    : name

  // Format creation date: "26 дек 2025"
  const formattedDate = createdAt
    ? format(new Date(createdAt), 'd MMM yyyy', { locale: ru })
    : null

  return (
    <div className={cn('flex flex-col gap-0.5 min-w-0', className)}>
      <div className="flex items-center gap-2 min-w-0">
        <CampaignStatusDot status={status} statusName={statusName} size="sm" />
        <span className="truncate flex-1" title={name}>
          {displayName}
        </span>
        {showType && (
          <CampaignTypeBadge type={type} typeName={typeName} className="ml-auto flex-shrink-0" />
        )}
      </div>
      {(showCreatedAt || showPlacements) && (
        <div className="flex items-center gap-3 ml-4 text-xs text-muted-foreground">
          {showCreatedAt && formattedDate && (
            <span>Создана: {formattedDate}</span>
          )}
          {showPlacements && placements !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Размещение:</span>
              <PlacementBadges placements={placements} mode="icons" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
