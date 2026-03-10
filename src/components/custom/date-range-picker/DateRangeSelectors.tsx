/**
 * Date Range Selector Sub-Components
 * Extracted from DateRangePicker.tsx for file size compliance (Epic 74)
 *
 * Contains: QuickSelectDropdown, WeekRangeSelectors, PeriodSummary, ValidationAlerts
 * Loading/error states: see DateRangeStates.tsx
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatWeekWithDateRange, type WeekData } from '@/hooks/useFinancialSummary'
import { QUICK_SELECT_OPTIONS } from './date-range-utils'

// Re-export loading/error states for backward compatibility
export { DateRangeLoadingState, DateRangeErrorState } from './DateRangeStates'

/** Props for QuickSelectDropdown */
interface QuickSelectProps {
  matchedQuickOption: string | undefined
  onQuickSelect: (weeksCount: string) => void
  disabled: boolean
}

/** Quick select dropdown for preset period options */
export function QuickSelectDropdown({
  matchedQuickOption,
  onQuickSelect,
  disabled,
}: QuickSelectProps) {
  return (
    <div className="mb-3">
      <Select value={matchedQuickOption} onValueChange={onQuickSelect} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Быстрый выбор периода..." />
        </SelectTrigger>
        <SelectContent>
          {QUICK_SELECT_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Props for WeekRangeSelectors */
interface WeekRangeSelectorsProps {
  weekStart: string
  weekEnd: string
  weeks: WeekData[]
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  disabled: boolean
}

/** Start/end week selector pair */
export function WeekRangeSelectors({
  weekStart,
  weekEnd,
  weeks,
  onStartChange,
  onEndChange,
  disabled,
}: WeekRangeSelectorsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Start Week */}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">От</Label>
        <Select value={weekStart} onValueChange={onStartChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Начало" />
          </SelectTrigger>
          <SelectContent>
            {weeks.map(week => (
              <SelectItem key={week.week} value={week.week}>
                {formatWeekWithDateRange(week.week)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* End Week */}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">До</Label>
        <Select value={weekEnd} onValueChange={onEndChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Конец" />
          </SelectTrigger>
          <SelectContent>
            {weeks.map(week => (
              <SelectItem key={week.week} value={week.week}>
                {formatWeekWithDateRange(week.week)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/** Props for PeriodSummary */
interface PeriodSummaryProps {
  weeksInRange: number
  isStartAfterEnd: boolean
  isRangeTooLarge: boolean
}

/** Display selected period week count */
export function PeriodSummary({
  weeksInRange,
  isStartAfterEnd,
  isRangeTooLarge,
}: PeriodSummaryProps) {
  if (isStartAfterEnd || isRangeTooLarge) return null

  return (
    <div className="mt-2 text-xs text-gray-500">
      <span>
        Выбрано: {weeksInRange}{' '}
        {weeksInRange === 1 ? 'неделя' : weeksInRange < 5 ? 'недели' : 'недель'}
      </span>
    </div>
  )
}

/** Props for ValidationAlerts */
interface ValidationAlertsProps {
  isStartAfterEnd: boolean
  isRangeTooLarge: boolean
  maxWeeks: number
  weeksInRange: number
}

/** Validation error alerts for date range */
export function ValidationAlerts({
  isStartAfterEnd,
  isRangeTooLarge,
  maxWeeks,
  weeksInRange,
}: ValidationAlertsProps) {
  return (
    <>
      {isStartAfterEnd && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Начальная неделя не может быть позже конечной</AlertDescription>
        </Alert>
      )}

      {isRangeTooLarge && !isStartAfterEnd && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Диапазон не может превышать {maxWeeks} недель. Выбрано: {weeksInRange}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
