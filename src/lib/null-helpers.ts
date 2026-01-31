/**
 * Null Helpers - Utility functions for null/undefined handling
 * Story: null vs undefined Standardization
 *
 * Standard: Use `null` for missing data, NOT `undefined`.
 *
 * These utilities help maintain consistency across the codebase.
 *
 * @see CLAUDE.md - Business Logic section
 */

/**
 * Checks if a value is nullish (null or undefined).
 *
 * Unlike falsy checks, this returns false for:
 * - 0 (zero is a valid value)
 * - '' (empty string is a valid value)
 * - false (boolean false is a valid value)
 * - NaN (use Number.isNaN() to check for NaN)
 *
 * @param value - The value to check
 * @returns true if value is null or undefined, false otherwise
 *
 * @example
 * isNullish(null)      // true
 * isNullish(undefined) // true
 * isNullish(0)         // false
 * isNullish('')        // false
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Coerces undefined to null, preserving all other values.
 *
 * Use this to normalize API responses and ensure consistency
 * when storing or passing data that may be undefined.
 *
 * @param value - The value to coerce
 * @returns null if value is undefined, otherwise the original value
 *
 * @example
 * coerceToNull(undefined)  // null
 * coerceToNull(null)       // null
 * coerceToNull(0)          // 0
 * coerceToNull('')         // ''
 * coerceToNull(42)         // 42
 */
export function coerceToNull<T>(value: T | undefined | null): T | null {
  return value === undefined ? null : value
}

/**
 * Strictly checks if a value is null (not undefined).
 *
 * Use this when you need to distinguish between null and undefined.
 *
 * @param value - The value to check
 * @returns true only if value is exactly null
 *
 * @example
 * isStrictlyNull(null)      // true
 * isStrictlyNull(undefined) // false
 * isStrictlyNull(0)         // false
 */
export function isStrictlyNull(value: unknown): value is null {
  return value === null
}

/**
 * Asserts that a value is not undefined.
 *
 * Use this during development/testing to catch places where
 * undefined is being used instead of null.
 *
 * @param value - The value to check
 * @param fieldName - Name of the field (for error messages)
 * @throws Error if value is undefined
 *
 * @example
 * assertNullNotUndefined(data.ordersAmount, 'ordersAmount')
 * // Throws: "Field 'ordersAmount' is undefined. Use null for missing values."
 */
export function assertNullNotUndefined(value: unknown, fieldName: string): void {
  if (value === undefined) {
    throw new Error(
      `Field '${fieldName}' is undefined. Use null for missing values instead of undefined.`
    )
  }
}

/**
 * Type guard that narrows a nullable value to its non-null type.
 *
 * @param value - The value to check
 * @returns true if value is not null and not undefined
 *
 * @example
 * const value: number | null = getData()
 * if (hasValue(value)) {
 *   // value is number here
 *   console.log(value.toFixed(2))
 * }
 */
export function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Safely accesses a nested property, returning null if any part is nullish.
 *
 * @param fn - Function that accesses the property
 * @returns The property value or null
 *
 * @example
 * const spend = nullSafe(() => data.summary.total_spend)
 * // Returns number or null, never undefined
 */
export function nullSafe<T>(fn: () => T | undefined): T | null {
  try {
    const result = fn()
    return result === undefined ? null : result
  } catch {
    return null
  }
}
