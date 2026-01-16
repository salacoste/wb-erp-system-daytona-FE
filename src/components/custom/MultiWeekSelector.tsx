/**
 * Multi-Week Selector Component
 * Allows selecting multiple weeks for aggregated financial data
 *
 * Features:
 * - Checkbox-based multi-selection
 * - "Select All" / "Clear All" actions
 * - Quick presets (last 4 weeks, last month, etc.)
 * - Display of selected weeks count
 */

'use client'

import { useState, useMemo } from 'react'
import { useAvailableWeeks, formatWeekWithDateRange } from '@/hooks/useFinancialSummary'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AlertCircle, ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiWeekSelectorProps {
  /**
   * Selected weeks (YYYY-Www format)
   */
  value: string[]

  /**
   * Callback when selection changes
   */
  onChange: (weeks: string[]) => void

  /**
   * Label for the selector
   */
  label?: string

  /**
   * Maximum weeks that can be selected
   */
  maxSelection?: number

  /**
   * Custom class name
   */
  className?: string
}

export function MultiWeekSelector({
  value,
  onChange,
  label = 'Выберите периоды',
  maxSelection = 12,
  className,
}: MultiWeekSelectorProps) {
  const { data: weeks, isLoading, isError } = useAvailableWeeks()
  const [open, setOpen] = useState(false)

  // Sort selected weeks for display
  const sortedSelectedWeeks = useMemo(() => {
    return [...value].sort().reverse()
  }, [value])

  const handleToggleWeek = (week: string) => {
    if (value.includes(week)) {
      onChange(value.filter((w) => w !== week))
    } else if (value.length < maxSelection) {
      onChange([...value, week])
    }
  }

  const handleSelectAll = () => {
    if (weeks) {
      onChange(weeks.slice(0, maxSelection).map((w) => w.week))
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  const handlePreset = (count: number) => {
    if (weeks) {
      onChange(weeks.slice(0, count).map((w) => w.week))
    }
  }

  // Format display text
  const displayText = useMemo(() => {
    if (value.length === 0) return 'Выберите недели'
    if (value.length === 1) return formatWeekWithDateRange(value[0])
    return `Выбрано: ${value.length} ${value.length >= 2 && value.length <= 4 ? 'недели' : 'недель'}`
  }, [value])

  if (isLoading) {
    return (
      <div className={className}>
        {label && <Label className="mb-2 block">{label}</Label>}
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !weeks || weeks.length === 0) {
    return (
      <div className={className}>
        {label && <Label className="mb-2 block">{label}</Label>}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isError ? 'Не удалось загрузить список недель' : 'Нет доступных недель'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn(value.length === 0 && 'text-muted-foreground')}>
              {displayText}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          {/* Quick Actions */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex flex-wrap gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset(4)}
                className="text-xs"
              >
                Последние 4 недели
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset(8)}
                className="text-xs"
              >
                2 месяца
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                Все ({Math.min(weeks.length, maxSelection)})
              </Button>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                Выбрано: {value.length} / {maxSelection}
              </span>
              {value.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Очистить
                </Button>
              )}
            </div>
          </div>

          {/* Weeks List */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {weeks.map((week) => {
              const isSelected = value.includes(week.week)
              const isDisabled = !isSelected && value.length >= maxSelection

              return (
                <div
                  key={week.week}
                  className={cn(
                    'flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => !isDisabled && handleToggleWeek(week.week)}
                >
                  <Checkbox
                    id={week.week}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => handleToggleWeek(week.week)}
                  />
                  <label
                    htmlFor={week.week}
                    className={cn(
                      'flex-1 text-sm cursor-pointer ml-1',
                      isSelected && 'font-medium'
                    )}
                  >
                    {formatWeekWithDateRange(week.week)}
                  </label>
                  {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50">
            <Button
              className="w-full"
              onClick={() => setOpen(false)}
              disabled={value.length === 0}
            >
              Применить ({value.length})
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected weeks tags */}
      {value.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {sortedSelectedWeeks.slice(0, 6).map((week) => (
            <span
              key={week}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {week.replace('20', '').replace('-W', '/W')}
              <button
                onClick={() => handleToggleWeek(week)}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {value.length > 6 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{value.length - 6} ещё
            </span>
          )}
        </div>
      )}
    </div>
  )
}
