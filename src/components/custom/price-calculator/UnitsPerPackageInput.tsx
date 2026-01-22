'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldTooltip } from './FieldTooltip'
import type { BoxType } from '@/types/price-calculator'

/**
 * Props for UnitsPerPackageInput component
 * Story 44.38: Units Per Package - Acceptance Cost Division
 */
export interface UnitsPerPackageInputProps {
  /** Current value (1-1000) */
  value: number
  /** Callback when value changes */
  onValueChange: (value: number) => void
  /** Box type for dynamic label */
  boxType: BoxType
  /** Disable the input */
  disabled?: boolean
  /** Error message to display */
  error?: string
}

/**
 * Labels based on box type
 */
const LABELS: Record<BoxType, string> = {
  box: 'Количество штук в коробе',
  pallet: 'Количество штук на паллете',
}

/**
 * Tooltip content explaining the purpose
 */
const TOOLTIP_CONTENT =
  'Укажите сколько штук товара помещается в одну упаковку (короб или паллету). ' +
  'Стоимость приёмки будет разделена на это количество для расчёта себестоимости одной единицы.'

/**
 * Validation constants
 */
const MIN_UNITS = 1
const MAX_UNITS = 1000
const DEFAULT_UNITS = 1

/**
 * Units per package input for FBO fulfillment
 * Story 44.38: Acceptance Cost Division
 *
 * Features:
 * - Number input with min/max validation (1-1000)
 * - Dynamic label based on box type (box/pallet)
 * - Tooltip explaining acceptance cost division
 * - Error state support
 * - Full accessibility support
 *
 * @example
 * <UnitsPerPackageInput
 *   value={unitsPerPackage}
 *   onValueChange={setUnitsPerPackage}
 *   boxType="box"
 *   disabled={disabled}
 * />
 */
export function UnitsPerPackageInput({
  value,
  onValueChange,
  boxType,
  disabled = false,
  error,
}: UnitsPerPackageInputProps) {
  const label = LABELS[boxType]
  const inputId = 'units-per-package'
  const errorId = error ? `${inputId}-error` : undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty input for better UX
    if (inputValue === '') {
      onValueChange(DEFAULT_UNITS)
      return
    }

    // Parse and validate
    const numValue = parseInt(inputValue, 10)

    // Only accept valid integers within range
    if (!isNaN(numValue) && numValue >= MIN_UNITS && numValue <= MAX_UNITS) {
      onValueChange(numValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="flex-1">
          {label}
        </Label>
        <FieldTooltip content={TOOLTIP_CONTENT} />
      </div>

      <Input
        id={inputId}
        type="number"
        min={MIN_UNITS}
        max={MAX_UNITS}
        step={1}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={errorId}
        aria-invalid={!!error}
        className="w-full"
      />

      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Минимум: {MIN_UNITS}, максимум: {MAX_UNITS}
        </p>
      )}
    </div>
  )
}

/**
 * Default value for units per package
 * Exported for use in form defaults
 */
export const UNITS_PER_PACKAGE_DEFAULT = DEFAULT_UNITS
