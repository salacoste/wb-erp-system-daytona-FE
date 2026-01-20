'use client'

import { Label } from '@/components/ui/label'
import { MarginSlider } from './MarginSlider'
import { FieldTooltip } from './FieldTooltip'
import type { UseFormRegister, Control, FieldValues, Path } from 'react-hook-form'

/**
 * Props for TargetMarginSection component
 * Uses generic T to accept any form data type
 */
export interface TargetMarginSectionProps<T extends FieldValues> {
  /** React Hook Form register function */
  register: UseFormRegister<T>
  /** React Hook Form control for controlled components */
  control: Control<T>
  /** Error message for margin field */
  error?: string
}

/**
 * Target margin input section for price calculator
 * Allows user to set desired profit margin percentage
 *
 * Story 44.2-FE: Input Form Component
 */
export function TargetMarginSection<T extends FieldValues>({
  register,
  control,
  error,
}: TargetMarginSectionProps<T>) {
  const marginField = 'target_margin_pct' as Path<T>

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="target_margin_pct" className="flex-1">
          Целевая маржа %
        </Label>
        <FieldTooltip content="Желаемый процент прибыли от цены продажи. Например, при марже 20% и цене 1000₽ ваша прибыль составит 200₽ после вычета всех затрат. Рекомендуемый диапазон: 15-30%." />
      </div>
      <MarginSlider
        name={marginField}
        register={register}
        control={control}
        min={0}
        max={50}
        step={0.5}
        unit="%"
        error={error}
      />
    </div>
  )
}
