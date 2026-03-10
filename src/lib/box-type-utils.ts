/**
 * Box Type Utilities
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Defines Wildberries box/delivery types with their storage formula differences:
 * - Boxes (2): Standard volume-based storage formula
 * - Pallets (5): Fixed rate storage (volume-independent!)
 * - Supersafe (6): Standard volume-based storage formula
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

// Re-export types and constants from extracted module
export type {
  BoxTypeId,
  StorageFormulaType,
  BoxTypeInfo,
  AcceptanceCoefficient,
} from './box-type-constants'
export { DEFAULT_BOX_TYPE_ID, BOX_TYPES, ALL_BOX_TYPE_IDS } from './box-type-constants'

import type { BoxTypeId, AcceptanceCoefficient } from './box-type-constants'
import { DEFAULT_BOX_TYPE_ID, BOX_TYPES } from './box-type-constants'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get box type information by ID
 *
 * @param boxTypeId - Box type ID (2, 5, or 6)
 * @returns Box type info, defaults to Boxes (2) for invalid IDs
 */
export function getBoxTypeInfo(boxTypeId: BoxTypeId) {
  // Handle invalid/undefined input - default to Boxes
  if (boxTypeId === undefined || boxTypeId === null) {
    return BOX_TYPES[DEFAULT_BOX_TYPE_ID]
  }

  // Return info for valid ID, or default to Boxes
  return BOX_TYPES[boxTypeId] ?? BOX_TYPES[DEFAULT_BOX_TYPE_ID]
}

/**
 * Check if a box type is available at a specific warehouse
 *
 * @param boxTypeId - Box type ID to check
 * @param coefficients - Array of acceptance coefficients from API
 * @param warehouseId - Warehouse ID to check availability for
 * @returns true if box type is available at the warehouse
 */
export function isBoxTypeAvailable(
  boxTypeId: BoxTypeId,
  coefficients: AcceptanceCoefficient[],
  warehouseId: number
): boolean {
  // Handle invalid warehouse ID
  if (warehouseId === undefined || warehouseId === null) {
    return false
  }

  // Handle empty or invalid coefficients
  if (!Array.isArray(coefficients) || coefficients.length === 0) {
    return false
  }

  // Find matching coefficient entry
  const match = coefficients.find(
    c =>
      c !== null &&
      c !== undefined &&
      c.warehouseId === warehouseId &&
      c.boxTypeId === boxTypeId &&
      c.isAvailable === true
  )

  return match !== undefined
}

/**
 * Get all available box types for a specific warehouse
 *
 * @param coefficients - Array of acceptance coefficients from API
 * @param warehouseId - Warehouse ID to filter by
 * @returns Sorted array of available box type IDs (unique, sorted)
 */
export function getAvailableBoxTypes(
  coefficients: AcceptanceCoefficient[],
  warehouseId: number
): BoxTypeId[] {
  // Handle empty or invalid coefficients
  if (!Array.isArray(coefficients) || coefficients.length === 0) {
    return []
  }

  // Handle invalid warehouse ID
  if (warehouseId === undefined || warehouseId === null) {
    return []
  }

  // Filter coefficients for this warehouse with isAvailable=true
  const availableTypes = coefficients
    .filter(
      c => c !== null && c !== undefined && c.warehouseId === warehouseId && c.isAvailable === true
    )
    .map(c => c.boxTypeId as BoxTypeId)

  // Remove duplicates and sort
  const uniqueTypes = [...new Set(availableTypes)]
  return uniqueTypes.sort((a, b) => a - b) as BoxTypeId[]
}

/**
 * Check if box type uses fixed storage formula
 *
 * @param boxTypeId - Box type ID
 * @returns true if storage is volume-independent (Pallets)
 */
export function isFixedStorageFormula(boxTypeId: BoxTypeId): boolean {
  const info = getBoxTypeInfo(boxTypeId)
  return info.storageFormula === 'fixed'
}

/**
 * Validate if a number is a valid BoxTypeId
 *
 * @param value - Number to validate
 * @returns true if value is 2, 5, or 6
 */
export function isValidBoxTypeId(value: number): value is BoxTypeId {
  return value === 2 || value === 5 || value === 6
}
