'use client'

// ============================================================================
// Tariff Field Input Component
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Reusable input component for tariff numeric fields
// ============================================================================

import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { UseFormRegisterReturn, FieldError } from 'react-hook-form'

export interface TariffFieldInputProps {
  /** Label text (Russian) */
  label: string
  /** Unit suffix (₽, %, дней, etc.) */
  unit?: string
  /** Register return from react-hook-form */
  register: UseFormRegisterReturn
  /** Field error from formState.errors */
  error?: FieldError
  /** Step value for number input (0.01 for rates, 1 for integers) */
  step?: number
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Additional className for container */
  className?: string
  /** Help text below input */
  helpText?: string
}

/**
 * Reusable numeric input for tariff settings form
 *
 * Features:
 * - Accessible label linked to input
 * - Unit suffix display (₽, %, дней)
 * - Inline validation error display
 * - Configurable step, min, max
 *
 * @example
 * ```tsx
 * <TariffFieldInput
 *   label="Тариф приёмки"
 *   unit="₽/литр"
 *   register={register('acceptanceBoxRatePerLiter', { valueAsNumber: true })}
 *   error={errors.acceptanceBoxRatePerLiter}
 *   step={0.01}
 *   min={0}
 * />
 * ```
 */
export function TariffFieldInput({
  label,
  unit,
  register,
  error,
  step = 0.01,
  min,
  max,
  placeholder,
  disabled = false,
  className,
  helpText,
}: TariffFieldInputProps) {
  const id = useId()
  const inputId = `tariff-${id}`
  const errorId = `tariff-error-${id}`

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={inputId}
        className={cn('text-sm font-medium', error && 'text-destructive')}
      >
        {label}
        {unit && <span className="text-muted-foreground ml-1">({unit})</span>}
      </Label>

      <div className="relative">
        <Input
          id={inputId}
          type="number"
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          {...register}
        />
      </div>

      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      )}

      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
}
