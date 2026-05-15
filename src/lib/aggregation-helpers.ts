/**
 * Aggregation helpers for null-preserving reduce/fold operations.
 *
 * @see CLAUDE-PATTERNS.md § Anti-Pattern #8 Exceptions — Pattern: AGGREGATION-REDUCE
 *
 * Story 107.1-FE: extracted from Story 106.1-FE's inline reducer pattern in
 * src/components/custom/dashboard/table-columns.ts.
 */

/**
 * Reducer that preserves null when ALL reduced items are null ("all unknown"),
 * collapses to number when ANY item is real.
 *
 * Use case: `Array.reduce((acc, item) => nullPreservingSum(acc, item.value), null as number | null)`.
 * When all `item.value` are null, the final acc stays null (renders "—" in UI).
 * Once any `item.value` is a number, subsequent reduce iterations sum normally.
 *
 * @param acc Current accumulator value
 * @param value Current item's value
 * @returns null only when BOTH inputs are null; otherwise sum (treating null as 0)
 */
export function nullPreservingSum(acc: number | null, value: number | null): number | null {
  if (acc === null && value === null) return null
  return (acc ?? 0) + (value ?? 0)
}
