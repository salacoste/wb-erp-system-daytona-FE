'use client'

import { useCallback } from 'react'
import { ChevronsUpDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { CampaignList } from './CampaignList'
import { useCampaignSelectorState } from './useCampaignSelectorState'

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
  const {
    open,
    setOpen,
    search,
    setSearch,
    searchInputRef,
    filteredCampaigns,
    tempSelectedIds,
    isLoading,
    error,
    buttonLabel,
    toggleCampaign,
    selectAll,
    clearAll,
    handleOpenChange,
  } = useCampaignSelectorState(selectedIds, onSelectionChange)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

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
              className="text-xs text-primary hover:underline"
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
