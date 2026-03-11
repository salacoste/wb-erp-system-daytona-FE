/**
 * Acceptance Coefficients - Types, Constants & Data Transformations
 * Extracted from useAcceptanceCoefficients.ts for file size compliance (Epic 74)
 */

import type { AcceptanceCoefficient } from '@/types/tariffs'

// ============================================================================
// Query Keys
// ============================================================================

/** Query keys for coefficient-related queries */
export const coefficientsQueryKeys = {
  all: ['coefficients'] as const,
  byWarehouse: (warehouseId: number) =>
    [...coefficientsQueryKeys.all, 'warehouse', warehouseId] as const,
}

// ============================================================================
// Types & Constants
// ============================================================================

/** Box type for delivery */
export type BoxType = 'boxes' | 'pallets' | 'supersafe'

/** Box type configuration for UI */
export const BOX_TYPE_CONFIG: Record<BoxType, { id: number; label: string; labelShort: string }> = {
  boxes: { id: 2, label: 'Коробы', labelShort: 'Короб' },
  pallets: { id: 5, label: 'Монопалеты', labelShort: 'Палет' },
  supersafe: { id: 6, label: 'Суперсейф', labelShort: 'Сейф' },
}

/** Daily coefficient data */
export interface DailyCoefficient {
  date: string
  coefficient: number
  isAvailable: boolean
}

/** Coefficients grouped by box type */
export interface BoxTypeCoefficients {
  boxType: BoxType
  boxTypeId: number
  label: string
  dailyCoefficients: DailyCoefficient[]
}

/**
 * Normalized coefficient data for UI use
 * Backend returns integers (100 = 1.0), we normalize to decimals
 * Coefficients are grouped by box type (Boxes, Pallets, Supersafe)
 */
export interface NormalizedCoefficients {
  warehouseId: number
  warehouseName: string
  todayCoefficient: number
  averageCoefficient: number
  dailyCoefficients: DailyCoefficient[]
  byBoxType: BoxTypeCoefficients[]
  delivery: {
    baseLiterRub: number
    additionalLiterRub: number
    coefficient: number
  }
  storage: {
    baseLiterRub: number
    additionalLiterRub: number
    coefficient: number
  }
}

/** Options for acceptance coefficients hook */
export interface UseAcceptanceCoefficientsOptions {
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number
  /** Enable/disable the query */
  enabled?: boolean
}

// ============================================================================
// Data Transformation Functions
// ============================================================================

/**
 * Normalize coefficient from API (already decimals from backend, e.g., 1.65)
 * Negative values indicate unavailability, normalized to 0
 */
function normalizeCoefficient(rawCoeff: number): number {
  if (rawCoeff < 0) return 0
  return rawCoeff > 10 ? rawCoeff / 100 : rawCoeff
}

/** Get BoxType key from boxTypeId */
function getBoxTypeKey(boxTypeId: number): BoxType {
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

/** Transform API response to normalized coefficients with boxType grouping */
export function transformCoefficients(
  coefficients: AcceptanceCoefficient[]
): NormalizedCoefficients | null {
  if (!coefficients || coefficients.length === 0) return null

  const firstCoeff = coefficients[0]
  const byBoxTypeMap = new Map<BoxType, DailyCoefficient[]>()

  for (const c of coefficients) {
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

  const boxesCoeffs = byBoxTypeMap.get('boxes') || []
  const availableCoeffs = boxesCoeffs.filter(c => c.coefficient > 0)
  const avgCoeff =
    availableCoeffs.length > 0
      ? availableCoeffs.reduce((sum, c) => sum + c.coefficient, 0) / availableCoeffs.length
      : 1.0
  const todayCoeff = boxesCoeffs[0]?.coefficient ?? 1.0

  return {
    warehouseId: firstCoeff.warehouseId,
    warehouseName: firstCoeff.warehouseName,
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
