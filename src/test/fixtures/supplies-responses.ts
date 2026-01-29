/**
 * Test Fixtures for Supplies Module - Responses & Mutations
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Response fixtures for API mutations and list operations.
 */

import type {
  Supply,
  SuppliesListResponse,
  SupplyDetailResponse,
  CreateSupplyRequest,
  CreateSupplyResponse,
  AddOrdersRequest,
  AddOrdersResponse,
  RemoveOrdersRequest,
  RemoveOrdersResponse,
  CloseSupplyResponse,
  GenerateStickersRequest,
  GenerateStickersResponse,
} from '@/types/supplies'

import {
  mockSupplyOrder,
  mockSupplyOrder2,
  mockSupplyOrderNoName,
  mockStickerDocumentPng,
  mockStickerDocumentSvg,
  mockStickerDocumentZpl,
  mockBarcodeDocument,
  mockAcceptanceActDocument,
  mockSupplyListItemOpen,
  mockSupplyListItemClosed,
  mockSupplyListItemDelivering,
  mockSupplyListItemDelivered,
  mockSupplyListItemCancelled,
  mockSupplyListItemNoName,
  mockPagination,
  mockPaginationEmpty,
} from './supplies'

// =============================================================================
// Full Supply Fixtures
// =============================================================================

export const mockSupplyOpen: Supply = {
  ...mockSupplyListItemOpen,
  warehouseId: 507,
  warehouseName: 'Коледино',
  orders: [mockSupplyOrder, mockSupplyOrder2],
  documents: [],
}

export const mockSupplyClosed: Supply = {
  ...mockSupplyListItemClosed,
  warehouseId: 507,
  warehouseName: 'Коледино',
  orders: [mockSupplyOrder, mockSupplyOrder2, mockSupplyOrderNoName],
  documents: [mockStickerDocumentPng, mockBarcodeDocument],
}

export const mockSupplyDelivering: Supply = {
  ...mockSupplyListItemDelivering,
  warehouseId: 507,
  warehouseName: 'Коледино',
  orders: [mockSupplyOrder, mockSupplyOrder2],
  documents: [mockStickerDocumentPng, mockBarcodeDocument],
}

export const mockSupplyDelivered: Supply = {
  ...mockSupplyListItemDelivered,
  warehouseId: 507,
  warehouseName: 'Коледино',
  orders: [mockSupplyOrder],
  documents: [mockStickerDocumentPng, mockBarcodeDocument, mockAcceptanceActDocument],
}

export const mockSupplyCancelled: Supply = {
  ...mockSupplyListItemCancelled,
  warehouseId: null,
  warehouseName: null,
  orders: [],
  documents: [],
}

export const mockSupplyEmpty: Supply = {
  ...mockSupplyListItemNoName,
  warehouseId: null,
  warehouseName: null,
  orders: [],
  documents: [],
}

// =============================================================================
// List Response Fixtures
// =============================================================================

export const mockSuppliesListResponse: SuppliesListResponse = {
  items: [
    mockSupplyListItemOpen,
    mockSupplyListItemClosed,
    mockSupplyListItemDelivering,
    mockSupplyListItemDelivered,
    mockSupplyListItemCancelled,
  ],
  pagination: mockPagination,
  filters: { status: null, from: null, to: null },
}

export const mockSuppliesListResponseEmpty: SuppliesListResponse = {
  items: [],
  pagination: mockPaginationEmpty,
  filters: { status: null, from: null, to: null },
}

// =============================================================================
// Detail Response Fixtures
// =============================================================================

export const mockSupplyDetailResponse: SupplyDetailResponse = {
  ...mockSupplyOpen,
  syncRateLimit: { remaining: 5, resetAt: '2026-01-15T13:00:00.000Z' },
}

export const mockSupplyDetailResponseNoRateLimit: SupplyDetailResponse = { ...mockSupplyClosed }

// =============================================================================
// Create Supply Fixtures
// =============================================================================

export const mockCreateSupplyRequestEmpty: CreateSupplyRequest = {}
export const mockCreateSupplyRequestWithName: CreateSupplyRequest = { name: 'Новая поставка' }

export const mockCreateSupplyResponse: CreateSupplyResponse = {
  id: 'supply-new-001',
  wbSupplyId: 'WB-SUPPLY-NEW-12345',
  name: null,
  status: 'OPEN',
  createdAt: '2026-01-15T14:30:00.000Z',
}

// =============================================================================
// Add/Remove Orders Fixtures
// =============================================================================

export const mockAddOrdersRequest: AddOrdersRequest = {
  orderIds: ['order-001', 'order-002', 'order-003'],
}

export const mockAddOrdersResponse: AddOrdersResponse = {
  addedCount: 3,
  failures: [],
  totalOrdersCount: 8,
}

export const mockAddOrdersResponsePartial: AddOrdersResponse = {
  addedCount: 2,
  failures: [{ orderId: 'order-003', reason: 'Order already in another supply' }],
  totalOrdersCount: 7,
}

export const mockRemoveOrdersRequest: RemoveOrdersRequest = { orderIds: ['order-001'] }
export const mockRemoveOrdersResponse: RemoveOrdersResponse = {
  removedCount: 1,
  totalOrdersCount: 4,
}

// =============================================================================
// Close Supply & Stickers Fixtures
// =============================================================================

export const mockCloseSupplyResponse: CloseSupplyResponse = {
  status: 'CLOSED',
  closedAt: '2026-01-15T16:00:00.000Z',
  message: 'Supply closed successfully',
}

export const mockGenerateStickersRequestPng: GenerateStickersRequest = { format: 'png' }
export const mockGenerateStickersRequestSvg: GenerateStickersRequest = { format: 'svg' }
export const mockGenerateStickersRequestZpl: GenerateStickersRequest = { format: 'zpl' }

export const mockGenerateStickersResponsePng: GenerateStickersResponse = {
  document: mockStickerDocumentPng,
  data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYA...base64...',
  message: 'Stickers generated successfully',
}

export const mockGenerateStickersResponseSvg: GenerateStickersResponse = {
  document: mockStickerDocumentSvg,
  data: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53...base64...',
  message: 'Stickers generated successfully',
}

export const mockGenerateStickersResponseZpl: GenerateStickersResponse = {
  document: mockStickerDocumentZpl,
  message: 'Stickers generated successfully',
}
