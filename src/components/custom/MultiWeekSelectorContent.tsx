/**
 * MultiWeekSelector popover content
 * Extracted from MultiWeekSelector.tsx for file size compliance
 */

'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatWeekWithDateRange } from '@/hooks/useFinancialSummary'
import type { WeekData } from '@/hooks/financial'

interface QuickActionsProps {
  weeks: WeekData[]
  maxSelection: number
  selectedCount: number
  onPreset: (count: number) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function QuickActions({
  weeks,
  maxSelection,
  selectedCount,
  onPreset,
  onSelectAll,
  onClearAll,
}: QuickActionsProps) {
  return (
    <div className="border-b border-border bg-muted/40 p-3">
      <div className="mb-2 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreset(4)}
          className="min-h-11 text-xs"
        >
          Последние 4 недели
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreset(8)}
          className="min-h-11 text-xs"
        >
          2 месяца
        </Button>
        <Button variant="outline" size="sm" onClick={onSelectAll} className="min-h-11 text-xs">
          Все ({Math.min(weeks.length, maxSelection)})
        </Button>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Выбрано: {selectedCount} / {maxSelection}
        </span>
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="min-h-11 px-2 text-xs text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Очистить
          </Button>
        )}
      </div>
    </div>
  )
}

interface WeeksListProps {
  idPrefix: string
  weeks: WeekData[]
  selected: string[]
  maxSelection: number
  onToggle: (week: string) => void
}

export function WeeksList({ idPrefix, weeks, selected, maxSelection, onToggle }: WeeksListProps) {
  return (
    <div className="max-h-[300px] overflow-y-auto p-2">
      {weeks.map(week => {
        const checkboxId = `${idPrefix}-${week.week}`
        const isSelected = selected.includes(week.week)
        const isDisabled = !isSelected && selected.length >= maxSelection

        return (
          <div
            key={week.week}
            className={cn(
              'flex min-h-11 items-center space-x-3 rounded-md p-2 transition-colors',
              isSelected ? 'bg-accent' : 'hover:bg-muted/50',
              isDisabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Checkbox
              id={checkboxId}
              checked={isSelected}
              disabled={isDisabled}
              onCheckedChange={() => onToggle(week.week)}
            />
            <label
              htmlFor={checkboxId}
              className={cn(
                'ml-1 flex min-h-11 flex-1 cursor-pointer items-center text-sm',
                isSelected && 'font-medium'
              )}
            >
              {formatWeekWithDateRange(week.week)}
            </label>
            {isSelected && <Check aria-hidden="true" className="h-4 w-4 text-primary" />}
          </div>
        )
      })}
    </div>
  )
}

interface SelectedTagsProps {
  sortedWeeks: string[]
  totalCount: number
  onToggle: (week: string) => void
}

export function SelectedTags({ sortedWeeks, totalCount, onToggle }: SelectedTagsProps) {
  if (totalCount <= 1) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {sortedWeeks.slice(0, 6).map(week => (
        <span
          key={week}
          className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
        >
          {week.replace('20', '').replace('-W', '/W')}
          <button
            type="button"
            onClick={() => onToggle(week)}
            aria-label={`Удалить ${week}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="h-3 w-3" />
          </button>
        </span>
      ))}
      {totalCount > 6 && (
        <span className="px-2 py-0.5 text-xs text-muted-foreground">+{totalCount - 6} ещё</span>
      )}
    </div>
  )
}
