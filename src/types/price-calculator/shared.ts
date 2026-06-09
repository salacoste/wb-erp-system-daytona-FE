/**
 * Price Calculator — Shared Types (Tax, Fulfillment, Box, Auto-fill, Product Dims, Delivery)
 * Extracted from price-calculator.ts (Story 99.1-FE)
 */

// Re-export from box-type-utils for convenience
export type { BoxTypeId, BoxTypeInfo } from '@/lib/box-type-utils'
export {
  BOX_TYPES,
  DEFAULT_BOX_TYPE_ID,
  ALL_BOX_TYPE_IDS,
  getBoxTypeInfo,
  isBoxTypeAvailable,
  getAvailableBoxTypes,
  isFixedStorageFormula,
  isValidBoxTypeId,
} from '@/lib/box-type-utils'

// Re-export product types from extracted module for backward compatibility
export type {
  ProductDimensionsMm,
  CategoryHierarchy,
  ProductWithDimensions,
  ProductsWithDimensionsResponse,
  GetProductsWithDimensionsParams,
} from './shared-product-types'

import type { CategoryHierarchy } from './shared-product-types'

// ============================================================================
// Tax Types (Story 44.17)
// ============================================================================

export type TaxType = 'income' | 'profit'

export interface TaxConfiguration {
  tax_rate_pct: number
  tax_type: TaxType
}

export interface TaxPreset {
  id: string
  name: string
  rate: number
  type: TaxType
  description: string
}

// ============================================================================
// Fulfillment Types (Story 44.15)
// ============================================================================

export type FulfillmentType = 'FBO' | 'FBS'

export const COMMISSION_FIELD_MAP = {
  FBO: 'paidStorageKgvp',
  FBS: 'kgvpMarketplace',
} as const

// ============================================================================
// Box Type & Localization (Story 44.32)
// ============================================================================

export type BoxType = 'box' | 'pallet'

export const BOX_TYPE_CONFIG: Record<
  BoxType,
  {
    label: string
    description: string
    apiId: number
  }
> = {
  box: {
    label: 'Короб',
    description: 'Стандартная доставка в коробе',
    apiId: 2,
  },
  pallet: {
    label: 'Монопаллета',
    description: 'Крупногабаритные товары на паллете',
    apiId: 5,
  },
} as const

export const LOCALIZATION_RANGES = {
  MIN: 0.5,
  MAX: 3.0,
  STEP: 0.1,
  DEFAULT: 1.0,
  ZONES: {
    central: { min: 1.0, max: 1.2, label: 'Центральный ФО' },
    regional: { min: 1.3, max: 1.7, label: 'Регионы' },
    remote: { min: 1.8, max: 2.5, label: 'Дальний Восток / Крайний Север' },
  } as const,
} as const

// ============================================================================
// Auto-fill Types (Story 44.26b)
// ============================================================================

export type AutoFillSource = 'auto' | 'manual'
export type AutoFillStatus = 'auto' | 'modified' | 'none'

export interface DimensionAutoFillState {
  source: AutoFillSource
  originalValues: {
    length_cm: number
    width_cm: number
    height_cm: number
    volume_liters: number
  } | null
  status: AutoFillStatus
}

export interface CategoryAutoFillState {
  source: AutoFillSource
  isLocked: boolean
  originalCategory: CategoryHierarchy | null
}

// ============================================================================
// Delivery Date Types (Story 44.26a-FE)
// ============================================================================

export type DeliveryDateStatus = 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'

export interface DeliveryDateState {
  date: string | null
  coefficient: number
  formattedDate: string
  status: DeliveryDateStatus
}

export interface CoefficientDay {
  date: string
  coefficient: number
  isAvailable: boolean
  isSelected: boolean
  status: DeliveryDateStatus
}
