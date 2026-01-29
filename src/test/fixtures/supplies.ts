/**
 * Test Fixtures for Supplies Module - Core Types & List Items
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Core fixtures for Supplies unit tests.
 */

import type {
  SupplyStatus,
  StickerFormat,
  DocumentType,
  SuppliesSortField,
  SortOrder,
  SupplyOrder,
  SupplyDocument,
  SupplyListItem,
  SuppliesPagination,
  SuppliesListParams,
} from '@/types/supplies'

// Re-export types for convenience
export type { SupplyStatus, StickerFormat, DocumentType, SuppliesSortField, SortOrder }

// =============================================================================
// Status Constants
// =============================================================================

export const SUPPLY_STATUSES: SupplyStatus[] = [
  'OPEN',
  'CLOSED',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
]

export const STICKER_FORMATS: StickerFormat[] = ['png', 'svg', 'zpl']
export const DOCUMENT_TYPES: DocumentType[] = ['sticker', 'barcode', 'acceptance_act']
export const SORT_FIELDS: SuppliesSortField[] = ['created_at', 'closed_at', 'orders_count']
export const SORT_ORDERS: SortOrder[] = ['asc', 'desc']

// =============================================================================
// Supply Order Fixtures
// =============================================================================

export const mockSupplyOrder: SupplyOrder = {
  orderId: '1234567890',
  orderUid: 'order-uid-abc123',
  nmId: 12345678,
  vendorCode: 'SKU-ABC-001',
  productName: 'Test Product Name',
  salePrice: 1200.0,
  supplierStatus: 'confirm',
  addedAt: '2026-01-15T10:30:00.000Z',
}

export const mockSupplyOrder2: SupplyOrder = {
  ...mockSupplyOrder,
  orderId: '1234567891',
  orderUid: 'order-uid-def456',
  vendorCode: 'SKU-DEF-002',
  productName: 'Another Product',
  salePrice: 2500.0,
  supplierStatus: 'complete',
}

export const mockSupplyOrderNoName: SupplyOrder = {
  ...mockSupplyOrder,
  orderId: '1234567892',
  orderUid: 'order-uid-ghi789',
  vendorCode: 'SKU-GHI-003',
  productName: null,
  salePrice: 800.0,
}

// =============================================================================
// Supply Document Fixtures
// =============================================================================

export const mockStickerDocumentPng: SupplyDocument = {
  type: 'sticker',
  format: 'png',
  generatedAt: '2026-01-16T09:00:00.000Z',
  downloadUrl: '/v1/supplies/supply-001/documents/sticker',
  sizeBytes: 245760,
}

export const mockStickerDocumentSvg: SupplyDocument = {
  ...mockStickerDocumentPng,
  format: 'svg',
  sizeBytes: 102400,
}

export const mockStickerDocumentZpl: SupplyDocument = {
  ...mockStickerDocumentPng,
  format: 'zpl',
  sizeBytes: 15360,
}

export const mockBarcodeDocument: SupplyDocument = {
  type: 'barcode',
  format: 'png',
  generatedAt: '2026-01-16T09:15:00.000Z',
  downloadUrl: '/v1/supplies/supply-001/documents/barcode',
  sizeBytes: 51200,
}

export const mockAcceptanceActDocument: SupplyDocument = {
  type: 'acceptance_act',
  format: 'pdf',
  generatedAt: '2026-01-16T09:20:00.000Z',
  downloadUrl: '/v1/supplies/supply-001/documents/acceptance_act',
  sizeBytes: 512000,
}

// =============================================================================
// Supply List Item Fixtures
// =============================================================================

export const mockSupplyListItemOpen: SupplyListItem = {
  id: 'supply-001',
  wbSupplyId: 'WB-SUPPLY-12345',
  name: 'Поставка январь',
  status: 'OPEN',
  ordersCount: 5,
  totalValue: 15000.0,
  createdAt: '2026-01-15T08:00:00.000Z',
  closedAt: null,
  syncedAt: '2026-01-15T12:00:00.000Z',
}

export const mockSupplyListItemClosed: SupplyListItem = {
  ...mockSupplyListItemOpen,
  id: 'supply-002',
  wbSupplyId: 'WB-SUPPLY-12346',
  name: 'Поставка срочная',
  status: 'CLOSED',
  ordersCount: 10,
  totalValue: 45000.0,
  closedAt: '2026-01-14T18:00:00.000Z',
}

export const mockSupplyListItemDelivering: SupplyListItem = {
  ...mockSupplyListItemClosed,
  id: 'supply-003',
  wbSupplyId: 'WB-SUPPLY-12347',
  name: null,
  status: 'DELIVERING',
  ordersCount: 25,
  totalValue: 125000.0,
}

export const mockSupplyListItemDelivered: SupplyListItem = {
  ...mockSupplyListItemClosed,
  id: 'supply-004',
  wbSupplyId: 'WB-SUPPLY-12348',
  name: 'Поставка выполнена',
  status: 'DELIVERED',
  ordersCount: 50,
  totalValue: 250000.0,
}

