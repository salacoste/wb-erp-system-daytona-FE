/**
 * Form utility functions for react-hook-form
 * Story 44.27-FE: Bug Fix - Empty Field Handling in Price Calculator
 *
 * Problem: `valueAsNumber: true` returns NaN when input is empty string ""
 * Solution: Use setValueAs to convert empty/NaN values to 0
 */

import type { RegisterOptions, FieldValues, Path } from 'react-hook-form'

/**
 * Transform function that converts empty/invalid values to 0
 * Used as setValueAs option in register()
 */
export function parseNumericValue(value: string | number | null | undefined): number {
  // Handle null, undefined, or empty string
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  // If already a number, check for NaN
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value
  }

  // Parse string to number
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

/**
 * Create register options for numeric fields that handle empty values gracefully.
 * Converts empty string, null, undefined, or NaN to 0.
 *
 * @param options - Additional RegisterOptions to merge (min, max, required, onChange, etc.)
 * @returns RegisterOptions with valueAsNumber and setValueAs configured
 *
 * @example
 * // Basic usage
 * {...register('cogs_rub', numericFieldOptions())}
 *
 * @example
 * // With validation
 * {...register('cogs_rub', numericFieldOptions({
 *   required: 'Себестоимость обязательна',
 *   min: { value: 0, message: 'Не может быть отрицательной' },
 * }))}
 *
 * @example
 * // With onChange callback
 * {...register('length_cm', numericFieldOptions({
 *   min: { value: 0, message: 'Мин. 0 см' },
 *   max: { value: 300, message: 'Макс. 300 см' },
 *   onChange: onDimensionChange,
 * }))}
 */
export function numericFieldOptions<T extends FieldValues>(
  options?: Omit<RegisterOptions<T, Path<T>>, 'valueAsNumber' | 'setValueAs'>
): RegisterOptions<T, Path<T>> {
  return {
    valueAsNumber: true,
    setValueAs: parseNumericValue,
    ...options,
  } as RegisterOptions<T, Path<T>>
}
