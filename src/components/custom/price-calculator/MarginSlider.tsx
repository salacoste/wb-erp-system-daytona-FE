'use client'

import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Controller } from 'react-hook-form'
import type { UseFormRegister, Control } from 'react-hook-form'

/**
 * Props for MarginSlider component
 */
export interface MarginSliderProps {
  /** Form field name for react-hook-form registration */
  name: string
  /** react-hook-form control object */
  control: Control<any>
  /** react-hook-form register function */
  register: UseFormRegister<any>
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
 * Combined slider + number input component
 * Uses react-hook-form Controller for bidirectional sync
 *
 * @example
 * <MarginSlider
 *   name="target_margin_pct"
 *   control={control}
 *   register={register}
 *   min={0}
 *   max={50}
 *   step={0.5}
 *   unit="%"
 * />
 */
export function MarginSlider({
  name,
  control,
  register,
  min,
  max,
  step,
  unit,
  error,
}: MarginSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 relative">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Slider
              min={min}
              max={max}
              step={step}
              value={[Number(field.value) || 0]}
              onValueChange={(values) => {
                field.onChange(values[0])
                control.setValue(name, values[0], { shouldValidate: false })
              }}
              className="w-full"
              style={{
                // Red slider with dark track for better visibility
                '--tw-bg-opacity': '1',
                '--tw-ring-opacity': '1',
                '--tw-ring-offset-width': '2px',
                '--tw-ring-offset-color': 'rgb(239 68 68)', // red-500
                '--tw-slider-track-primary': 'rgb(220 38 38)', // red-600
              }}
            />
          )}
        />
      </div>
      <div className="flex items-center gap-2 w-28">
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          className="w-20 text-right"
          {...register(name)}
        />
        <span className="text-sm text-muted-foreground w-6">{unit}</span>
      </div>
      {error && (
        <p className="text-sm text-destructive text-xs">{error}</p>
      )}
    </div>
  )
}
