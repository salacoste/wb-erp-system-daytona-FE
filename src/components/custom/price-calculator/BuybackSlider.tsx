'use client'

import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Controller, type FieldValues, type Control, type Path } from 'react-hook-form'

/**
 * Simple slider for buyback percentage without margin zone indicators
 * Zone labels (Low/Medium/High) don't apply to buyback where 95-100% is normal
 *
 * Story 44.30-FE: UX Polish - Buyback slider should not show margin zones
 * Unlike MarginSlider, this component has no colored zones or labels
 *
 * @example
 * <BuybackSlider
 *   name="buyback_pct"
 *   control={control}
 *   min={10}
 *   max={100}
 *   step={0.5}
 *   unit="%"
 * />
 */
export interface BuybackSliderProps<T extends FieldValues = FieldValues> {
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

export function BuybackSlider<T extends FieldValues = FieldValues>({
  name,
  control,
  min,
  max,
  step,
  unit,
  error,
}: BuybackSliderProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = Number(field.value) || 0

        return (
          <div className="space-y-3">
            {/* Simple slider without zone overlay */}
            <Slider
              min={min}
              max={max}
              step={step}
              value={[value]}
              onValueChange={(values) => field.onChange(values[0])}
              className="w-full"
            />

            {/* Value input */}
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

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
