'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/types/advertising-analytics'
import { CampaignInfo } from './CampaignStatusBadge'

// ============================================================================
// Campaign List Props
// ============================================================================

interface CampaignListProps {
  /** Filtered and sorted campaigns to display */
  campaigns: Campaign[]
  /** Currently selected campaign IDs (temporary state) */
  selectedIds: number[]
  /** Loading state from API */
  isLoading: boolean
  /** Error state from API */
  error: Error | null
  /** Current search query (for empty state text) */
  search: string
  /** Toggle a campaign's selection */
  onToggle: (campaignId: number) => void
}

/**
 * Campaign List Component
 * Extracted from CampaignSelector for file size compliance.
 *
 * Renders the scrollable campaign list inside the dropdown,
 * including loading, error, and empty states.
 */
export function CampaignList({
  campaigns,
  selectedIds,
  isLoading,
  error,
  search,
  onToggle,
}: CampaignListProps) {
  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-destructive">Не удалось загрузить кампании</div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        {search ? 'Кампании не найдены' : 'Нет рекламных кампаний'}
        {!search && (
          <p className="mt-1 text-xs">Создайте рекламную кампанию в личном кабинете WB</p>
        )}
      </div>
    )
  }

  return (
    <div className="p-1">
      {campaigns.map(campaign => (
        <CampaignItem
          key={campaign.campaign_id}
          campaign={campaign}
          isSelected={selectedIds.includes(campaign.campaign_id)}
          onToggle={() => onToggle(campaign.campaign_id)}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Campaign Item Component
// ============================================================================

interface CampaignItemProps {
  campaign: Campaign
  isSelected: boolean
  onToggle: () => void
}

function CampaignItem({ campaign, isSelected, onToggle }: CampaignItemProps) {
  // Prevent ALL event bubbling to keep dropdown open
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle()
  }

  // Prevent checkbox events from bubbling
  const handleCheckboxInteraction = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent/50'
      )}
      onClick={handleClick}
      onPointerDown={handleCheckboxInteraction}
      role="option"
      aria-selected={isSelected}
    >
      <Checkbox
        checked={isSelected}
        aria-label={`Выбрать ${campaign.name}`}
        onPointerDown={handleCheckboxInteraction}
        onClick={handleCheckboxInteraction}
        className="pointer-events-none"
      />
      <div className="flex-1 min-w-0">
        <CampaignInfo
          name={campaign.name}
          status={campaign.status}
          statusName={campaign.status_name}
          type={campaign.type}
          typeName={campaign.type_name}
          createdAt={campaign.created_at}
          placements={campaign.placements}
          showCreatedAt={true}
          showPlacements={true}
          maxNameLength={65}
        />
      </div>
    </div>
  )
}
