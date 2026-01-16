/**
 * Week Selector Component
 * Story 3.5: Financial Summary View
 *
 * Features:
 * - Select week from available weeks
 * - Optional comparison mode (select 2 weeks)
 * - Formatted week display
 * - Loading and error states
 */

import { useAvailableWeeks, formatWeekWithDateRange } from '@/hooks/useFinancialSummary'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface WeekSelectorProps {
  /**
   * Selected week (YYYY-Www format)
   */
  value: string

  /**
   * Callback when week is changed
   */
  onChange: (week: string) => void

  /**
   * Label for the select input
   */
  label?: string

  /**
   * ID for the select input
   */
  id?: string

  /**
   * Whether the selector is disabled
   */
  disabled?: boolean

  /**
   * Custom class name
   */
  className?: string
}

export function WeekSelector({
  value,
  onChange,
  label = 'Неделя',
  id = 'week-selector',
  disabled = false,
  className,
}: WeekSelectorProps) {
  const { data: weeks, isLoading, isError } = useAvailableWeeks()

  if (isLoading) {
    return (
      <div className={className}>
        {label && <Label htmlFor={id}>{label}</Label>}
        <Skeleton className="h-10 w-full mt-2" />
      </div>
    )
  }

  if (isError || !weeks || weeks.length === 0) {
    return (
      <div className={className}>
        {label && <Label htmlFor={id}>{label}</Label>}
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isError
              ? 'Не удалось загрузить список недель'
              : 'Нет доступных недель для отображения'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Выберите неделю" />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={4}
          className="max-h-[300px]"
          usePortal={false}
        >
          {weeks.map((week) => (
            <SelectItem key={week.week} value={week.week}>
              {formatWeekWithDateRange(week.week)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface WeekComparisonSelectorProps {
  /**
   * First selected week (YYYY-Www format)
   */
  week1: string

  /**
   * Second selected week (YYYY-Www format)
   */
  week2: string

  /**
   * Callback when first week is changed
   */
  onWeek1Change: (week: string) => void

  /**
   * Callback when second week is changed
   */
  onWeek2Change: (week: string) => void

  /**
   * Custom class name
   */
  className?: string
}

export function WeekComparisonSelector({
  week1,
  week2,
  onWeek1Change,
  onWeek2Change,
  className,
}: WeekComparisonSelectorProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className || ''}`}>
      <WeekSelector
        value={week1}
        onChange={onWeek1Change}
        label="Период 1"
        id="week1-selector"
      />
      <WeekSelector
        value={week2}
        onChange={onWeek2Change}
        label="Период 2"
        id="week2-selector"
      />
    </div>
  )
}
