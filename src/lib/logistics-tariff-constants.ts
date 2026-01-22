/**
 * Logistics Tariff Constants
 * Story 44.8-FE: Logistics Tariff Calculation
 *
 * Validation limits and configuration for tariff input fields
 */

/** Validation limits for tariff input fields (AC4) */
export const TARIFF_VALIDATION = {
  /** Minimum base liter rate (₽) */
  minBaseLiter: 1,
  /** Maximum base liter rate (₽) */
  maxBaseLiter: 500,
  /** Minimum additional liter rate (₽) */
  minAdditionalLiter: 0.1,
  /** Maximum additional liter rate (₽) */
  maxAdditionalLiter: 100,
  /** Minimum coefficient (AC4: 0.5-3.0) */
  minCoefficient: 0.5,
  /** Maximum coefficient (AC4: 0.5-3.0) */
  maxCoefficient: 3.0,
} as const

export type TariffValidation = typeof TARIFF_VALIDATION
