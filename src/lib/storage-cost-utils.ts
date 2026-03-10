/**
 * Storage Cost Calculation Utilities
 * Story 44.14-FE: Storage Cost Calculation
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Functions for calculating WB storage costs based on volume, tariffs, and duration
 *
 * CRITICAL: Different formulas by box type!
 * - Standard (Boxes=2, Supersafe=6): (base + (volume - 1) * per_liter) * coefficient
 * - Fixed (Pallets=5): base * coefficient (VOLUME-INDEPENDENT!)
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

import { isFixedStorageFormula, type BoxTypeId } from './box-type-utils'

// Re-export helpers from extracted module
export {
  formatStorageBreakdown,
  calculateBillableDays,
  calculateStorageCostWith60DaysFree,
  calculateVolumeWithMinimum,
} from './storage-cost-helpers'

/** Storage tariff configuration */
export interface StorageTariff {
  /** First liter base rate per day (RUB) */
  basePerDayRub: number
  /** Additional liter rate per day (RUB) */
  perLiterPerDayRub: number
  /** Warehouse storage coefficient (normalized: 1.0 = standard) */
  coefficient: number
}

/** Storage cost calculation result */
export interface StorageCostResult {
  /** Daily storage cost per unit (RUB) */
  dailyCost: number
  /** Total storage cost for period (RUB) */
  totalCost: number
  /** Number of storage days */
  days: number
  /** Volume used in calculation (liters) */
  volumeLiters: number
  /** Tariff used in calculation */
  tariff: StorageTariff
}

/** Storage warning level based on duration */
export type StorageWarningLevel = 'none' | 'warning' | 'critical'

/**
 * Default WB storage tariffs (fallback when no warehouse selected)
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */
export const DEFAULT_STORAGE_TARIFF: StorageTariff = {
  basePerDayRub: 0.07,
  perLiterPerDayRub: 0.05,
  coefficient: 1.0,
}

/**
 * Calculate daily storage cost per unit
 *
 * CRITICAL: Different formulas by box type!
 * - Standard (Boxes=2, Supersafe=6): (base + (volume-1) * per_liter) * coefficient
 * - Fixed (Pallets=5): base * coefficient (VOLUME-INDEPENDENT!)
 *
 * @param volumeLiters - Product volume in liters
 * @param tariff - Storage tariff configuration
 * @param boxTypeId - Box type ID (2=Boxes, 5=Pallets, 6=Supersafe), defaults to 2
 * @returns Daily storage cost in RUB
 */
export function calculateDailyStorageCost(
  volumeLiters: number,
  tariff: StorageTariff,
  boxTypeId: BoxTypeId = 2
): number {
  if (volumeLiters <= 0) return 0

  // CRITICAL: Pallets (boxTypeId=5) use FIXED formula (volume-independent!)
  if (isFixedStorageFormula(boxTypeId)) {
    return Math.round(tariff.basePerDayRub * tariff.coefficient * 10000) / 10000
  }

  // Standard formula: (base + (volume-1) * per_liter) * coefficient
  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = tariff.basePerDayRub + additionalLiters * tariff.perLiterPerDayRub
  return Math.round(baseCost * tariff.coefficient * 10000) / 10000
}

/**
 * Calculate total storage cost for a period
 */
export function calculateTotalStorageCost(
  volumeLiters: number,
  days: number,
  tariff: StorageTariff
): number {
  const dailyCost = calculateDailyStorageCost(volumeLiters, tariff)
  return dailyCost * Math.max(0, days)
}

/**
 * Full storage cost calculation with breakdown
 */
export function calculateStorageCost(
  volumeLiters: number,
  days: number,
  tariff: StorageTariff = DEFAULT_STORAGE_TARIFF
): StorageCostResult {
  const dailyCost = calculateDailyStorageCost(volumeLiters, tariff)
  const totalCost = dailyCost * Math.max(0, days)

  return {
    dailyCost,
    totalCost,
    days,
    volumeLiters,
    tariff,
  }
}

/**
 * Get storage warning level based on days
 *
 * - none: <= 30 days (normal inventory turnover)
 * - warning: 31-60 days (increased costs)
 * - critical: > 60 days (high costs, needs attention)
 */
export function getStorageWarningLevel(days: number): StorageWarningLevel {
  if (days > 60) return 'critical'
  if (days > 30) return 'warning'
  return 'none'
}
