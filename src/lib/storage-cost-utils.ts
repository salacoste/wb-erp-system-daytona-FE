/**
 * Storage Cost Calculation Utilities
 * Story 44.14-FE: Storage Cost Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Functions for calculating WB storage costs based on volume, tariffs, and duration
 *
 * Formula:
 * daily_cost = (base + (volume - 1) * per_liter) * coefficient
 * total_cost = daily_cost * days
 */

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
 * Based on typical Коледино rates
 */
export const DEFAULT_STORAGE_TARIFF: StorageTariff = {
  basePerDayRub: 1, // 1 RUB base per day for first liter
  perLiterPerDayRub: 1, // 1 RUB per additional liter per day
  coefficient: 1.0,
}

/**
 * Storage days presets for quick selection
 */
export const STORAGE_DAYS_PRESETS = [7, 14, 30, 60, 90] as const
export type StorageDaysPreset = (typeof STORAGE_DAYS_PRESETS)[number]

/**
 * Calculate daily storage cost per unit
 *
 * Formula: (base_per_day + (volume - 1) * per_liter_per_day) * coefficient
 *
 * @param volumeLiters - Product volume in liters
 * @param tariff - Storage tariff configuration
 * @returns Daily storage cost in RUB
 */
export function calculateDailyStorageCost(
  volumeLiters: number,
  tariff: StorageTariff,
): number {
  if (volumeLiters <= 0) return 0

  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost =
    tariff.basePerDayRub + additionalLiters * tariff.perLiterPerDayRub
  return baseCost * tariff.coefficient
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
