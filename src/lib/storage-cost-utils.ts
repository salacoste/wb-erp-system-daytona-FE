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

/**
 * Storage tariff configuration
 */
export interface StorageTariff {
  /** First liter base rate per day (RUB) */
  basePerDayRub: number
  /** Additional liter rate per day (RUB) */
  perLiterPerDayRub: number
  /** Warehouse storage coefficient (normalized: 1.0 = standard) */
  coefficient: number
}

/**
 * Storage cost calculation result
 */
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

/**
 * Storage warning level based on duration
 */
export type StorageWarningLevel = 'none' | 'warning' | 'critical'

/**
 * Default WB storage tariffs (fallback when no warehouse selected)
 * Based on WB official rates per documentation:
 * - base_per_day_rub: 0.07 ₽ (for first liter)
 * - liter_per_day_rub: 0.05 ₽ (per additional liter)
 *
 * Note: Storage rates are very low per day - cost accumulates over turnover days.
 * Example: 10L product × 0.07 base + 9L × 0.05 = 0.07 + 0.45 = 0.52 ₽/day
 * Over 30 days: 0.52 × 30 = 15.6 ₽
 *
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */
export const DEFAULT_STORAGE_TARIFF: StorageTariff = {
  basePerDayRub: 0.07, // 0.07 ₽ per day for first liter (WB official rate)
  perLiterPerDayRub: 0.05, // 0.05 ₽ per additional liter per day
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
    // Fixed formula: base * coefficient (ignores volume!)
    return Math.round(tariff.basePerDayRub * tariff.coefficient * 10000) / 10000
  }

  // Standard formula: (base + (volume-1) * per_liter) * coefficient
  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost =
    tariff.basePerDayRub + additionalLiters * tariff.perLiterPerDayRub
  // Round to 4 decimal places for storage (small daily rates)
  return Math.round(baseCost * tariff.coefficient * 10000) / 10000
}

/**
 * Calculate total storage cost for a period
 *
 * @param volumeLiters - Product volume in liters
 * @param days - Number of storage days
 * @param tariff - Storage tariff configuration
 * @returns Total storage cost in RUB
 */
export function calculateTotalStorageCost(
  volumeLiters: number,
  days: number,
  tariff: StorageTariff,
): number {
  const dailyCost = calculateDailyStorageCost(volumeLiters, tariff)
  return dailyCost * Math.max(0, days)
}

/**
 * Full storage cost calculation with breakdown
 *
 * @param volumeLiters - Product volume in liters
 * @param days - Number of storage days
 * @param tariff - Storage tariff configuration
 * @returns Complete calculation result
 */
export function calculateStorageCost(
  volumeLiters: number,
  days: number,
  tariff: StorageTariff = DEFAULT_STORAGE_TARIFF,
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
 *
 * @param days - Number of storage days
 * @returns Warning level
 */
export function getStorageWarningLevel(days: number): StorageWarningLevel {
  if (days > 60) return 'critical'
  if (days > 30) return 'warning'
  return 'none'
}

/**
 * Format storage cost breakdown for display
 *
 * @param result - Storage calculation result
 * @returns Array of breakdown lines
 */
export function formatStorageBreakdown(result: StorageCostResult): string[] {
  const additionalLiters = Math.max(0, result.volumeLiters - 1)
  const lines: string[] = []

  lines.push(`Базовая ставка (1 л): ${result.tariff.basePerDayRub.toFixed(2)} ₽/день`)

  if (additionalLiters > 0) {
    const additionalCost = additionalLiters * result.tariff.perLiterPerDayRub
    lines.push(
      `Доп. литры (${additionalLiters.toFixed(1)} л): ${additionalCost.toFixed(2)} ₽/день`,
    )
  }

  if (result.tariff.coefficient !== 1.0) {
    lines.push(`Коэффициент склада: ×${result.tariff.coefficient.toFixed(2)}`)
  }

  lines.push(`Итого/день: ${result.dailyCost.toFixed(2)} ₽`)
  lines.push(`За ${result.days} дней: ${result.totalCost.toFixed(2)} ₽`)

  return lines
}

/**
 * Calculate billable storage days with 60-day free period
 *
 * Backend formula: billable_days = max(0, turnover_days - 60)
 * WB policy provides 60 days of free storage before billing starts.
 *
 * @param turnoverDays - Product turnover in days
 * @returns Billable days (0 if within free 60-day period)
 */
export function calculateBillableDays(turnoverDays: number): number {
  // Handle NaN - return 0
  if (Number.isNaN(turnoverDays)) {
    return 0
  }

  // Handle Infinity - return as-is
  if (!Number.isFinite(turnoverDays)) {
    return turnoverDays
  }

  // Normal case: max(0, days - 60)
  return Math.max(0, turnoverDays - 60)
}

/**
 * Calculate storage cost with 60-day free period
 *
 * Formula: storage_rub = daily_cost × billable_days
 * Where billable_days = max(0, turnover_days - 60)
 *
 * @param dailyCost - Daily storage cost in RUB
 * @param turnoverDays - Product turnover in days
 * @returns Total storage cost in RUB (0 if within free period)
 */
export function calculateStorageCostWith60DaysFree(
  dailyCost: number,
  turnoverDays: number,
): number {
  // Handle negative daily cost
  if (dailyCost < 0) {
    return 0
  }

  const billableDays = calculateBillableDays(turnoverDays)
  return dailyCost * billableDays
}

/**
 * Calculate volume in liters with minimum 1 liter enforcement
 *
 * Formula: volume_liters = (length × width × height) / 1000, minimum 1 liter
 * Prevents undersizing of storage charges for small items.
 *
 * @param lengthCm - Length in centimeters
 * @param widthCm - Width in centimeters
 * @param heightCm - Height in centimeters
 * @returns Volume in liters (minimum 1)
 */
export function calculateVolumeWithMinimum(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
): number {
  // Calculate volume: cm³ → liters (divide by 1000)
  const volumeLiters = (lengthCm * widthCm * heightCm) / 1000

  // Enforce minimum of 1 liter
  return Math.max(1, volumeLiters)
}
