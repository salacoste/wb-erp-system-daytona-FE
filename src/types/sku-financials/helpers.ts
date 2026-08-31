/**
 * SKU Financials Helper Functions
 * Split from sku-financials.ts for file size compliance
 */

import type { ProfitabilityStatus, SkuFinancialCosts } from './core'
import { PROFITABILITY_COLORS, PROFITABILITY_LABELS } from './core'

/**
 * Get CSS classes for profitability status badge
 */
export function getProfitabilityBadgeClass(status: ProfitabilityStatus): string {
  return PROFITABILITY_COLORS[status]
}

/**
 * Get Russian label for profitability status
 */
export function getProfitabilityLabel(status: ProfitabilityStatus): string {
  return PROFITABILITY_LABELS[status]
}

/**
 * Calculate total operating expenses
 * Request #68: Now includes otherAdjustments
 */
export function getTotalOperatingExpenses(costs: SkuFinancialCosts): number {
  return (
    costs.logistics +
    costs.storage +
    costs.penalties +
    costs.paidAcceptance +
    costs.otherAdjustments
  )
}
