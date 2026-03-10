/**
 * Storage Cost Display and Billing Helpers
 * Story 44.14-FE: Storage Cost Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Extracted from storage-cost-utils.ts for file size compliance.
 * Contains display formatting, billable days calculation, and volume helpers.
 */

import type { StorageCostResult } from './storage-cost-utils'

// ============================================================================
// Display Helpers
// ============================================================================

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
    lines.push(`Доп. литры (${additionalLiters.toFixed(1)} л): ${additionalCost.toFixed(2)} ₽/день`)
  }

  if (result.tariff.coefficient !== 1.0) {
    lines.push(`Коэффициент склада: ×${result.tariff.coefficient.toFixed(2)}`)
  }

  lines.push(`Итого/день: ${result.dailyCost.toFixed(2)} ₽`)
  lines.push(`За ${result.days} дней: ${result.totalCost.toFixed(2)} ₽`)

  return lines
}

// ============================================================================
// Billable Days Calculation
// ============================================================================

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
 * Formula: storage_rub = daily_cost x billable_days
 * Where billable_days = max(0, turnover_days - 60)
 *
 * @param dailyCost - Daily storage cost in RUB
 * @param turnoverDays - Product turnover in days
 * @returns Total storage cost in RUB (0 if within free period)
 */
export function calculateStorageCostWith60DaysFree(
  dailyCost: number,
  turnoverDays: number
): number {
  // Handle negative daily cost
  if (dailyCost < 0) {
    return 0
  }

  const billableDays = calculateBillableDays(turnoverDays)
  return dailyCost * billableDays
}

// ============================================================================
// Volume Calculation
// ============================================================================

/**
 * Calculate volume in liters with minimum 1 liter enforcement
 *
 * Formula: volume_liters = (length x width x height) / 1000, minimum 1 liter
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
  heightCm: number
): number {
  // Calculate volume: cm3 -> liters (divide by 1000)
  const volumeLiters = (lengthCm * widthCm * heightCm) / 1000

  // Enforce minimum of 1 liter
  return Math.max(1, volumeLiters)
}
