'use client'

import { Input } from '@/components/ui/input'
import { FixedCostField } from './FixedCostField'
import { numericFieldOptions } from '@/lib/form-utils'
import type { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form'

export interface FixedCostLogisticsFieldProps<T extends FieldValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  disabled: boolean
  /** Field config */
  id: string
  label: string
  tooltipContent: string
  fieldPath: Path<T>
  /** Auto-fill calculation value for badge/display; input stays registered/uncontrolled. */
  controlledValue?: number
  isAutoFilled?: boolean
  onControlledChange?: (value: number) => void
}

/**
 * Logistics input field with optional auto-fill badge/calculated display.
 * Extracted from FixedCostsSection for file size compliance (Story 74.8)
 */
export function FixedCostLogisticsField<T extends FieldValues>({
  register,
  errors,
  disabled,
  id,
  label,
  tooltipContent,
  fieldPath,
  controlledValue,
  isAutoFilled = false,
  onControlledChange,
}: FixedCostLogisticsFieldProps<T>) {
  const isAutoFillCalculated = controlledValue !== undefined
  const errorMessage = (errors[id as keyof typeof errors] as { message?: string })?.message
  const registration = register(
    fieldPath,
    numericFieldOptions({
      required: 'Обязательное поле',
      min: { value: 0, message: 'Не может быть отрицательным' },
    })
  )

  return (
    <FixedCostField
      id={id}
      label={label}
      tooltipContent={tooltipContent}
      showBadge={isAutoFilled}
      showCalculated={isAutoFillCalculated && (controlledValue ?? 0) > 0}
      calculatedValue={controlledValue}
      error={errorMessage}
    >
      <Input
        id={id}
        type="number"
        step="0.01"
        min={0}
        placeholder="0,00"
        disabled={disabled}
        {...registration}
        onChange={event => {
          registration.onChange(event)
          const value = parseFloat(event.target.value) || 0
          onControlledChange?.(value)
        }}
      />
    </FixedCostField>
  )
}
