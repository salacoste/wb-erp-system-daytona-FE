'use client'

/**
 * Coefficient auto-fill logic extracted from useWarehouseCoefficients
 * Epic 74: Handles auto-populating logistics/storage coefficients and delivery date
 * from embedded warehouse tariffs or acceptance API data.
 */

import { getTomorrowDate } from '@/lib/coefficient-utils'
import type { CoefficientState, DeliveryDateState } from './warehouse-coefficient-types'
import type { NormalizedCoefficients } from './useAcceptanceCoefficients'

interface AutoFillResult {
  logistics: CoefficientState
  storage: CoefficientState
  delivery: DeliveryDateState
}

/**
 * Compute auto-fill coefficient state from warehouse data and API coefficients.
 * Returns updated logistics, storage, and delivery date states.
 */
export function computeAutoFillState(
  warehouse:
    | {
        tariffs?: { logisticsCoefficient?: number; storageCoefficient?: number }
      }
    | null
    | undefined,
  coefficients: NormalizedCoefficients | null
): AutoFillResult {
  const hasEmbedded = warehouse?.tariffs?.logisticsCoefficient !== undefined

  let logistics: CoefficientState = { value: 1.0, source: 'manual' }
  let storage: CoefficientState = { value: 1.0, source: 'manual' }
  let delivery: DeliveryDateState = { date: null, coefficient: 1.0 }

  if (hasEmbedded) {
    const logCoeff = warehouse!.tariffs!.logisticsCoefficient!
    const storCoeff = warehouse!.tariffs!.storageCoefficient ?? 1.0
    logistics = { value: logCoeff, source: 'auto', originalValue: logCoeff }
    storage = { value: storCoeff, source: 'auto', originalValue: storCoeff }
    const tomorrow = getTomorrowDate()
    delivery = { date: tomorrow, coefficient: logCoeff }
  } else if (coefficients) {
    logistics = {
      value: coefficients.delivery.coefficient,
      source: 'auto',
      originalValue: coefficients.delivery.coefficient,
    }
    storage = {
      value: coefficients.storage.coefficient,
      source: 'auto',
      originalValue: coefficients.storage.coefficient,
    }
  }

  if (coefficients?.dailyCoefficients?.length) {
    const tomorrow = getTomorrowDate()
    const tomorrowCoeff = coefficients.dailyCoefficients.find(c => c.date === tomorrow)
    if (tomorrowCoeff && tomorrowCoeff.isAvailable) {
      delivery = { date: tomorrow, coefficient: tomorrowCoeff.coefficient }
    } else {
      const firstAvailable = coefficients.dailyCoefficients.find(c => c.isAvailable)
      if (firstAvailable) {
        delivery = { date: firstAvailable.date, coefficient: firstAvailable.coefficient }
      }
    }
  }

  return { logistics, storage, delivery }
}
