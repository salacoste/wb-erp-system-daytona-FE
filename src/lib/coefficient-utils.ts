/**
 * Coefficient Utilities - Stories 44.9-FE, 44.26a-FE
 * WB coefficients: integers (100=1.0), normalized for display
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */

import { formatCurrency, formatDate } from '@/lib/utils'

/** Raw coefficient from WB API (integer: 100 = 1.0) */
export interface RawCoefficient {
  date: string
  coefficient: number
  /** Optional availability flag from API */
  isAvailable?: boolean
}

/** Normalized coefficient for frontend (decimal: 1.0, 1.25) */
export interface NormalizedCoefficient {
  date: string
  coefficient: number
  status: CoefficientStatus
  /** Availability flag from API - coefficient=0 with isAvailable=true means FREE slot */
  isAvailable: boolean
}

/** Coefficient status - 5 levels for Story 44.26a-FE */
export type CoefficientStatus = 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'

/** Coefficient status configuration */
export interface CoefficientStatusConfig {
  status: CoefficientStatus
  label: string
  color: 'green' | 'yellow' | 'orange' | 'red' | 'gray'
  bgColor: string
  textColor: string
  borderColor: string
  minValue: number
  maxValue: number
}

/** Coefficient impact calculation result */
export interface CoefficientImpact {
  increase: number
  percentIncrease: number
  increaseDisplay: string
  percentDisplay: string
}

/** 5-level status config: base ≤1.0, elevated 1.01-1.5, high 1.51-2.0, peak >2.0, unavailable ≤0 */
export const COEFFICIENT_STATUS_CONFIG: Record<CoefficientStatus, CoefficientStatusConfig> = {
  base: { status: 'base', label: 'Базовый', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', minValue: 0, maxValue: 1.0 },
  elevated: { status: 'elevated', label: 'Повышенный', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-300', minValue: 1.01, maxValue: 1.5 },
  high: { status: 'high', label: 'Высокий', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300', minValue: 1.51, maxValue: 2.0 },
  peak: { status: 'peak', label: 'Пиковый', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', minValue: 2.01, maxValue: Infinity },
  unavailable: { status: 'unavailable', label: 'Недоступно', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-400', borderColor: 'border-gray-300', minValue: -Infinity, maxValue: 0 },
}

/** Normalize coefficient from API: 100 → 1.0 */
export function normalizeCoefficient(raw: number): number {
  return raw / 100
}

/** Denormalize coefficient for API: 1.0 → 100 */
export function denormalizeCoefficient(normalized: number): number {
  return Math.round(normalized * 100)
}

/** Get coefficient status based on normalized value (5 levels) */
export function getCoefficientStatus(coefficient: number): CoefficientStatus {
  if (coefficient <= 0) return 'unavailable'
  if (coefficient <= 1.0) return 'base'
  if (coefficient <= 1.5) return 'elevated'
  if (coefficient <= 2.0) return 'high'
  return 'peak'
}

/** Get coefficient status configuration */
export function getCoefficientStatusConfig(coefficient: number): CoefficientStatusConfig {
  const status = getCoefficientStatus(coefficient)
  return COEFFICIENT_STATUS_CONFIG[status]
}

/** Normalize array of coefficients from API response */
export function normalizeCoefficients(raw: RawCoefficient[]): NormalizedCoefficient[] {
  return raw.map((item) => {
    const normalized = normalizeCoefficient(item.coefficient)
    // isAvailable defaults to coefficient >= 0 if not provided
    const isAvailable = item.isAvailable ?? item.coefficient >= 0
    return {
      date: item.date,
      coefficient: normalized,
      status: getCoefficientStatus(normalized),
      isAvailable,
    }
  })
}

/** Get today's coefficient from array */
export function getTodayCoefficient(coefficients: NormalizedCoefficient[]): NormalizedCoefficient | null {
  const today = new Date().toISOString().split('T')[0]
  return coefficients.find((c) => c.date === today) ?? coefficients[0] ?? null
}

/** Get coefficient for a specific date */
export function getCoefficientForDate(coefficients: NormalizedCoefficient[], date: string): NormalizedCoefficient | null {
  return coefficients.find((c) => c.date === date) ?? null
}

/** Calculate cost increase from coefficient */
export function calculateCoefficientImpact(
  baseCost: number,
  coefficient: number
): CoefficientImpact {
  if (coefficient <= 1.0 || baseCost <= 0) {
    return {
      increase: 0,
      percentIncrease: 0,
      increaseDisplay: '0 ₽',
      percentDisplay: '0%',
    }
  }

  const adjustedCost = baseCost * coefficient
  const increase = adjustedCost - baseCost
  const percentIncrease = (coefficient - 1) * 100

  return {
    increase: Math.round(increase * 100) / 100,
    percentIncrease: Math.round(percentIncrease * 10) / 10,
    increaseDisplay: `+${formatCurrency(increase)}`,
    percentDisplay: `+${percentIncrease.toFixed(1)}%`,
  }
}

/** Format coefficient for display */
export function formatCoefficient(coefficient: number): string {
  return coefficient.toFixed(2)
}

/** Format date for coefficient display (Russian locale) */
export function formatCoefficientDate(dateString: string): string {
  return formatDate(dateString)
}

/** Get day of month from date string */
export function getDayFromDate(dateString: string): number {
  return new Date(dateString).getDate()
}

/** Check if date is today */
export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateString === today
}

/** Format date in long Russian format: "21 января 2026" - Story 44.26a-FE */
export function formatDateLongRu(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Get tomorrow's date in ISO format - Story 44.26a-FE */
export function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

/** Get first available date from coefficients - Story 44.26a-FE */
export function getFirstAvailableDate(coefficients: NormalizedCoefficient[]): NormalizedCoefficient | null {
  // Use isAvailable flag: coefficient=0 with isAvailable=true means FREE slot
  return coefficients.find((c) => c.isAvailable) ?? null
}
