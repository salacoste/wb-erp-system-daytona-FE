'use client'

/**
 * Campaign Placement Badges Component
 * Story 33.9: Request #79 - Placement Field
 *
 * Shows active placements for Type 9 campaigns.
 * Displays "N/A" for legacy campaigns (types 4-8) with null placements.
 *
 * Extracted from CampaignBadges.tsx for 200-line compliance.
 */

import { Search, Star, Layers } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CampaignPlacements } from '@/types/advertising-analytics'

interface PlacementBadgesProps {
  /** Campaign placement settings */
  placements: CampaignPlacements | null
  /** Display mode: icons with tooltips or text badges */
  mode?: 'icons' | 'badges'
  /** Additional class names */
  className?: string
}

/**
 * Placement types:
 * - Search: Размещение в поиске
 * - Recommendations: Рекомендации (витрина/карточка товара)
 * - Carousel: Карусель на главной
 */
export function PlacementBadges({ placements, mode = 'icons', className }: PlacementBadgesProps) {
  // Legacy campaigns (types 4-8) have null placements
  if (!placements) {
    return <span className={cn('text-xs text-muted-foreground', className)}>N/A</span>
  }

  const activePlacements = [
    { key: 'search', active: placements.search, label: 'Поиск', Icon: Search },
    {
      key: 'recommendations',
      active: placements.recommendations,
      label: 'Рекомендации',
      Icon: Star,
    },
    { key: 'carousel', active: placements.carousel, label: 'Карусель', Icon: Layers },
  ].filter(p => p.active)

  // No active placements
  if (activePlacements.length === 0) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Нет активных</span>
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
        <Badge key={key} variant="secondary" className="text-xs font-normal">
          {label}
        </Badge>
      ))}
    </div>
  )
}
