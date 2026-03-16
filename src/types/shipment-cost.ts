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

export interface BoxLineCreateRequest {
  nmId: number
  boxCount: number
  totalUnits?: number
}
export interface BoxLineUpdateRequest {
  boxCount?: number
  totalUnits?: number
}
export interface BoxLine {
  id: string
  palletId: string
  nmId: number
  boxCount: number
  totalUnits: number | null
  unitCostRub: string | null // Decimal, null before calculate
  boxVolume: string | null
  totalVolume: string | null
  volumeShare: string | null
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

/** /calculate response — returns numbers (not Decimal strings); validation failure throws ApiError */
export interface CalculateShipmentResponse {
  results: CalculationResultItem[]
}
export interface CalculationResultItem {
  nmId: number
  productName: string
  unitCostRub: number
  deliveryCostPerUnit: number
  finalCostPerUnit: number
  totalUnits: number
  finalCostLine: number
}

/** /confirm response — shortened ConfirmShipmentResponseDto, NOT full ShipmentResponseDto */
export interface ConfirmShipmentResponse {
  shipmentId: string
  status: 'CONFIRMED'
  confirmedAt: string // ISO 8601
  confirmedBy: string
  snapshotCount: number
  totalFinalCost: number
}

/** /recalculate response — shortened RecalculateShipmentResponseDto */
export interface RecalculateShipmentResponse {
  shipmentId: string
  status: 'CONFIRMED'
  recalculatedAt: string // ISO 8601
  snapshotCount: number
  previousSnapshotCount: number
  totalFinalCost: number
}
