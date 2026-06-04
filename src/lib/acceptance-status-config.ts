/**
 * Acceptance Status Configuration and Formatting
 * Story 44.43-FE: Acceptance Coefficient Status Badge
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Extracted from acceptance-status-utils.ts for file size compliance.
 * Contains static configuration map, formatting functions, and helper checks.
 *
 * Coefficient Mapping (from SUPPLY API):
 * | Value | Status | UI Display |
 * |-------|--------|------------|
 * | -1    | unavailable | "Недоступно" (red) |
 * | 0     | free | "Бесплатно" (green) |
 * | 1     | standard | "Стандартно" (gray) |
 * | >1-1.50 | elevated | "x{value}" (yellow) |
 * | >1.50 | high | "x{value}" (orange) |
 */

import type { AcceptanceStatus, AcceptanceStatusConfig } from '@/types/acceptance'
import { formatDecimal } from '@/lib/utils'

// ============================================================================
// Status Configuration (Story AC1)
// ============================================================================

/**
 * Static configuration for each acceptance status
 * Labels and descriptions in Russian as per Story 44.43-FE
 */
export const ACCEPTANCE_STATUS_CONFIG: Record<AcceptanceStatus, AcceptanceStatusConfig> = {
  unavailable: {
    label: 'Недоступно',
    description: 'Поставка на данную дату невозможна',
    color: 'destructive',
    icon: '⛔',
  },
  free: {
    label: 'Бесплатно',
    description: 'Бесплатная приёмка! Рекомендуемая дата.',
    color: 'success',
    icon: '✅',
  },
  standard: {
    label: 'Стандартно',
    description: 'Стандартная стоимость приёмки',
    color: 'default',
    icon: '',
  },
  elevated: {
    label: 'Повышенная',
    description: 'Стоимость приёмки увеличена',
    color: 'warning',
    icon: '⚠️',
  },
  high: {
    label: 'Высокая',
    description: 'Высокая стоимость приёмки',
    color: 'high',
    icon: '🔴',
  },
} as const

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format coefficient for display
 *
 * @param coefficient - Acceptance coefficient from SUPPLY API
 * @returns Formatted string for display
 *
 * @example
 * formatCoefficient(-1)   // "Н/Д"
 * formatCoefficient(0)    // "Бесплатно"
 * formatCoefficient(1)    // "×1,00"
 * formatCoefficient(1.65) // "×1,65"
 */
export function formatCoefficient(coefficient: number): string {
  // Handle invalid values
  if (coefficient === undefined || coefficient === null || Number.isNaN(coefficient)) {
    return 'Н/Д'
  }

  // Unavailable
  if (coefficient === -1) {
    return 'Н/Д'
  }

  // Free
  if (coefficient === 0) {
    return 'Бесплатно'
  }

  // Standard and elevated/high - format as multiplier (Russian comma, e.g. "×1,65")
  return `×${formatDecimal(coefficient, 2)}`
}

/**
 * Calculate percentage increase from coefficient
 * Formula: (coefficient - 1) * 100, rounded to nearest integer
 *
 * @param coefficient - Acceptance coefficient
 * @returns Percentage increase or null if coefficient <= 1
 *
 * @example
 * calculatePercentageIncrease(1.25) // 25
 * calculatePercentageIncrease(1.65) // 65
 * calculatePercentageIncrease(1)    // null
 * calculatePercentageIncrease(0)    // null
 */
export function calculatePercentageIncrease(coefficient: number): number | null {
  // Only calculate for coefficients > 1
  if (coefficient <= 1) {
    return null
  }

  // Formula from Story AC5: (coefficient - 1) * 100
  return Math.round((coefficient - 1) * 100)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if acceptance is available (coefficient >= 0)
 *
 * @param coefficient - Acceptance coefficient
 * @returns true if available, false otherwise
 */
export function isAcceptanceAvailable(coefficient: number): boolean {
  // Handle invalid values
  if (coefficient === undefined || coefficient === null || Number.isNaN(coefficient)) {
    return false
  }

  return coefficient >= 0
}

/**
 * Check if acceptance is free (coefficient === 0)
 *
 * @param coefficient - Acceptance coefficient
 * @returns true if free acceptance
 */
export function isFreeAcceptance(coefficient: number): boolean {
  return coefficient === 0
}

/**
 * Check if acceptance has elevated cost (coefficient > 1)
 *
 * @param coefficient - Acceptance coefficient
 * @returns true if elevated or high cost
 */
export function isElevatedAcceptance(coefficient: number): boolean {
  return coefficient > 1
}
