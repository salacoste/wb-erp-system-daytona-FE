/**
 * DateRangePickerExtended popover content
 * Extracted from DateRangePickerExtended.tsx for file size compliance
 * Story 51.3-FE: Extended Date Range Picker Component
 */

'use client'

import { Info, AlertCircle } from 'lucide-react'
import { ru } from 'date-fns/locale'
import { subDays } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSmartAggregation, getAggregationLabel, pluralizeDays } from '@/lib/date-range-utils'
import type { DateRangePreset } from '@/types/date-range'

interface PopoverBodyProps {
  value?: { from: Date; to: Date }
  presets: DateRangePreset[]
  activePreset?: DateRangePreset
  maxDays: number
  daysInRange: number
  isRangeExceeded: boolean
  showAggregationSuggestion: boolean
  onPresetClick: (days: number) => void
  onCalendarSelect: (range: { from?: Date; to?: Date } | undefined) => void
  onClear: () => void
  onClose: () => void
}

export function PopoverBody({
  value,
  presets,
  activePreset,
  maxDays,
  daysInRange,
  isRangeExceeded,
  showAggregationSuggestion,
  onPresetClick,
  onCalendarSelect,
  onClear,
  onClose,
}: PopoverBodyProps) {
  const today = new Date()
  const minDate = subDays(today, maxDays)
  const aggregation = daysInRange > 0 ? getSmartAggregation(daysInRange) : null

  return (
    <>
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
              onClick={() => onPresetClick(preset.days)}
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
          onSelect={onCalendarSelect}
          numberOfMonths={2}
          locale={ru}
          className="[--cell-size:2.5rem]"
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
            Диапазон не может превышать {maxDays} {pluralizeDays(maxDays)}. Выбрано: {daysInRange}{' '}
            {pluralizeDays(daysInRange)}
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex justify-end gap-2">
        {value && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Очистить
          </Button>
        )}
        <Button size="sm" onClick={onClose}>
          Применить
        </Button>
      </div>
    </>
  )
}
