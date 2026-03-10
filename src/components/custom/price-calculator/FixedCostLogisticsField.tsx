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
  /** Controlled mode (auto-fill) */
  controlledValue?: number
  isAutoFilled?: boolean
  onControlledChange?: (value: number) => void
}

/**
 * Logistics input field with controlled/uncontrolled dual mode
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
  const isControlled = controlledValue !== undefined
  const errorMessage = (errors[id as keyof typeof errors] as { message?: string })?.message

  return (
    <FixedCostField
      id={id}
      label={label}
      tooltipContent={tooltipContent}
      showBadge={isAutoFilled}
      showCalculated={isControlled && (controlledValue ?? 0) > 0}
      calculatedValue={controlledValue}
      error={errorMessage}
    >
      {isControlled ? (
        <Input
          id={id}
          type="number"
          step="0.01"
          min={0}
          placeholder="0,00"
          disabled={disabled}
          value={controlledValue ?? ''}
          onChange={e => {
            const value = parseFloat(e.target.value) || 0
            onControlledChange?.(value)
          }}
        />
      ) : (
        <Input
          id={id}
          type="number"
          step="0.01"
          min={0}
          placeholder="0,00"
          disabled={disabled}
          {...register(
            fieldPath,
            numericFieldOptions({
              required: 'Обязательное поле',
              min: { value: 0, message: 'Не может быть отрицательным' },
            })
          )}
        />
      )}
    </FixedCostField>
  )
}
