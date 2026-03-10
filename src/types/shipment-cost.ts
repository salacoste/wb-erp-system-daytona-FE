/**
 * Shipment Cost Allocation domain types
 * Epic 75-FE / 76-FE: Box Types, SKU Packaging, Shipments, Cost Calculation
 * Backend: Epic 79 (23 endpoints, 229 tests)
 * Source: docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md
 */

// ──────────────────────────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────────────────────────

export enum DeliveryMode {
  FIXED_VEHICLE = 'FIXED_VEHICLE',
  PER_PALLET = 'PER_PALLET',
}

export enum ShipmentStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
}

/** All 9 validation error codes from backend collect-all validation */
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

// ──────────────────────────────────────────────────────────────────
// Box Types
// ──────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────
// SKU Packaging
// ──────────────────────────────────────────────────────────────────

export interface SkuPackagingProduct {
  nmId: number
  vendorCode: string
  brand: string
  subject: string
}

export interface SkuPackagingBoxType {
  id: string
  name: string
  lengthCm: string
  widthCm: string
  heightCm: string
  volumeCm3: string
  isActive: boolean
}

export interface SkuPackaging {
  nmId: number
  cabinetId: string
  boxTypeId: string
  unitsPerBox: number
  boxType: SkuPackagingBoxType
  product: SkuPackagingProduct
  createdAt: string
  updatedAt: string
}

export interface SkuPackagingCreateRequest {
  nmId: number
  boxTypeId: string
  unitsPerBox: number
}

export interface SkuPackagingListParams {
  nmId?: number
  boxTypeId?: string
}

export interface SkuPackagingBulkRequest {
  items: SkuPackagingCreateRequest[]
}

export interface SkuPackagingBulkError {
  nmId: number
  error: string
}

export interface SkuPackagingBulkResponse {
  created: number
  updated: number
  errors: SkuPackagingBulkError[]
}

// ──────────────────────────────────────────────────────────────────
// Shipments
// ──────────────────────────────────────────────────────────────────

export interface BoxLine {
  id: string
  palletId: string
  nmId: number
  boxCount: number
  totalUnits: number | null
  unitCostRub: string | null // Decimal string, null before calculate
  boxVolume: string | null // Decimal string, null before calculate
  totalVolume: string | null // Decimal string, null before calculate
  volumeShare: string | null // Decimal string, null before calculate
  allocatedDeliveryCost: string | null
  deliveryCostPerUnit: string | null
  finalCostPerUnit: string | null
  finalCostLine: string | null
  createdAt: string
  updatedAt: string
}

export interface Pallet {
  id: string
  shipmentId: string
  palletNumber: number
  boxLines: BoxLine[]
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

// ──────────────────────────────────────────────────────────────────
// Validation & Calculation
// ──────────────────────────────────────────────────────────────────

export interface ValidationError {
  code: ValidationErrorCode
  message: string
  affectedIds?: string[]
}

/** /calculate response returns numbers (not Decimal strings) */
export interface CalculationResultItem {
  nmId: number
  productName: string
  unitCostRub: number // PCU — numbers from /calculate
  deliveryCostPerUnit: number // DCU
  finalCostPerUnit: number // FCU = PCU + DCU
  totalUnits: number
  finalCostLine: number // FCL = FCU × totalUnits
}
