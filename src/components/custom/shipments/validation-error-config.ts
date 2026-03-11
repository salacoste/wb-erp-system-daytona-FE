/**
 * Validation error code → display config mapping
 * Epic 76-FE, Story 76.4: All 9 ValidationErrorCode types
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md §9
 */

import {
  AlertCircle,
  Box,
  Boxes,
  Hash,
  Package,
  PackageX,
  Ruler,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { ValidationErrorCode } from '@/types/shipment-cost'
import { ROUTES } from '@/lib/routes'

export interface ValidationErrorConfig {
  message: string
  icon: LucideIcon
  severity: 'error' | 'warning'
  /** Returns a navigation link for each affected ID, or null if no navigation */
  linkPattern?: (affectedId: string) => string
  linkLabel?: string
}

/**
 * Backend uses `errorCode` field. Some backend codes differ from frontend enum:
 * - Backend NO_PALLETS → frontend EMPTY_SHIPMENT
 * - Backend INVALID_BOX_VOLUME → frontend ZERO_VOLUME
 * - Backend NEGATIVE_DELIVERY_COST → frontend MISSING_DELIVERY_COST
 * - Backend ZERO_BOXES → frontend INVALID_BOX_COUNT
 * - Backend ZERO_PALLET_VOLUME → handled as ZERO_VOLUME
 */
export const BACKEND_CODE_MAP: Record<string, ValidationErrorCode> = {
  MISSING_COGS: ValidationErrorCode.MISSING_COGS,
  MISSING_PACKAGING: ValidationErrorCode.MISSING_PACKAGING,
  NO_PALLETS: ValidationErrorCode.EMPTY_SHIPMENT,
  EMPTY_PALLET: ValidationErrorCode.EMPTY_PALLET,
  ZERO_UNITS: ValidationErrorCode.ZERO_UNITS,
  INVALID_BOX_VOLUME: ValidationErrorCode.ZERO_VOLUME,
  ZERO_PALLET_VOLUME: ValidationErrorCode.ZERO_VOLUME,
  NEGATIVE_DELIVERY_COST: ValidationErrorCode.MISSING_DELIVERY_COST,
  ZERO_BOXES: ValidationErrorCode.INVALID_BOX_COUNT,
  DUPLICATE_SKU_IN_PALLET: ValidationErrorCode.DUPLICATE_SKU_IN_PALLET,
  // Also support frontend enum values directly (in case backend matches)
  EMPTY_SHIPMENT: ValidationErrorCode.EMPTY_SHIPMENT,
  ZERO_VOLUME: ValidationErrorCode.ZERO_VOLUME,
  MISSING_DELIVERY_COST: ValidationErrorCode.MISSING_DELIVERY_COST,
  INVALID_BOX_COUNT: ValidationErrorCode.INVALID_BOX_COUNT,
}

export const VALIDATION_ERROR_MAP: Record<ValidationErrorCode, ValidationErrorConfig> = {
  [ValidationErrorCode.MISSING_COGS]: {
    message: 'Не указана себестоимость товара',
    icon: AlertCircle,
    severity: 'error',
    linkPattern: nmId => `/products?filter=${nmId}`,
    linkLabel: 'Указать себестоимость',
  },
  [ValidationErrorCode.MISSING_PACKAGING]: {
    message: 'Не настроена упаковка товара',
    icon: PackageX,
    severity: 'error',
    linkPattern: () => ROUTES.SHIPMENTS.SKU_PACKAGING,
    linkLabel: 'Настроить упаковку',
  },
  [ValidationErrorCode.EMPTY_SHIPMENT]: {
    message: 'В отправке нет паллетов',
    icon: Package,
    severity: 'error',
  },
  [ValidationErrorCode.EMPTY_PALLET]: {
    message: 'Паллет не содержит товаров',
    icon: Boxes,
    severity: 'error',
  },
  [ValidationErrorCode.ZERO_UNITS]: {
    message: 'Количество единиц равно нулю',
    icon: Hash,
    severity: 'error',
  },
  [ValidationErrorCode.ZERO_VOLUME]: {
    message: 'Объём коробки равен нулю',
    icon: Ruler,
    severity: 'error',
  },
  [ValidationErrorCode.MISSING_DELIVERY_COST]: {
    message: 'Не указана стоимость доставки',
    icon: Truck,
    severity: 'error',
  },
  [ValidationErrorCode.DUPLICATE_SKU_IN_PALLET]: {
    message: 'Дублирование артикула в паллете',
    icon: Box,
    severity: 'warning',
  },
  [ValidationErrorCode.INVALID_BOX_COUNT]: {
    message: 'Некорректное количество коробок',
    icon: Box,
    severity: 'error',
  },
}
