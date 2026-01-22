'use client'

import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Controller, type FieldValues, type Control, type Path } from 'react-hook-form'
import { cn } from '@/lib/utils'

/**
 * Margin zone configuration
 * Story 44.24-FE: Visual zone indicators
 */
const MARGIN_ZONES = {
  low: { min: 0, max: 10, label: 'Низкая' },
  medium: { min: 10, max: 25, label: 'Средняя' },
  high: { min: 25, max: 100, label: 'Высокая' },
} as const

type ZoneKey = keyof typeof MARGIN_ZONES

/**
 * Get zone key based on margin value
 */
function getMarginZone(value: number): ZoneKey {
  if (value < 10) return 'low'
  if (value < 25) return 'medium'
  return 'high'
}

/**
 * Badge styles by zone
 */
const badgeStyles: Record<ZoneKey, string> = {
  low: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-green-100 text-green-700 border-green-200',
}

/**
 * Props for MarginSlider component
 * Uses generic T to accept any form data type
 */
export interface MarginSliderProps<T extends FieldValues = FieldValues> {
  /** Form field name for react-hook-form registration */
  name: Path<T>
  /** react-hook-form control object */
  control: Control<T>
  /** Minimum slider value */
  min: number
  /** Maximum slider value */
  max: number
  /** Slider step increment */
  step: number
  /** Unit suffix to display */
  unit: string
  /** Error message to display */
  error?: string
}

/**
 * Enhanced margin slider with visual zones
 * Story 44.24-FE: Visual zone indicators (low/medium/high)
 *
 * @example
 * <MarginSlider
 *   name="target_margin_pct"
 *   control={control}
 *   min={0}
 *   max={50}
 *   step={0.5}
 *   unit="%"
 * />
 */
export function MarginSlider<T extends FieldValues = FieldValues>({
  name,
  control,
  min,
  max,
  step,
  unit,
  error,
}: MarginSliderProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = Number(field.value) || 0
        const zone = getMarginZone(value)
        const zoneConfig = MARGIN_ZONES[zone]

        return (
          <div className="space-y-3">
            {/* Slider with zone overlay */}
            <div className="relative pt-1">
              {/* Zone background overlay - visual indicator of margin zones */}
              <div className="absolute inset-x-0 top-1 h-2 rounded-full overflow-hidden flex pointer-events-none">
                <div className="bg-red-100 w-[20%]" />
                <div className="bg-yellow-100 w-[30%]" />
                <div className="bg-green-100 flex-1" />
              </div>

              {/* Slider component */}
              <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(values) => field.onChange(values[0])}
                className="w-full relative z-10"
              />
            </div>

            {/* Zone labels */}
            <div className="flex justify-between text-xs px-1">
              <span className="text-red-600">Низкая</span>
              <span className="text-yellow-600">Средняя</span>
              <span className="text-green-600">Высокая</span>
            </div>

            {/* Value input with colored badge */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'px-3 py-1.5 rounded-md border shadow-sm text-sm font-medium',
                  badgeStyles[zone]
                )}
              >
                {zoneConfig.label}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step={step}
                  min={min}
                  max={max}
                  value={value}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value)
                    field.onChange(isNaN(num) ? 0 : num)
                  }}
                  className="w-20 text-right"
                />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
      }}
    />
  )
}
