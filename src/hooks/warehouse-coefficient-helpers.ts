/**
 * Warehouse Coefficient Helper Functions
 * Extracted from useWarehouseCoefficients.ts for file size compliance (Epic 74).
 *
 * Pure data transformation functions for warehouse coefficient normalization.
 * NO 'use client' — pure logic, no React hooks.
 *
 * @see docs/stories/epic-44/story-44.13-fe-coefficient-state-management.md
 */

import type { AcceptanceCoefficient } from '@/types/tariffs'
import type {
  BoxTypeCoefficients,
  DailyCoefficient,
  NormalizedCoefficients,
} from './useAcceptanceCoefficients'
import { BOX_TYPE_CONFIG } from './useAcceptanceCoefficients'

/** Get BoxType key from boxTypeId */
export function getBoxTypeKey(boxTypeId: number): 'boxes' | 'pallets' | 'supersafe' {
  switch (boxTypeId) {
    case 2:
      return 'boxes'
    case 5:
      return 'pallets'
    case 6:
      return 'supersafe'
    default:
      return 'boxes'
  }
}

/** Normalize coefficient from API */
export function normalizeCoefficient(rawCoeff: number): number {
  if (rawCoeff < 0) return 0
  return rawCoeff > 10 ? rawCoeff / 100 : rawCoeff
}

/** Warehouse data found by name matching */
interface WarehouseCoeffData {
  warehouseId: number
  warehouseName: string
  coefficients: AcceptanceCoefficient[]
}

/**
 * Build NormalizedCoefficients from matched warehouse acceptance data.
 * Groups coefficients by box type and computes averages.
 */
export function buildNormalizedCoefficients(
  warehouseData: WarehouseCoeffData
): NormalizedCoefficients {
  const coeffs = warehouseData.coefficients
  const firstCoeff = coeffs[0]

  // Group by box type
  const byBoxTypeMap = new Map<'boxes' | 'pallets' | 'supersafe', DailyCoefficient[]>()
  for (const c of coeffs) {
    const boxType = getBoxTypeKey(c.boxTypeId)
    const daily: DailyCoefficient = {
      date: c.date.split('T')[0],
      coefficient: normalizeCoefficient(c.coefficient),
      isAvailable: c.isAvailable,
    }
    if (!byBoxTypeMap.has(boxType)) {
      byBoxTypeMap.set(boxType, [])
    }
    byBoxTypeMap.get(boxType)!.push(daily)
  }

  // Convert to array
  const byBoxType: BoxTypeCoefficients[] = []
  for (const [boxType, dailyCoeffs] of byBoxTypeMap) {
    const config = BOX_TYPE_CONFIG[boxType]
    dailyCoeffs.sort((a, b) => a.date.localeCompare(b.date))
    byBoxType.push({
      boxType,
      boxTypeId: config.id,
      label: config.label,
      dailyCoefficients: dailyCoeffs,
    })
  }
  byBoxType.sort((a, b) => a.boxTypeId - b.boxTypeId)

  // Default to boxes for legacy dailyCoefficients
  const boxesCoeffs = byBoxTypeMap.get('boxes') || []
  const availableCoeffs = boxesCoeffs.filter(c => c.coefficient > 0)
  const avgCoeff =
    availableCoeffs.length > 0
      ? availableCoeffs.reduce((sum, c) => sum + c.coefficient, 0) / availableCoeffs.length
      : 1.0
  const todayCoeff = boxesCoeffs[0]?.coefficient ?? 1.0

  return {
    warehouseId: warehouseData.warehouseId,
    warehouseName: warehouseData.warehouseName,
    todayCoefficient: todayCoeff,
    averageCoefficient: avgCoeff,
    dailyCoefficients: boxesCoeffs,
    byBoxType,
    delivery: {
      baseLiterRub: firstCoeff.delivery.baseLiterRub,
      additionalLiterRub: firstCoeff.delivery.additionalLiterRub,
      coefficient: normalizeCoefficient(firstCoeff.delivery.coefficient),
    },
    storage: {
      baseLiterRub: firstCoeff.storage.baseLiterRub,
      additionalLiterRub: firstCoeff.storage.additionalLiterRub,
      coefficient: normalizeCoefficient(firstCoeff.storage.coefficient),
    },
  }
}
