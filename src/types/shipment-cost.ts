/** Shipment Cost Allocation domain types — Epic 75-76-FE / Backend Epic 79 */

export enum DeliveryMode {
  FIXED_VEHICLE = 'FIXED_VEHICLE',
  PER_PALLET = 'PER_PALLET',
}

export enum ShipmentStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}

export enum ValidationErrorCode {
  MISSING_COGS = 'MISSING_COGS',
  MISSING_PACKAGING = 'MISSING_PACKAGING',
  EMPTY_SHIPMENT = 'EMPTY_SHIPMENT',
  EMPTY_PALLET = 'EMPTY_PALLET',
  ZERO_UNITS = 'ZERO_UNITS',
  ZERO_VOLUME = 'ZERO_VOLUME',
  MISSING_DELIVERY_COST = 'MISSING_DELIVERY_COST',
  DUPLICATE_SKU_IN_PALLET = 'DUPLICATE_SKU_IN_PALLET',
  INVALID_BOX_COUNT = 'INVALID_BOX_COUNT',
}

export interface BoxType {
  id: string
  cabinetId: string
  name: string
  lengthCm: string // Decimal string from backend
  widthCm: string // Decimal string from backend
  heightCm: string // Decimal string from backend
  volumeCm3: string // Decimal string from backend
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BoxTypeCreateRequest {
  name: string
  lengthCm: number
  widthCm: number
  heightCm: number
}

export interface BoxTypeUpdateRequest {
  name?: string
  lengthCm?: number
  widthCm?: number
  heightCm?: number
}

export interface Pallet {
  id: string
  shipmentId: string
  palletNumber: number
  boxLines: import('./shipment-cost-packaging').BoxLine[]
  createdAt: string
  updatedAt: string
}

export interface Shipment {
  id: string
  cabinetId: string
  name: string | null
  deliveryMode: DeliveryMode
  totalDeliveryCost: string | null // Decimal string
  palletRate: string | null // Decimal string
  status: ShipmentStatus
  createdBy: string
  confirmedBy: string | null
  confirmedAt: string | null
  supplyId: string | null
  pallets: Pallet[]
  createdAt: string
  updatedAt: string
}

export interface ShipmentListResponse {
  data: Shipment[]
  total: number
  page: number
  limit: number
}

export interface ShipmentCreateRequest {
  name: string
  deliveryMode: DeliveryMode
  totalDeliveryCost?: number
  palletRate?: number
  createdBy: string
  supplyId?: string // Future feature: link to WB supply; no list endpoint yet
}

export interface ShipmentUpdateRequest {
  name?: string
  deliveryMode?: DeliveryMode
  totalDeliveryCost?: number | null
  palletRate?: number | null
}

export interface ShipmentListParams {
  status?: ShipmentStatus
  page?: number
  limit?: number
}

export interface ValidationError {
  code: string // Raw backend errorCode — normalize via BACKEND_CODE_MAP before display
  message: string
  affectedIds?: string[]
}

// Re-export packaging types from shipment-cost-packaging.ts (extracted for max-lines compliance)
export type {
  SkuPackagingProduct,
  SkuPackagingBoxType,
  SkuPackaging,
  SkuPackagingCreateRequest,
  SkuPackagingListParams,
  SkuPackagingBulkRequest,
  SkuPackagingBulkError,
  SkuPackagingBulkResponse,
  BoxLineCreateRequest,
  BoxLineUpdateRequest,
  BoxLine,
} from './shipment-cost-packaging'

// Re-export FCU calculation types from shipment-cost-fcu.ts (extracted for max-lines compliance)
export type {
  CalculateShipmentResponse,
  CalculationResultItem,
  ConfirmShipmentResponse,
  RecalculateShipmentResponse,
} from './shipment-cost-fcu'
