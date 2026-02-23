/**
 * @deprecated Epic 66-FE: Tax calculations now performed by backend.
 * Use TaxMetrics from finance-summary API response instead.
 * This file retained for backward compatibility during migration.
 *
 * Tax Calculation Helpers for Story 65.11: Tax Estimate
 *
 * Tax formulas (from backend-gap-analysis.md Section 4):
 * - USN 6%:  sale_gross_total * 0.06
 * - USN 15%: MAX((income - expenses) * 0.15, income * 0.01)
 * - Manual:  user-entered value
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

export type TaxSystem = 'usn6' | 'usn15' | 'manual'

export interface TaxExpenses {
  logisticsCostTotal?: number
  storageCostTotal?: number
  paidAcceptanceCostTotal?: number
  penaltiesTotal?: number
  otherAdjustmentsNetTotal?: number
  cogsTotal?: number
  advertisingSpend?: number
}

/** Sum all expense components, treating undefined as 0 */
function sumExpenses(expenses: TaxExpenses): number {
  return (
    (expenses.logisticsCostTotal ?? 0) +
    (expenses.storageCostTotal ?? 0) +
    (expenses.paidAcceptanceCostTotal ?? 0) +
    (expenses.penaltiesTotal ?? 0) +
    (expenses.otherAdjustmentsNetTotal ?? 0) +
    (expenses.cogsTotal ?? 0) +
    (expenses.advertisingSpend ?? 0)
  )
}

/**
 * Calculate tax amount based on the selected tax system
 * Returns null if income is null (data unavailable)
 */
export function calculateTax(
  taxSystem: TaxSystem | null,
  saleGrossTotal: number | null,
  expenses: TaxExpenses,
  manualTaxAmount?: number
): number | null {
  if (taxSystem === null || saleGrossTotal === null) return null

  switch (taxSystem) {
    case 'usn6':
      return saleGrossTotal * 0.06

    case 'usn15': {
      const totalExpenses = sumExpenses(expenses)
      const taxBase = saleGrossTotal - totalExpenses
      const calculatedTax = taxBase * 0.15
      const minimumTax = saleGrossTotal * 0.01
      return Math.max(calculatedTax, minimumTax)
    }

    case 'manual':
      return manualTaxAmount ?? null

    default:
      return null
  }
}

/** Tax as percentage of revenue */
export function calculateTaxPct(
  taxAmount: number | null,
  saleGrossTotal: number | null
): number | null {
  if (taxAmount == null || saleGrossTotal == null || saleGrossTotal === 0) return null
  return (taxAmount / saleGrossTotal) * 100
}

/** Human-readable label for tax system */
export function getTaxSystemLabel(system: TaxSystem): string {
  switch (system) {
    case 'usn6':
      return 'УСН 6%'
    case 'usn15':
      return 'УСН 15%'
    case 'manual':
      return 'Manual'
  }
}

/** All selectable tax systems */
export const TAX_SYSTEMS: TaxSystem[] = ['usn6', 'usn15', 'manual']
