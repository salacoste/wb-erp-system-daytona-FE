/**
 * Acceptance Cost Formula Formatters and Helpers
 * Story 44.XX-FE: Acceptance Cost Calculation
 * Story 44.42-FE: Updated to use BoxTypeId
 *
 * Extracted from acceptance-cost-utils.ts for file size compliance.
 * Contains formula formatting, zero result creation, and rounding helpers.
 *
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

import { formatCurrency } from '@/lib/utils'

/** Result of acceptance cost calculation (local definition to avoid circular import) */
interface AcceptanceCostResultShape {
  totalCost: number
  perUnitCost: number
  formula: string
}

/**
 * Format box calculation formula for display
 * Example: "5,00 л x 1,70 rub/л x 1,20 = 10,20 rub"
 */
export function formatBoxFormula(
  volume: number,
  rate: number,
  coefficient: number,
  total: number
): string {
  const volumeStr = volume.toFixed(2).replace('.', ',')
  const rateStr = rate.toFixed(2).replace('.', ',')
  const coeffStr = coefficient.toFixed(2).replace('.', ',')
  const totalStr = formatCurrency(total)

  return `${volumeStr} л × ${rateStr} ₽/л × ${coeffStr} = ${totalStr}`
}

/**
 * Format pallet calculation formula for display
 * Example: "500,00 rub x 1,00 = 500,00 rub"
 */
export function formatPalletFormula(rate: number, coefficient: number, total: number): string {
  const rateStr = rate.toFixed(2).replace('.', ',')
  const coeffStr = coefficient.toFixed(2).replace('.', ',')
  const totalStr = formatCurrency(total)

  return `${rateStr} ₽ × ${coeffStr} = ${totalStr}`
}

/**
 * Create zero result for invalid inputs
 */
export function createZeroResult(): AcceptanceCostResultShape {
  return {
    totalCost: 0,
    perUnitCost: 0,
    formula: '—',
  }
}

/**
 * Round number to 2 decimal places
 */
export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Format per-unit cost for display with units label
 *
 * @param perUnitCost - Cost per unit in rubles
 * @param unitsPerPackage - Number of units for context
 * @returns Formatted string like "1,02 rub/шт"
 */
export function formatPerUnitCost(perUnitCost: number, unitsPerPackage: number): string {
  if (unitsPerPackage <= 0) {
    return '—'
  }
  return `${formatCurrency(perUnitCost)}/шт`
}
