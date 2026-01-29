/**
 * Extended Date Range Picker Component
 * Story 51.3-FE: Extended Date Range Picker Component
 * Epic 51: FBS Historical Analytics UI (365 Days)
 *
 * Features:
 * - Two calendar views (start and end date)
 * - Preset buttons (30, 90, 180, 365 days)
 * - Max 365 days validation
 * - Russian locale (months, days, date format DD.MM.YYYY)
 * - Smart aggregation suggestion
 * - Keyboard navigation and accessibility
 *
 * @see docs/stories/epic-51/story-51.3-fe-extended-date-range-picker.md
 */

'use client'

import * as React from 'react'
import { CalendarIcon, X, Info, AlertCircle } from 'lucide-react'
import { ru } from 'date-fns/locale'
import { subDays } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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

/** Default presets per Story 51.3-FE */
const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
  { label: '180 дней', days: 180 },
  { label: '365 дней', days: 365 },
]

/**
 * Extended Date Range Picker with calendar views and preset buttons
 */
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

  // Calculate days in range
  const daysInRange = value ? calculateDaysDiff(value.from, value.to) : 0

  // Validation: check if range exceeds maxDays
  const isRangeExceeded = daysInRange > maxDays

  // Get aggregation suggestion
  const aggregation = daysInRange > 0 ? getSmartAggregation(daysInRange) : null

  // Determine active preset (exact match on days count)
  const activePreset = presets.find(p => p.days === daysInRange)

  // Handle preset button click
  const handlePresetClick = (days: number): void => {
    const range = getPresetRange(days)
    onChange(range)
  }

  // Handle clear button click
  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onChange(undefined)
  }

  // Handle calendar range selection
  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined): void => {
    if (!range || !range.from) {
      return
    }
    // Only call onChange when we have both from and to dates
    if (range.from && range.to) {
      onChange({ from: range.from, to: range.to })
    }
  }

  // Calculate disabled dates (future dates and dates > 365 days ago)
  const today = new Date()
  const minDate = subDays(today, maxDays)

  return (
    <div className={cn('relative', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label={
              value ? `Выбран период: ${formatDateRangeRu(value.from, value.to)}` : placeholder
            }
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDateRangeRu(value.from, value.to) : placeholder}
            {value && (
              <X
                className="ml-auto h-4 w-4 opacity-70 hover:opacity-100"
                onClick={handleClear}
                aria-label="Очистить период"
              />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-4" align="start" role="dialog">
          {/* Preset buttons */}
          <div className="mb-4">
            <span className="text-sm text-muted-foreground mb-2 block">Быстрый выбор:</span>
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <Button
                  key={preset.days}
                  variant={activePreset?.days === preset.days ? 'default' : 'outline'}
                  size="sm"
                  disabled={preset.days > maxDays}
                  data-active={activePreset?.days === preset.days}
                  onClick={() => handlePresetClick(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Dual calendar view */}
          <div className="flex flex-col md:flex-row gap-4">
            <Calendar
              mode="range"
              selected={value ? { from: value.from, to: value.to } : undefined}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={ru}
              disabled={{
                after: today,
                before: minDate,
              }}
              defaultMonth={value?.from ?? subDays(today, 30)}
              aria-label="Выбор диапазона дат"
            />
          </div>

          {/* Aggregation suggestion */}
          {showAggregationSuggestion && aggregation && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
              <Info className="mr-2 h-4 w-4" />
              Рекомендуемая агрегация: {getAggregationLabel(aggregation)}
            </div>
          )}

          {/* Days count display */}
          {daysInRange > 0 && !isRangeExceeded && (
            <div className="mt-2 text-sm text-muted-foreground">
              Выбрано: {daysInRange} {pluralizeDays(daysInRange)}
            </div>
          )}

          {/* Validation error */}
          {isRangeExceeded && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Диапазон не может превышать {maxDays} {pluralizeDays(maxDays)}. Выбрано:{' '}
                {daysInRange} {pluralizeDays(daysInRange)}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex justify-end gap-2">
            {value && (
              <Button variant="outline" size="sm" onClick={() => onChange(undefined)}>
                Очистить
              </Button>
            )}
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Применить
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* External validation error (shown outside popover when closed) */}
      {!isOpen && isRangeExceeded && (
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
