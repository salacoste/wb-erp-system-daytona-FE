'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { FieldTooltip } from './FieldTooltip'
import { Controller, type FieldValues, type Control, type Path } from 'react-hook-form'

/**
 * Simple slider for buyback percentage without margin zone indicators
 * Zone labels (Low/Medium/High) don't apply to buyback where 95-100% is normal
 *
 * Story 44.30-FE: UX Polish - Buyback slider should not show margin zones
 * Unlike MarginSlider, this component has no colored zones or labels
 *
 * UX Update: Now includes label and tooltip for consistent layout with DrrSlider/SppInput
 * Target structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Label]                     [FieldTooltip]                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [═══════ Slider ═══════]              [Input][%]            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @example
 * <BuybackSlider
 *   name="buyback_pct"
 *   control={control}
 *   min={10}
 *   max={100}
 *   step={0.5}
 *   unit="%"
 *   label="Процент выкупа"
 *   tooltipContent="Доля заказов, которые фактически выкупаются покупателями."
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
  /** Disable the input */
  disabled?: boolean
  /** Label text */
  label?: string
  /** Tooltip content */
  tooltipContent?: string
}

export function BuybackSlider<T extends FieldValues = FieldValues>({
  name,
  control,
  min,
  max,
  step,
  unit,
  error,
  disabled = false,
  label = 'Процент выкупа',
  tooltipContent = 'Доля заказов, которые фактически выкупаются покупателями.',
}: BuybackSliderProps<T>) {
  return (
    <div className="space-y-3" data-testid="buyback-slider-section">
      {/* Label row */}
      <div className="flex items-center gap-2">
        <Label htmlFor={String(name)} className="flex-1">
          {label}
        </Label>
        <FieldTooltip content={tooltipContent} />
      </div>

      {/* Slider + Input row (horizontal) */}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const value = Number(field.value) || 0

          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = parseFloat(e.target.value)
            if (!isNaN(val) && val >= min && val <= max) {
              field.onChange(val)
            } else if (e.target.value === '') {
              field.onChange(min)
            }
          }

          return (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  id={String(name)}
                  value={[value]}
                  onValueChange={([val]) => field.onChange(val)}
                  min={min}
                  max={max}
                  step={step}
                  disabled={disabled}
                  className="w-full"
                  aria-label={label}
                  aria-valuenow={value}
                  aria-valuemin={min}
                  aria-valuemax={max}
                  data-testid="buyback-slider"
                />
              </div>
              <div className="flex items-center gap-1 w-24">
                <Input
                  type="number"
                  value={value}
                  onChange={handleInputChange}
                  min={min}
                  max={max}
                  step={step}
                  disabled={disabled}
                  className="w-20 text-center"
                  aria-label={`${label} в процентах`}
                  data-testid="buyback-input"
                />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
            </div>
          )
        }}
      />

      {error && (
        <p className="text-sm text-destructive" role="alert" data-testid="buyback-error">
          {error}
        </p>
      )}
    </div>
  )
}
