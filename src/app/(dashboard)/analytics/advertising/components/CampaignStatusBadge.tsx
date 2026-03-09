'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { CampaignPlacements } from '@/types/advertising-analytics'
import { CampaignStatusDot, CampaignTypeBadge, PlacementBadges } from './CampaignBadges'

// Re-export badge components for backward compatibility
export { CampaignStatusDot, CampaignTypeBadge, PlacementBadges }

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
  const displayName =
    maxNameLength && name.length > maxNameLength ? name.slice(0, maxNameLength) + '...' : name

  // Format creation date: "26 дек 2025"
  const formattedDate = createdAt ? format(new Date(createdAt), 'd MMM yyyy', { locale: ru }) : null

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
          {showCreatedAt && formattedDate && <span>Создана: {formattedDate}</span>}
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
