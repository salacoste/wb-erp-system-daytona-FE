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
  min,
  max,
  step,
  unit,
  error,
}: MarginSliderProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = Number(field.value) || 0

        return (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Slider
                min={min}
                max={max}
                step={step}
                value={[value]}
                onValueChange={(values) => {
                  field.onChange(values[0])
                }}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 w-28">
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
              <span className="text-sm text-muted-foreground w-6">{unit}</span>
            </div>
            {error && <p className="text-sm text-destructive text-xs">{error}</p>}
          </div>
        )
      }}
    />
  )
}
