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
    <div className="p-3 border-b bg-gray-50">
      <div className="flex flex-wrap gap-2 mb-2">
        <Button variant="outline" size="sm" onClick={() => onPreset(4)} className="text-xs">
          Последние 4 недели
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPreset(8)} className="text-xs">
          2 месяца
        </Button>
        <Button variant="outline" size="sm" onClick={onSelectAll} className="text-xs">
          Все ({Math.min(weeks.length, maxSelection)})
        </Button>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          Выбрано: {selectedCount} / {maxSelection}
        </span>
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
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
  weeks: WeekData[]
  selected: string[]
  maxSelection: number
  onToggle: (week: string) => void
}

export function WeeksList({ weeks, selected, maxSelection, onToggle }: WeeksListProps) {
  return (
    <div className="max-h-[300px] overflow-y-auto p-2">
      {weeks.map(week => {
        const isSelected = selected.includes(week.week)
        const isDisabled = !isSelected && selected.length >= maxSelection

        return (
          <div
            key={week.week}
            className={cn(
              'flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors',
              isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !isDisabled && onToggle(week.week)}
          >
            <Checkbox
              id={week.week}
              checked={isSelected}
              disabled={isDisabled}
              onCheckedChange={() => onToggle(week.week)}
            />
            <label
              htmlFor={week.week}
              className={cn('flex-1 text-sm cursor-pointer ml-1', isSelected && 'font-medium')}
            >
              {formatWeekWithDateRange(week.week)}
            </label>
            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
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
    <div className="flex flex-wrap gap-1 mt-2">
      {sortedWeeks.slice(0, 6).map(week => (
        <span
          key={week}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
        >
          {week.replace('20', '').replace('-W', '/W')}
          <button onClick={() => onToggle(week)} className="hover:text-blue-900">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {totalCount > 6 && (
        <span className="px-2 py-0.5 text-xs text-gray-500">+{totalCount - 6} ещё</span>
      )}
    </div>
  )
}
