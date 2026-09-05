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

/** 5-level status config: base 0-1.0 (0=FREE), elevated 1.01-1.5, high 1.51-2.0, peak >2.0, unavailable <0
 *
 * Semantic tokens (P2 wave-5, measured /tmp/p2-w5-contrast.mjs; cells mount on
 * PriceCalculatorForm Card > DeliveryDatePicker bg-muted/20 panel):
 * - base:       thin success tint + success text (4.72/8.36 worst-end)
 * - elevated:   warning/15 + fg text — same-hue warn text fails at any usable
 *               alpha on the muted/20 panel (warn/5 = 4.45), so fg-on-tint
 *               (wave-4 hover-exposed-chip precedent) carries this tier
 * - high:       SOLID warning (orange→warning collapse, Story 170.1) 4.81/11.41
 * - peak:       SOLID error 6.54/9.48
 * - unavailable: muted pair (gray→muted idiom)
 */
export const COEFFICIENT_STATUS_CONFIG: Record<CoefficientStatus, CoefficientStatusConfig> = {
  base: {
    status: 'base',
    label: 'Базовый',
    color: 'green',
    bgColor: 'bg-status-success/5',
    textColor: 'text-status-success',
    borderColor: 'border-status-success/40',
    minValue: 0,
    maxValue: 1.0,
  },
  elevated: {
    status: 'elevated',
    label: 'Повышенный',
    color: 'yellow',
    bgColor: 'bg-status-warning/15',
    textColor: 'text-foreground',
    borderColor: 'border-status-warning/40',
    minValue: 1.01,
    maxValue: 1.5,
  },
  high: {
    status: 'high',
    label: 'Высокий',
    color: 'orange',
    bgColor: 'bg-status-warning',
    textColor: 'text-status-warning-foreground',
    borderColor: 'border-status-warning',
    minValue: 1.51,
    maxValue: 2.0,
  },
  peak: {
    status: 'peak',
    label: 'Пиковый',
    color: 'red',
    bgColor: 'bg-status-error',
    textColor: 'text-status-error-foreground',
    borderColor: 'border-status-error',
    minValue: 2.01,
    maxValue: Infinity,
  },
  unavailable: {
    status: 'unavailable',
    label: 'Недоступно',
    color: 'gray',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-border',
    minValue: -Infinity,
    maxValue: -0.01,
  },
}
