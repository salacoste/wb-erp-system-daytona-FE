/**
 * Comparison Period Picker Component
 * Story 51.7-FE: Period Comparison UI
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Period picker with MoM, QoQ, YoY presets for period comparison.
 */

'use client'

import { useMemo, useCallback } from 'react'
import { CalendarDays } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  type PeriodRange,
  type ComparisonPreset,
  COMPARISON_PRESETS,
  formatDateRangeRu,
  calculatePresetPeriods,
} from './period-comparison-helpers'

// Re-export types for convenience
export type { PeriodRange, ComparisonPreset }
export { formatDateRangeRu, calculatePresetPeriods }

/** Props for ComparisonPeriodPicker */
export interface ComparisonPeriodPickerProps {
  period1: PeriodRange
  period2: PeriodRange
  preset: ComparisonPreset
  onPeriod1Change: (period: PeriodRange) => void
  onPeriod2Change: (period: PeriodRange) => void
  onPresetChange: (preset: ComparisonPreset) => void
  disabled?: boolean
  className?: string
}

/**
 * ComparisonPeriodPicker - Period selector with presets (MoM, QoQ, YoY)
 */
export function ComparisonPeriodPicker({
  period1,
  period2,
  preset,
  onPeriod1Change,
  onPeriod2Change,
  onPresetChange,
  disabled = false,
  className,
}: ComparisonPeriodPickerProps) {
  const handlePresetClick = useCallback(
    (newPreset: ComparisonPreset) => {
      onPresetChange(newPreset)
      if (newPreset !== 'custom') {
        const periods = calculatePresetPeriods(newPreset)
        onPeriod1Change(periods.period1)
        onPeriod2Change(periods.period2)
      }
    },
    [onPresetChange, onPeriod1Change, onPeriod2Change]
  )

  const period1Label = useMemo(() => formatDateRangeRu(period1.from, period1.to), [period1])
  const period2Label = useMemo(() => formatDateRangeRu(period2.from, period2.to), [period2])

  const isCustom = preset === 'custom'

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-2">
        {COMPARISON_PRESETS.map(p => (
          <Button
            key={p.value}
            variant={preset === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(p.value)}
            disabled={disabled}
            title={p.label}
          >
            {p.shortLabel}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Период 1: {period1Label}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={period1.from}
              onChange={e => onPeriod1Change({ ...period1, from: e.target.value })}
              disabled={disabled || !isCustom}
              className="text-sm"
            />
            <Input
              type="date"
              value={period1.to}
              onChange={e => onPeriod1Change({ ...period1, to: e.target.value })}
              disabled={disabled || !isCustom}
              className="text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Период 2: {period2Label}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={period2.from}
              onChange={e => onPeriod2Change({ ...period2, from: e.target.value })}
              disabled={disabled || !isCustom}
              className="text-sm"
            />
            <Input
              type="date"
              value={period2.to}
              onChange={e => onPeriod2Change({ ...period2, to: e.target.value })}
              disabled={disabled || !isCustom}
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
