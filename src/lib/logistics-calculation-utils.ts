/**
 * Logistics Calculation Utilities
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Functions for calculating WB logistics forward costs based on volume, tariffs, and coefficients
 *
 * Formula: logistics_forward = (base + (volume - 1) * per_liter) * coefficient
 */

import { formatCurrency } from '@/lib/utils'

/**
 * Logistics tariff configuration from warehouse data
 */
export interface LogisticsTariff {
  /** First liter base rate (RUB) */
  baseRub: number
  /** Additional liter rate (RUB) */
  perLiterRub: number
  /** Warehouse logistics coefficient (normalized: 1.0 = standard) */
  coefficient: number
}

/**
 * Logistics cost calculation result
 */
export interface LogisticsCostResult {
  /** Total logistics forward cost (RUB) */
  totalCost: number
  /** Base cost before coefficient (RUB) */
  baseCost: number
  /** Volume used in calculation (liters) */
  volumeLiters: number
  /** Additional liters beyond first */
  additionalLiters: number
  /** Tariff used in calculation */
  tariff: LogisticsTariff
}

/**
 * Default WB logistics tariffs (fallback when no warehouse selected)
 * Based on typical rates from WB API
 */
export const DEFAULT_LOGISTICS_TARIFF: LogisticsTariff = {
  baseRub: 46, // 46 RUB base for first liter
  perLiterRub: 14, // 14 RUB per additional liter
  coefficient: 1.0,
}

/**
 * Calculate logistics forward cost based on WB tariffs
 *
 * Formula: (base + (volume - 1) * per_liter) * coefficient
 *
 * @param volumeLiters - Product volume in liters (from Story 44.7)
 * @param baseTariff - Base tariff for first liter (RUB)
 * @param perLiterTariff - Additional cost per liter (RUB)
 * @param coefficient - Logistics coefficient (default: 1.0)
 * @returns Calculated logistics cost in RUB
 */
export function calculateLogisticsForward(
  volumeLiters: number,
  baseTariff: number,
  perLiterTariff: number,
  coefficient: number = 1.0,
): number {
  if (volumeLiters <= 0) return 0

  // First liter is base tariff, additional liters charged per_liter
  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = baseTariff + additionalLiters * perLiterTariff

  return baseCost * coefficient
}

/**
 * Calculate logistics cost with full breakdown
 *
 * @param volumeLiters - Product volume in liters
 * @param tariff - Logistics tariff configuration
 * @returns Complete calculation result with breakdown
 */
export function calculateLogisticsCost(
  volumeLiters: number,
  tariff: LogisticsTariff = DEFAULT_LOGISTICS_TARIFF,
): LogisticsCostResult {
  // Return zero result for invalid volume
  if (volumeLiters <= 0) {
    return {
      totalCost: 0,
      baseCost: 0,
      volumeLiters: 0,
      additionalLiters: 0,
      tariff,
    }
  }

  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = tariff.baseRub + additionalLiters * tariff.perLiterRub
  const totalCost = baseCost * tariff.coefficient

  return {
    totalCost,
    baseCost,
    volumeLiters,
    additionalLiters,
    tariff,
  }
}

/**
 * Generate calculation breakdown for tooltip
 *
 * @param volumeLiters - Product volume in liters
 * @param baseTariff - Base tariff for first liter (RUB)
 * @param perLiterTariff - Additional cost per liter (RUB)
 * @param coefficient - Logistics coefficient
 * @returns Multi-line string with calculation breakdown
 */
export function getLogisticsBreakdown(
  volumeLiters: number,
  baseTariff: number,
  perLiterTariff: number,
  coefficient: number,
): string {
  if (volumeLiters <= 0) {
    return 'Введите объём для расчёта логистики'
  }

  const additionalLiters = Math.max(0, volumeLiters - 1)
  const baseCost = baseTariff + additionalLiters * perLiterTariff
  const finalCost = baseCost * coefficient

  const lines: (string | null)[] = [
    `Объём: ${volumeLiters.toFixed(2)} л`,
    `Базовый тариф: ${formatCurrency(baseTariff)} (первый литр)`,
    additionalLiters > 0
      ? `Доп. литры: ${additionalLiters.toFixed(2)} × ${formatCurrency(perLiterTariff)} = ${formatCurrency(additionalLiters * perLiterTariff)}`
      : null,
    `Сумма до коэфф.: ${formatCurrency(baseCost)}`,
    coefficient !== 1.0 ? `Коэффициент: ×${coefficient.toFixed(2)}` : null,
    `Итого: ${formatCurrency(finalCost)}`,
  ]

  return lines.filter(Boolean).join('\n')
}

/**
 * Format logistics breakdown as array for structured display
 *
 * @param result - Logistics calculation result
 * @returns Array of breakdown lines
 */
export function formatLogisticsBreakdown(result: LogisticsCostResult): string[] {
  const lines: string[] = []

  lines.push(`Базовый тариф (1 л): ${formatCurrency(result.tariff.baseRub)}`)

  if (result.additionalLiters > 0) {
    const additionalCost = result.additionalLiters * result.tariff.perLiterRub
    lines.push(
      `Доп. литры (${result.additionalLiters.toFixed(1)} л): ${formatCurrency(additionalCost)}`,
    )
  }

  if (result.tariff.coefficient !== 1.0) {
    lines.push(`Коэффициент логистики: ×${result.tariff.coefficient.toFixed(2)}`)
  }

  lines.push(`Итого логистика: ${formatCurrency(result.totalCost)}`)

  return lines
}
