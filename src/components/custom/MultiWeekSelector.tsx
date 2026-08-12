/**
 * Multi-Week Selector Component
 * Allows selecting multiple weeks for aggregated financial data
 */

'use client'

import { useId, useState, useMemo } from 'react'
import { useAvailableWeeks, formatWeekWithDateRange } from '@/hooks/useFinancialSummary'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickActions, WeeksList, SelectedTags } from './MultiWeekSelectorContent'

interface MultiWeekSelectorProps {
  value: string[]
  onChange: (weeks: string[]) => void
  label?: string
  maxSelection?: number
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
  const triggerId = useId()

  const sortedSelectedWeeks = useMemo(() => {
    return [...value].sort().reverse()
  }, [value])

  const handleToggleWeek = (week: string) => {
    if (value.includes(week)) {
      onChange(value.filter(w => w !== week))
    } else if (value.length < maxSelection) {
      onChange([...value, week])
    }
  }

  const handleSelectAll = () => {
    if (weeks) {
      onChange(weeks.slice(0, maxSelection).map(w => w.week))
    }
  }

  const handleClearAll = () => onChange([])

  const handlePreset = (count: number) => {
    if (weeks) {
      onChange(weeks.slice(0, count).map(w => w.week))
    }
  }

  const displayText = useMemo(() => {
    if (value.length === 0) return 'Выберите недели'
    if (value.length === 1) return formatWeekWithDateRange(value[0])
    return `Выбрано: ${value.length} ${value.length >= 2 && value.length <= 4 ? 'недели' : 'недель'}`
  }, [value])

  if (isLoading) {
    return (
      <div aria-busy="true" className={className}>
        {label && <Label className="mb-2 block">{label}</Label>}
        <div className="mb-2 break-words text-sm text-foreground">Текущий выбор: {displayText}</div>
        <Skeleton aria-hidden="true" className="h-10 w-full" />
        <span role="status" className="mt-1 block text-sm text-muted-foreground">
          Загрузка доступных недель
        </span>
      </div>
    )
  }

  if (isError || !weeks || weeks.length === 0) {
    return (
      <div className={className}>
        {label && <Label className="mb-2 block">{label}</Label>}
        <div className="mb-2 break-words text-sm text-foreground">Текущий выбор: {displayText}</div>
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
      {label && (
        <Label htmlFor={triggerId} className="mb-2 block">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn(value.length === 0 && 'text-muted-foreground')}>{displayText}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(25rem,var(--radix-popover-content-available-width))] max-w-[calc(100vw-2rem)] p-0"
          align="start"
        >
          <QuickActions
            weeks={weeks}
            maxSelection={maxSelection}
            selectedCount={value.length}
            onPreset={handlePreset}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
          />
          <WeeksList
            idPrefix={triggerId}
            weeks={weeks}
            selected={value}
            maxSelection={maxSelection}
            onToggle={handleToggleWeek}
          />
          <div className="border-t border-border bg-muted/40 p-3">
            <Button
              className="min-h-11 w-full"
              onClick={() => setOpen(false)}
              disabled={value.length === 0}
            >
              Применить ({value.length})
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <SelectedTags
        sortedWeeks={sortedSelectedWeeks}
        totalCount={value.length}
        onToggle={handleToggleWeek}
      />
    </div>
  )
}
