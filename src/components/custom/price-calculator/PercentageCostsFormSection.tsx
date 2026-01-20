'use client'

import { Label } from '@/components/ui/label'
import { FieldTooltip } from './FieldTooltip'
import { MarginSlider } from './MarginSlider'
import { DrrSlider } from './DrrSlider'
import { SppInput } from './SppInput'
import type { UseFormRegister, Control, FieldValues, Path } from 'react-hook-form'

/**
 * Props for PercentageCostsFormSection component
 * Uses generic T to accept any form data type that includes the required fields
 */
export interface PercentageCostsFormSectionProps<T extends FieldValues> {
  /** React Hook Form register function */
  register: UseFormRegister<T>
  /** React Hook Form control for controlled components */
  control: Control<T>
  /** Current buyback percentage value */
  buybackValue: number
  /** Current DRR percentage value */
  drrValue: number
  /** Current SPP percentage value */
  sppValue: number
  /** Callback when DRR value changes */
  onDrrChange: (value: number) => void
  /** Callback when SPP value changes */
  onSppChange: (value: number) => void
  /** Disable all inputs */
  disabled?: boolean
}

/**
 * Percentage-based costs input section for price calculator
 * Includes: Buyback %, DRR (advertising), SPP
 *
 * Story 44.2-FE: Input Form Component
 * Story 44.18-FE: DRR Input
 * Story 44.19-FE: SPP Display
 */
export function PercentageCostsFormSection<T extends FieldValues>({
  register,
  control,
  drrValue,
  sppValue,
  onDrrChange,
  onSppChange,
  disabled = false,
}: PercentageCostsFormSectionProps<T>) {
  // Cast field name to Path<T> for type safety with generic forms
  const buybackField = 'buyback_pct' as Path<T>

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Процентные затраты (%)
      </h3>

      <div className="space-y-4">
        {/* Buyback % */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="buyback_pct" className="flex-1">
              Процент выкупа
            </Label>
            <FieldTooltip content="Доля заказов, которые фактически выкупаются покупателями. При 98% выкупе из 100 заказов 2 будут возвращены. Влияет на расчёт логистики возврата. Средний показатель по WB: 95-98%." />
          </div>
          <MarginSlider
            name={buybackField}
            register={register}
            control={control}
            min={10}
            max={100}
            step={0.5}
            unit="%"
          />
        </div>

        {/* DRR Slider - Story 44.18 */}
        <DrrSlider
          value={drrValue}
          onChange={onDrrChange}
          disabled={disabled}
        />

        {/* SPP Input - Story 44.19 */}
        <SppInput
          value={sppValue}
          onChange={onSppChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
