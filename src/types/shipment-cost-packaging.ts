/** Shipment Cost — SKU Packaging & Box Types (extracted for max-lines compliance) */

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
