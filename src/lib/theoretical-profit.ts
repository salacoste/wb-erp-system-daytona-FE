/**
 * Theoretical Profit Calculation
 * Story 61.10-FE: Theoretical Profit Calculation
 * Epic 61-FE: Dashboard Data Integration
 *
 * Business Formula:
 * Теор. прибыль = Выкупы - COGS - рекламные затраты - логистика - хранение
 *
 * Uses SALES (Выкупы / wb_sales_gross) as the revenue base, NOT orders.
 * This represents actual realized profit from completed sales.
 *
 * NOTE: Changed from Orders to Sales per QA report 128-DASHBOARD-QA-VERIFICATION.
 * Orders FBS may be 0 if sync started recently, but Sales data is always available.
 *
 * @see docs/stories/epic-61/story-61.10-fe-theoretical-profit.md
 * @see docs/request-backend/128-DASHBOARD-QA-VERIFICATION-REPORT.md
 */

/**
 * Input for theoretical profit calculation
 * Business: Выкупы, COGS, реклама, логистика, хранение
 */
export interface TheoreticalProfitInput {
  /** Total sales amount (Выкупы / wb_sales_gross) - actual revenue */
  salesAmount: number | null
  /** Cost of Goods Sold for sales (COGS по выкупам) */
  cogs: number | null
  /** Total advertising spend (Рекламные затраты) */
  advertisingSpend: number | null
  /** Logistics costs (Логистика) */
  logisticsCost: number | null
  /** Storage costs (Хранение) */
  storageCost: number | null
}

/**
 * Breakdown of all cost components in the calculation
 */
export interface TheoreticalProfitBreakdown {
  sales: number
  cogs: number
  advertising: number
  logistics: number
  storage: number
}

/**
 * Result of theoretical profit calculation
 */
export interface TheoreticalProfitResult {
  /** Calculated theoretical profit value */
  value: number
  /** Breakdown of all components */
  breakdown: TheoreticalProfitBreakdown
  /** True if all input values were present (non-null) */
  isComplete: boolean
  /** List of missing fields if any */
  missingFields: string[]
}

/**
 * Calculate theoretical profit based on business formula
 *
 * Formula: Выкупы - COGS - реклама - логистика - хранение
 *
 * @param input - All required cost components
 * @returns Profit value with breakdown and completeness indicator
 *
 * @example
 * const result = calculateTheoreticalProfit({
 *   salesAmount: 84377,
 *   cogs: 35818,
 *   advertisingSpend: 3728,
 *   logisticsCost: 17566,
 *   storageCost: 2024,
 * });
 * // result.value = 25241 (profit)
 * // result.isComplete = true
 */
export function calculateTheoreticalProfit(input: TheoreticalProfitInput): TheoreticalProfitResult {
  const missingFields: string[] = []

  // Check for missing values (null or undefined)
  if (input.salesAmount === null || input.salesAmount === undefined) {
    missingFields.push('salesAmount')
  }
  if (input.cogs === null || input.cogs === undefined) {
    missingFields.push('cogs')
  }
  if (input.advertisingSpend === null || input.advertisingSpend === undefined) {
    missingFields.push('advertisingSpend')
  }
  if (input.logisticsCost === null || input.logisticsCost === undefined) {
    missingFields.push('logisticsCost')
  }
  if (input.storageCost === null || input.storageCost === undefined) {
    missingFields.push('storageCost')
  }

  // Use 0 for null/undefined values in calculation
  const sales = input.salesAmount ?? 0
  const cogs = input.cogs ?? 0
  const advertising = input.advertisingSpend ?? 0
  const logistics = input.logisticsCost ?? 0
  const storage = input.storageCost ?? 0

  // Calculate: Sales - COGS - Advertising - Logistics - Storage
  const value = sales - cogs - advertising - logistics - storage

  return {
    value,
    breakdown: {
      sales,
      cogs,
      advertising,
      logistics,
      storage,
    },
    isComplete: missingFields.length === 0,
    missingFields,
  }
}

/**
 * Calculate theoretical profit margin percentage
 *
 * @param profitValue - Calculated profit
 * @param salesAmount - Total sales amount (base)
 * @returns Margin percentage (0-100) or null if sales is 0
 *
 * @example
 * calculateTheoreticalMarginPct(25241, 84377) // returns ~30
 * calculateTheoreticalMarginPct(-25000, 100000) // returns -25
 * calculateTheoreticalMarginPct(1000, 0)        // returns null
 */
export function calculateTheoreticalMarginPct(
  profitValue: number,
  salesAmount: number
): number | null {
  if (salesAmount === 0) return null
  return (profitValue / salesAmount) * 100
}
