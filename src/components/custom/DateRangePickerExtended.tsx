/**
 * Extended Date Range Picker Component
 * Story 51.3-FE: Extended Date Range Picker Component
 * Epic 51: FBS Historical Analytics UI (365 Days)
 * @see docs/stories/epic-51/story-51.3-fe-extended-date-range-picker.md
 */

'use client'

import * as React from 'react'
import { CalendarIcon, X, Info, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  formatDateRangeRu,
  getSmartAggregation,
  getAggregationLabel,
  pluralizeDays,
  calculateDaysDiff,
  getPresetRange,
} from '@/lib/date-range-utils'
import type { DateRangePreset, DateRangePickerExtendedProps } from '@/types/date-range'
import { PopoverBody } from './DateRangePickerPopoverContent'

/** Default presets per Story 51.3-FE */
const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
  { label: '180 дней', days: 180 },
  { label: '365 дней', days: 365 },
]

export function DateRangePickerExtended({
  value,
  onChange,
  maxDays = 365,
  presets = DEFAULT_PRESETS,
  showAggregationSuggestion = true,
  disabled = false,
  className,
  placeholder = 'Выберите период',
  id,
}: DateRangePickerExtendedProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false)
  const generatedId = React.useId()
  const triggerId = id ?? generatedId
  const dialogTitleId = `${triggerId}-dialog-title`

  const daysInRange = value ? calculateDaysDiff(value.from, value.to) : 0
  const isRangeExceeded = daysInRange > maxDays
  const aggregation = daysInRange > 0 ? getSmartAggregation(daysInRange) : null
  const activePreset = presets.find(p => p.days === daysInRange)

  const handlePresetClick = (days: number): void => {
    onChange(getPresetRange(days))
  }

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined): void => {
    if (!range || !range.from) return
    if (range.from && range.to) {
      onChange({ from: range.from, to: range.to })
    }
  }

  return (
    <div className={cn('relative', className)}>
      <label htmlFor={triggerId} className="mb-1 block text-sm font-medium">
        Период дат
      </label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex min-w-0 gap-2">
          <PopoverTrigger asChild>
            <Button
              id={triggerId}
              variant="outline"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-label={
                value
                  ? `Период дат — выбран период: ${formatDateRangeRu(value.from, value.to)}`
                  : `Период дат — ${placeholder}`
              }
              className={cn(
                'min-w-0 flex-1 justify-start text-left font-normal whitespace-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <CalendarIcon aria-hidden="true" className="mr-2 h-4 w-4" />
              {value ? formatDateRangeRu(value.from, value.to) : placeholder}
            </Button>
          </PopoverTrigger>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => onChange(undefined)}
              aria-label="Очистить период"
              className="min-h-11 min-w-11"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
        </div>
        <PopoverContent
          className="w-[min(36.25rem,var(--radix-popover-content-available-width))] max-w-[calc(100vw-2rem)] p-4"
          align="start"
          role="dialog"
          aria-labelledby={dialogTitleId}
        >
          <h2 id={dialogTitleId} className="mb-3 text-sm font-semibold">
            Выбор диапазона дат
          </h2>
          <PopoverBody
            value={value}
            presets={presets}
            activePreset={activePreset}
            maxDays={maxDays}
            daysInRange={daysInRange}
            isRangeExceeded={isRangeExceeded}
            showAggregationSuggestion={showAggregationSuggestion}
            onPresetClick={handlePresetClick}
            onCalendarSelect={handleCalendarSelect}
            onClear={() => onChange(undefined)}
            onClose={() => setIsOpen(false)}
          />
        </PopoverContent>
      </Popover>

      {showAggregationSuggestion && aggregation && !isRangeExceeded && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center">
          <Info className="mr-2 h-4 w-4" />
          Рекомендуемая агрегация: {getAggregationLabel(aggregation)}
        </div>
      )}

      {daysInRange > 0 && !isRangeExceeded && (
        <div className="mt-1 text-sm text-muted-foreground">
          Выбрано: {daysInRange} {pluralizeDays(daysInRange)}
        </div>
      )}

      {isRangeExceeded && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Диапазон не может превышать {maxDays} {pluralizeDays(maxDays)}. Выбрано: {daysInRange}{' '}
            {pluralizeDays(daysInRange)}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export { DEFAULT_PRESETS }