export const mockSupplyListItemCancelled: SupplyListItem = {
  ...mockSupplyListItemOpen,
  id: 'supply-005',
  wbSupplyId: 'WB-SUPPLY-12349',
  name: 'Отмененная поставка',
  status: 'CANCELLED',
  ordersCount: 3,
  totalValue: 9000.0,
}

export const mockSupplyListItemNoName: SupplyListItem = {
  ...mockSupplyListItemOpen,
  id: 'supply-006',
  wbSupplyId: 'WB-SUPPLY-12350',
  name: null,
  ordersCount: 0,
  totalValue: 0,
  syncedAt: null,
}

// =============================================================================
// Pagination & Params Fixtures
// =============================================================================

export const mockPagination: SuppliesPagination = { total: 150, limit: 20, offset: 0 }
export const mockPaginationPage2: SuppliesPagination = { total: 150, limit: 20, offset: 20 }
export const mockPaginationEmpty: SuppliesPagination = { total: 0, limit: 20, offset: 0 }

export const mockListParamsDefault: SuppliesListParams = {}
export const mockListParamsFiltered: SuppliesListParams = {
  status: 'OPEN',
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-01-31T23:59:59.000Z',
  sort_by: 'created_at',
  sort_order: 'desc',
  limit: 50,
  offset: 0,
}

// Document with no size (null sizeBytes)
export const mockDocumentNoSize: SupplyDocument = {
  ...mockStickerDocumentPng,
  sizeBytes: null,
}

// =============================================================================
// Re-exports from supplies-responses.ts
// =============================================================================

export {
  mockSupplyOpen,
  mockSupplyClosed,
  mockSupplyDelivering,
  mockSupplyDelivered,
  mockSupplyCancelled,
  mockSupplyEmpty,
  mockSuppliesListResponse,
  mockSuppliesListResponseEmpty,
  mockSuppliesListResponsePaginated,
  mockSupplyDetailResponse,
  mockSupplyDetailResponseNoRateLimit,
  mockCreateSupplyRequestEmpty,
  mockCreateSupplyRequestWithName,
  mockCreateSupplyResponse,
  mockAddOrdersRequest,
  mockAddOrdersResponse,
  mockAddOrdersResponsePartial,
  mockRemoveOrdersRequest,
  mockRemoveOrdersResponse,
  mockCloseSupplyResponse,
  mockGenerateStickersRequestPng,
  mockGenerateStickersRequestSvg,
  mockGenerateStickersRequestZpl,
  mockGenerateStickersResponsePng,
  mockGenerateStickersResponseSvg,
  mockGenerateStickersResponseZpl,
} from './supplies-responses'

// =============================================================================
// Error Fixtures
// =============================================================================

import type { SuppliesErrorResponse } from '@/types/supplies'

export const mockErrorNotFound: SuppliesErrorResponse = {
  code: 'SUPPLY_NOT_FOUND',
  message: 'Supply not found',
}

export const mockErrorForbidden: SuppliesErrorResponse = {
  code: 'FORBIDDEN',
  message: 'Access denied to this supply',
}

export const mockErrorNetworkError: SuppliesErrorResponse = {
  code: 'NETWORK_ERROR',
  message: 'Network error occurred',
}

export const mockErrorConflict: SuppliesErrorResponse = {
  code: 'CONFLICT',
  message: 'Supply has been modified',
  details: { currentVersion: 2 },
}

export const mockErrorRateLimit: SuppliesErrorResponse = {
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Rate limit exceeded',
  details: { retryAfter: 300 },
}

// =============================================================================
// Sync Response Fixtures
// =============================================================================

import type { SyncSuppliesResponse } from '@/types/supplies'

export const mockSyncSuppliesResponse: SyncSuppliesResponse = {
  syncedCount: 10,
  statusChanges: [
    { supplyId: 'supply-002', oldStatus: 'CLOSED', newStatus: 'DELIVERING' },
    { supplyId: 'supply-003', oldStatus: 'DELIVERING', newStatus: 'DELIVERED' },
  ],
  errors: [],
  nextSyncAt: '2026-01-15T13:05:00.000Z',
}

/** Mock response for sync with no changes */
export const mockSyncSuppliesResponseNoChanges: SyncSuppliesResponse = {
  syncedCount: 5,
  statusChanges: [],
  errors: [],
  nextSyncAt: '2026-01-15T13:05:00.000Z',
}

// =============================================================================
// Helper Function for Creating Mock Orders
// =============================================================================

export function createMockSupplyOrders(count: number): SupplyOrder[] {
  return Array.from({ length: count }, (_, i) => ({
    orderId: `order-${i + 1}`,
    orderUid: `order-uid-${i + 1}`,
    nmId: 10000000 + i,
    vendorCode: `SKU-${String(i + 1).padStart(3, '0')}`,
    productName: `Product ${i + 1}`,
    salePrice: 1000 + i * 100,
    supplierStatus: 'confirm',
    addedAt: new Date(Date.now() - i * 3600000).toISOString(),
  }))
}
