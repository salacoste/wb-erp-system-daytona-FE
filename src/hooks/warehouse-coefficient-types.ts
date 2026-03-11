/**
 * Warehouse Coefficient Types
 * Extracted from useWarehouseCoefficients.ts for file size compliance (Epic 74).
 *
 * Interfaces for coefficient state management in Price Calculator.
 * NO 'use client' — pure type definitions.
 *
 * @see docs/stories/epic-44/story-44.13-fe-coefficient-state-management.md
 */

import type { BoxTypeCoefficients } from './useAcceptanceCoefficients'
import type { NormalizedCoefficient } from '@/lib/coefficient-utils'
import type { FieldSource } from '@/components/custom/price-calculator/AutoFillBadge'

/** Coefficient field state with auto/manual tracking */
export interface CoefficientState {
  value: number
  source: FieldSource
  originalValue?: number
}

/** Delivery date state */
export interface DeliveryDateState {
  date: string | null
  coefficient: number
}

export interface UseWarehouseCoefficientsResult {
  /** Loading state for coefficients */
  isLoading: boolean
  /** Error from API */
  error: Error | null
  /** Logistics coefficient state */
  logisticsCoeff: CoefficientState
  /** Storage coefficient state */
  storageCoeff: CoefficientState
  /** Update logistics coefficient */
  setLogisticsValue: (value: number) => void
  /** Update storage coefficient */
  setStorageValue: (value: number) => void
  /** Restore logistics to original */
  restoreLogistics: () => void
  /** Restore storage to original */
  restoreStorage: () => void
  /** Daily coefficients for calendar (default box type) */
  dailyCoefficients: NormalizedCoefficient[]
  /** Coefficients grouped by box type (Boxes, Pallets, Supersafe) */
  byBoxType: BoxTypeCoefficients[]
  /** Delivery date state */
  deliveryDate: DeliveryDateState
  /** Update delivery date */
  setDeliveryDate: (date: string, coefficient: number) => void
  /** Story 44.34: Currently debouncing warehouse changes */
  isDebouncing: boolean
  /** Story 44.34: Rate limited by backend (429 error) */
  isRateLimited: boolean
  /** Story 44.34: Remaining cooldown seconds if rate limited */
  cooldownRemaining: number
}
