/**
 * Coefficient types and status configuration
 * Stories 44.9-FE, 44.26a-FE
 * Reference: docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md
 */

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

/** 5-level status config: base 0-1.0 (0=FREE), elevated 1.01-1.5, high 1.51-2.0, peak >2.0, unavailable <0 */
export const COEFFICIENT_STATUS_CONFIG: Record<CoefficientStatus, CoefficientStatusConfig> = {
  base: {
    status: 'base',
    label: 'Базовый',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    minValue: 0,
    maxValue: 1.0,
  },
  elevated: {
    status: 'elevated',
    label: 'Повышенный',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    minValue: 1.01,
    maxValue: 1.5,
  },
  high: {
    status: 'high',
    label: 'Высокий',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    minValue: 1.51,
    maxValue: 2.0,
  },
  peak: {
    status: 'peak',
    label: 'Пиковый',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    minValue: 2.01,
    maxValue: Infinity,
  },
  unavailable: {
    status: 'unavailable',
    label: 'Недоступно',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-300',
    minValue: -Infinity,
    maxValue: -0.01,
  },
}
