'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronsUpDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { useAdvertisingCampaigns } from '@/hooks/useAdvertisingAnalytics'
import { sortCampaignsByStatus } from '@/lib/campaign-utils'
import { CampaignList } from './CampaignList'

interface CampaignSelectorProps {
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  disabled?: boolean
}

/** Campaign Selector - Story 33.5-FE: Campaign List & Filtering */
export function CampaignSelector({
  selectedIds,
  onSelectionChange,
  disabled = false,
}: CampaignSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isInternalUpdateRef = useRef(false)
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedIds)

  const { data, isLoading, error } = useAdvertisingCampaigns()

  useEffect(() => {
    if (!open && !isInternalUpdateRef.current) {
      setTempSelectedIds(selectedIds)
    }
    isInternalUpdateRef.current = false
  }, [selectedIds, open])

  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [open])

  const filteredCampaigns = useMemo(() => {
    if (!data?.data) return []
    let campaigns = data.data
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      campaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchLower))
    }
    return sortCampaignsByStatus(campaigns)
  }, [data?.data, search])

  const toggleCampaign = useCallback((campaignId: number) => {
    setTempSelectedIds(prev =>
      prev.includes(campaignId) ? prev.filter(id => id !== campaignId) : [...prev, campaignId]
    )
  }, [])

  const selectAll = useCallback(() => {
    const visibleIds = filteredCampaigns.map(c => c.campaign_id)
    setTempSelectedIds(prev => [...new Set([...prev, ...visibleIds])])
  }, [filteredCampaigns])

  const clearAll = useCallback(() => {
    setTempSelectedIds([])
    isInternalUpdateRef.current = true
    onSelectionChange([])
  }, [onSelectionChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  const buttonLabel = useMemo(() => {
    if (selectedIds.length === 0) return 'Все кампании'
    if (selectedIds.length === 1) {
      const campaign = data?.data?.find(c => c.campaign_id === selectedIds[0])
      return campaign?.name || '1 кампания'
    }
    return `${selectedIds.length} кампаний`
  }, [selectedIds, data?.data])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setTempSelectedIds(selectedIds)
      } else {
        isInternalUpdateRef.current = true
        onSelectionChange(tempSelectedIds)
      }
      setOpen(newOpen)
    },
    [selectedIds, tempSelectedIds, onSelectionChange]
  )

  const stopPropagation = useCallback((e: React.SyntheticEvent) => e.stopPropagation(), [])
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
        onPointerDownOutside={() => setOpen(false)}
        onEscapeKeyDown={() => setOpen(false)}
        onInteractOutside={e => e.preventDefault()}
      >
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={searchInputRef}
              placeholder="Поиск кампании..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
          <div className="max-h-[300px] overflow-y-auto">
            <CampaignList
              campaigns={filteredCampaigns}
              selectedIds={tempSelectedIds}
              isLoading={isLoading}
              error={error}
              search={search}
              onToggle={toggleCampaign}
            />
          </div>
          <div className="border-t px-3 py-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {tempSelectedIds.length > 0 ? `Выбрано: ${tempSelectedIds.length}` : 'Не выбрано'}
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => handleOpenChange(false)}
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
