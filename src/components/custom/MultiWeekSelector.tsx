/**
 * Multi-Week Selector Component
 * Allows selecting multiple weeks for aggregated financial data
 */

'use client'

import { useState, useMemo } from 'react'
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
            <span className={cn(value.length === 0 && 'text-muted-foreground')}>{displayText}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <QuickActions
            weeks={weeks}
            maxSelection={maxSelection}
            selectedCount={value.length}
            onPreset={handlePreset}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
          />
          <WeeksList
            weeks={weeks}
            selected={value}
            maxSelection={maxSelection}
            onToggle={handleToggleWeek}
          />
          <div className="p-3 border-t bg-gray-50">
            <Button className="w-full" onClick={() => setOpen(false)} disabled={value.length === 0}>
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
