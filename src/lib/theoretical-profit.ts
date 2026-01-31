/**
 * Theoretical Profit Calculation
 * Story 61.10-FE: Theoretical Profit Calculation
 * Epic 61-FE: Dashboard Data Integration
 *
 * Business Formula:
 * Теор. прибыль = Заказы - COGS - рекламные затраты - логистика - хранение
 *
 * This represents POTENTIAL profit from all orders (not just sales),
 * accounting for all major operational costs.
 *
 * KEY DIFFERENCE from Gross Profit:
 * - Gross Profit = revenue - COGS (margin on actual sales)
 * - Theoretical Profit = orders - COGS - ads - logistics - storage
 *
 * @see docs/stories/epic-61/story-61.10-fe-theoretical-profit.md
 */

/**
 * Input for theoretical profit calculation
 * Business: Заказы, COGS, реклама, логистика, хранение
 */
export interface TheoreticalProfitInput {
  /** Total order amount (Заказы) - potential revenue */
  ordersAmount: number | null
  /** Cost of Goods Sold for orders (COGS по заказам) */
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
  orders: number
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
 * Formula: Заказы - COGS - реклама - логистика - хранение
 *
 * @param input - All required cost components
 * @returns Profit value with breakdown and completeness indicator
 *
 * @example
 * const result = calculateTheoreticalProfit({
 *   ordersAmount: 500000,
 *   cogs: 200000,
 *   advertisingSpend: 50000,
 *   logisticsCost: 30000,
 *   storageCost: 10000,
 * });
 * // result.value = 210000 (42% margin)
 * // result.isComplete = true
 */
export function calculateTheoreticalProfit(input: TheoreticalProfitInput): TheoreticalProfitResult {
  const missingFields: string[] = []

  // Check for missing values (null or undefined)
  if (input.ordersAmount === null || input.ordersAmount === undefined) {
    missingFields.push('ordersAmount')
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
  const orders = input.ordersAmount ?? 0
  const cogs = input.cogs ?? 0
  const advertising = input.advertisingSpend ?? 0
  const logistics = input.logisticsCost ?? 0
  const storage = input.storageCost ?? 0

  // Calculate: Orders - COGS - Advertising - Logistics - Storage
  const value = orders - cogs - advertising - logistics - storage

  return {
    value,
    breakdown: {
      orders,
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
 * @param ordersAmount - Total orders amount (base)
 * @returns Margin percentage (0-100) or null if orders is 0
 *
 * @example
 * calculateTheoreticalMarginPct(210000, 500000) // returns 42
 * calculateTheoreticalMarginPct(-25000, 100000) // returns -25
 * calculateTheoreticalMarginPct(1000, 0)        // returns null
 */
export function calculateTheoreticalMarginPct(
  profitValue: number,
  ordersAmount: number
): number | null {
  if (ordersAmount === 0) return null
  return (profitValue / ordersAmount) * 100
}
