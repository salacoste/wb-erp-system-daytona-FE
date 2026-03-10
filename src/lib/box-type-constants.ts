/**
 * Box Type Constants and Configuration
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Extracted from box-type-utils.ts for file size compliance.
 * Contains type definitions, configuration map, and default values.
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

// ============================================================================
// Type Definitions
// ============================================================================

/** Wildberries box/delivery type IDs */
export type BoxTypeId = 2 | 5 | 6

/** Storage formula type: standard (volume-based) or fixed (volume-independent) */
export type StorageFormulaType = 'standard' | 'fixed'

/** Box type metadata */
export interface BoxTypeInfo {
  /** Numeric ID matching WB API */
  id: BoxTypeId
  /** English name for API/logging */
  name: string
  /** Russian display name */
  nameRu: string
  /** Emoji icon for display */
  icon: string
  /** Russian description */
  description: string
  /** Storage calculation formula type */
  storageFormula: StorageFormulaType
}

/** Coefficient data from API for availability checking */
export interface AcceptanceCoefficient {
  warehouseId: number
  boxTypeId: number
  isAvailable?: boolean
}

// ============================================================================
// Constants
// ============================================================================

/** Default box type ID (Boxes - most common) */
export const DEFAULT_BOX_TYPE_ID: BoxTypeId = 2

/**
 * Box type configuration
 * Maps boxTypeId to display info and behavior
 *
 * CRITICAL: Pallets (5) use FIXED storage formula (volume-independent!)
 */
export const BOX_TYPES: Record<BoxTypeId, BoxTypeInfo> = {
  2: {
    id: 2,
    name: 'Boxes',
    nameRu: 'Коробки',
    icon: '📦',
    description: 'Стандартная поставка в коробках',
    storageFormula: 'standard',
  },
  5: {
    id: 5,
    name: 'Pallets',
    nameRu: 'Монопаллеты',
    icon: '🔲',
    description: 'Поставка на паллетах (фикс. ставка хранения)',
    storageFormula: 'fixed',
  },
  6: {
    id: 6,
    name: 'Supersafe',
    nameRu: 'Суперсейф',
    icon: '🔒',
    description: 'Безопасное хранение ценных товаров',
    storageFormula: 'standard',
  },
}

/** All valid box type IDs in sorted order */
export const ALL_BOX_TYPE_IDS: BoxTypeId[] = [2, 5, 6]
