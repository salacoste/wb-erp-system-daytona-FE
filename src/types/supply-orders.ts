/**
 * Supply Order & Document Types
 * Extracted from supplies.ts for 200-line cap compliance.
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 */

import type { SupplyListItem, SupplyStatus, StickerFormat, DocumentType } from './supplies/core'

// =============================================================================
// Core Interfaces
// =============================================================================

/** Order within a supply */
export interface SupplyOrder {
  /** Order ID from WB */
  orderId: string
  /** Unique order identifier */
  orderUid: string
  /** Product article (nm_id) */
  nmId: number
  /** Vendor code (SKU) */
  vendorCode: string
  /** Product name (can be null) */
  productName: string | null
  /** Sale price in rubles — null when backend has no price data (validation #205) */
  salePrice: number | null
  /** Supplier status from WB */
  supplierStatus: string
  /** When order was added to supply */
  addedAt: string
}

/** Document attached to a supply */
export interface SupplyDocument {
  /** Document type */
  type: DocumentType
  /** File format */
  format: string
  /** When document was generated */
  generatedAt: string
  /** URL to download document */
  downloadUrl: string
  /** File size in bytes (null if unknown) */
  sizeBytes: number | null
}

// =============================================================================
// Supply Detail (extends SupplyListItem with orders/documents)
// =============================================================================

/** Full supply with orders and documents */
export interface Supply extends SupplyListItem {
  /** Target warehouse ID (null if not assigned) */
  warehouseId: number | null
  /** Target warehouse name (null if not assigned) */
  warehouseName: string | null
  /** Orders in this supply */
  orders: SupplyOrder[]
  /** Generated documents */
  documents: SupplyDocument[]
}

/** Supply detail response (extends Supply) */
export interface SupplyDetailResponse extends Supply {
  syncRateLimit?: {
    remaining: number
    resetAt: string
  }
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/** Request to add orders to a supply */
export interface AddOrdersRequest {
  orderIds: string[]
}

/** Response from adding orders — matches backend AddOrdersResultDto verbatim (no normalizer). */
export interface AddOrdersResponse {
  /** Number of orders successfully added */
  added: number
  /** Number of orders that failed to add */
  failed: number
  /** Error messages for failed orders (present only on partial/total failure) */
  errors?: string[]
}

/** Request to remove orders from a supply */
export interface RemoveOrdersRequest {
  orderIds: string[]
}

/** Response from removing orders */
export interface RemoveOrdersResponse {
  removedCount: number
  totalOrdersCount: number
}

/** Response from closing a supply */
export interface CloseSupplyResponse {
  status: SupplyStatus
  closedAt: string
  message: string
}

/** Request to generate stickers */
export interface GenerateStickersRequest {
  format: StickerFormat
}

/** Response from generating stickers */
export interface GenerateStickersResponse {
  document: SupplyDocument
  data?: string
  message: string
}

/** Status change info from sync */
export interface SupplyStatusChange {
  supplyId: string
  oldStatus: SupplyStatus
  newStatus: SupplyStatus
}
