import { calculateDailyStorageCost } from '@/lib/storage-cost-utils'
import {
  calculateLogisticsTariff,
  calculateReturnLogistics,
  type BoxDeliveryTariffs,
} from '@/lib/logistics-tariff'
import {
  calculateAcceptanceCost,
  DEFAULT_ACCEPTANCE_TARIFF,
  type AcceptanceTariff,
  type AcceptanceCostResult,
} from '@/lib/acceptance-cost-utils'
import type { BoxTypeId } from '@/lib/box-type-utils'
import type { ExtractedTariffs } from '@/lib/tariff-system-utils'

/**
 * Pure calculation helpers for useWarehouseFormState
 * Extracted for file size compliance (Story 74.8)
 */

/** Calculate volume from dimensions (cm to liters) */
export function calculateVolumeLiters(lengthCm: number, widthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0
  return (lengthCm * widthCm * heightCm) / 1000
}

/**
 * Calculate daily storage cost from effective tariffs and volume.
 * `boxType` is REQUIRED and threaded into calculateDailyStorageCost — Pallets (boxType=5) use a
 * VOLUME-INDEPENDENT fixed formula (base × coefficient), so omitting it (defaulting to Boxes=2)
 * overstates pallet storage for products > 1 L and inflates the recommended price.
 */
export function calculateDailyStorage(
  effectiveTariffs: ExtractedTariffs,
  volumeLiters: number,
  boxType: BoxTypeId
): number {
  const tariff = {
    basePerDayRub: effectiveTariffs.storageBaseLiterRub,
    perLiterPerDayRub: effectiveTariffs.storagePerLiterRub,
    coefficient: effectiveTariffs.storageCoefficient,
  }
  return calculateDailyStorageCost(volumeLiters, tariff, boxType)
}

/** Calculate logistics forward cost from effective tariffs and volume */
export function calculateLogisticsForward(
  effectiveTariffs: ExtractedTariffs,
  volumeLiters: number
): number {
  if (volumeLiters <= 0) return 0
  const tariff: BoxDeliveryTariffs = {
    baseLiterRub: effectiveTariffs.deliveryBaseLiterRub,
    additionalLiterRub: effectiveTariffs.deliveryPerLiterRub,
    coefficient: effectiveTariffs.logisticsCoefficient,
  }
  return calculateLogisticsTariff(volumeLiters, tariff).totalCost
}

/** Calculate return logistics cost from volume */
export function calculateLogisticsReverse(volumeLiters: number): number {
  return calculateReturnLogistics(volumeLiters)
}

/** Calculate acceptance cost from tariff, dimensions, and coefficient */
export function calculateAcceptance(
  boxType: BoxTypeId,
  volumeLiters: number,
  acceptanceCoefficient: number,
  unitsPerPackage: number,
  acceptanceTariff?: AcceptanceTariff
): AcceptanceCostResult {
  const tariff = acceptanceTariff ?? DEFAULT_ACCEPTANCE_TARIFF
  const effectiveUnits = unitsPerPackage > 0 ? unitsPerPackage : 1
  return calculateAcceptanceCost(
    boxType,
    volumeLiters,
    acceptanceCoefficient,
    effectiveUnits,
    tariff
  )
}
