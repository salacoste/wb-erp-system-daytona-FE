'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronsUpDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAdvertisingCampaigns } from '@/hooks/useAdvertisingAnalytics'
import type { Campaign } from '@/types/advertising-analytics'
import { sortCampaignsByStatus } from '@/lib/campaign-utils'
import { CampaignInfo } from './CampaignStatusBadge'

interface CampaignSelectorProps {
  /** Currently selected campaign IDs */
  selectedIds: number[]
  /** Selection change handler */
  onSelectionChange: (ids: number[]) => void
  /** Disabled state */
  disabled?: boolean
}

/**
 * Campaign Selector Component
 * Story 33.5-FE: Campaign List & Filtering
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Multi-select dropdown (AC1)
 * - Search within dropdown (AC1)
 * - Select All / Clear buttons (AC1)
 * - Status badges with colored dots (AC2)
 * - Type labels (AC3)
 * - Empty state handling (AC5)
 * - Keyboard navigation (AC6)
 */
export function CampaignSelector({
  selectedIds,
  onSelectionChange,
  disabled = false,
}: CampaignSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Ref to track if we're the ones who updated selectedIds (to avoid syncing back)
  const isInternalUpdateRef = useRef(false)

  // Temporary selection state - only applied when dropdown closes
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedIds)

  // Fetch campaigns
  const { data, isLoading, error } = useAdvertisingCampaigns()

  // Sync tempSelectedIds when selectedIds changes from outside (e.g., initial load, quick clear button)
  // But NOT when we updated it ourselves (via dropdown close)
  useEffect(() => {
    if (!open && !isInternalUpdateRef.current) {
      // Only sync when dropdown is closed AND change came from outside
      console.log('[CampaignSelector] Syncing tempSelectedIds with selectedIds (external update):', selectedIds)
      setTempSelectedIds(selectedIds)
    }
    // Reset flag after each selectedIds change
    isInternalUpdateRef.current = false
  }, [selectedIds, open])

  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [open])

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    if (!data?.data) return []

    let campaigns = data.data

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      campaigns = campaigns.filter((c) =>
        c.name.toLowerCase().includes(searchLower)
      )
    }

    // Sort by status (active first, then paused, then by name)
    return sortCampaignsByStatus(campaigns)
  }, [data?.data, search])

  // Toggle campaign selection (temporary - applied on dropdown close)
  const toggleCampaign = useCallback(
    (campaignId: number) => {
      console.log('[CampaignSelector] toggleCampaign called:', {
        campaignId,
        isCurrentlySelected: tempSelectedIds.includes(campaignId),
        currentTempSelectedIds: tempSelectedIds
      })

      const newTempSelectedIds = tempSelectedIds.includes(campaignId)
        ? tempSelectedIds.filter((id) => id !== campaignId)
        : [...tempSelectedIds, campaignId]

      console.log('[CampaignSelector] Setting new tempSelectedIds:', newTempSelectedIds)
      setTempSelectedIds(newTempSelectedIds)
    },
    [tempSelectedIds]
  )

  // Select all visible campaigns (temporary - applied on dropdown close)
  const selectAll = useCallback(() => {
    const visibleIds = filteredCampaigns.map((c) => c.campaign_id)
    const newIds = [...new Set([...tempSelectedIds, ...visibleIds])]
    setTempSelectedIds(newIds)
  }, [filteredCampaigns, tempSelectedIds])

  // Clear all selections (applies immediately)
  const clearAll = useCallback(() => {
    setTempSelectedIds([])
    // Mark as internal update to prevent sync loop
    isInternalUpdateRef.current = true
    onSelectionChange([])
  }, [onSelectionChange])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    []
  )

  // Get button label
  const buttonLabel = useMemo(() => {
    if (selectedIds.length === 0) {
      return 'Все кампании'
    }
    if (selectedIds.length === 1) {
      const campaign = data?.data?.find((c) => c.campaign_id === selectedIds[0])
      return campaign?.name || '1 кампания'
    }
    return `${selectedIds.length} кампаний`
  }, [selectedIds, data?.data])

  // Handle popover open state changes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('[CampaignSelector] handleOpenChange called:', {
      newOpen,
      currentOpen: open,
      selectedIds,
      tempSelectedIds,
      stackTrace: new Error().stack
    })

    if (newOpen) {
      // Opening dropdown - initialize temp selection with current selection
      console.log('[CampaignSelector] Opening dropdown, initializing tempSelectedIds:', selectedIds)
      setTempSelectedIds(selectedIds)
    } else {
      // Closing dropdown - apply temporary selection
      console.log('[CampaignSelector] Closing dropdown, applying temp selection:', tempSelectedIds)

      // Mark this as internal update to prevent sync loop
      isInternalUpdateRef.current = true
      onSelectionChange(tempSelectedIds)
    }

    setOpen(newOpen)
  }, [open, selectedIds, tempSelectedIds, onSelectionChange])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="flex gap-1">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Выбрать кампании"
            className="w-[350px] justify-between"
            disabled={disabled || isLoading}
          >
            <span className="truncate">{buttonLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {/* Quick Clear Button - visible when filter is active */}
        {selectedIds.length > 0 && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearAll}
            disabled={disabled || isLoading}
            aria-label="Очистить фильтр"
            title="Очистить фильтр"
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <PopoverContent
        className="w-[500px] p-0"
        align="start"
        onKeyDown={handleKeyDown}
        onPointerDownOutside={(e) => {
          console.log('[CampaignSelector] onPointerDownOutside triggered', e.target)
          setOpen(false)
        }}
        onEscapeKeyDown={() => {
          console.log('[CampaignSelector] onEscapeKeyDown triggered')
          setOpen(false)
        }}
        onInteractOutside={(e) => {
          console.log('[CampaignSelector] onInteractOutside triggered', {
            target: e.target,
            defaultPrevented: e.defaultPrevented
          })
          // Prevent default behavior - we handle closing manually
          e.preventDefault()
        }}
      >
        {/* Wrapper to prevent event bubbling that closes the popover */}
        <div
          onPointerDown={(e) => {
            console.log('[CampaignSelector] Wrapper onPointerDown', e.target)
            e.stopPropagation()
          }}
          onClick={(e) => {
            console.log('[CampaignSelector] Wrapper onClick', e.target)
            e.stopPropagation()
          }}
        >
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={searchInputRef}
            placeholder="Поиск кампании..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="ml-2 opacity-50 hover:opacity-100"
              aria-label="Очистить поиск"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 hover:underline"
            disabled={filteredCampaigns.length === 0}
          >
            Выбрать все
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={tempSelectedIds.length === 0}
          >
            Очистить
          </button>
        </div>

        {/* Campaign List */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-destructive">
              Не удалось загрузить кампании
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {search ? 'Кампании не найдены' : 'Нет рекламных кампаний'}
              {!search && (
                <p className="mt-1 text-xs">
                  Создайте рекламную кампанию в личном кабинете WB
                </p>
              )}
            </div>
          ) : (
            <div className="p-1">
              {filteredCampaigns.map((campaign) => (
                <CampaignItem
                  key={campaign.campaign_id}
                  campaign={campaign}
                  isSelected={tempSelectedIds.includes(campaign.campaign_id)}
                  onToggle={() => toggleCampaign(campaign.campaign_id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer: Selection Summary + Close Button */}
        <div className="border-t px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {tempSelectedIds.length > 0 ? `Выбрано: ${tempSelectedIds.length}` : 'Не выбрано'}
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              console.log('[CampaignSelector] Done button clicked, closing dropdown')
              handleOpenChange(false)
            }}
            className="h-7 text-xs"
          >
            Готово
          </Button>
        </div>
        </div>
      </PopoverContent>
    </Popover>
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
    console.log('[CampaignItem] handleClick', {
      campaign: campaign.name,
      isSelected,
      eventType: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      bubbles: e.bubbles,
      defaultPrevented: e.defaultPrevented
    })
    e.preventDefault()
    e.stopPropagation()
    onToggle()
    console.log('[CampaignItem] After onToggle, preventDefault:', e.defaultPrevented)
  }

  // Prevent checkbox events from bubbling
  const handleCheckboxInteraction = (e: React.MouseEvent | React.PointerEvent) => {
    console.log('[CampaignItem] handleCheckboxInteraction', {
      eventType: e.type,
      target: e.target
    })
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
