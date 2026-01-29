/**
 * Test Fixtures for Supplies Module - Sync & Errors
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Error fixtures and sync response fixtures.
 */

import type { SyncSuppliesResponse, SuppliesErrorResponse } from '@/types/supplies'

// =============================================================================
// Sync Supplies Fixtures
// =============================================================================

export const mockSyncSuppliesResponse: SyncSuppliesResponse = {
  syncedCount: 5,
  statusChanges: [
    { supplyId: 'supply-002', oldStatus: 'CLOSED', newStatus: 'DELIVERING' },
    { supplyId: 'supply-003', oldStatus: 'DELIVERING', newStatus: 'DELIVERED' },
  ],
  errors: [],
  nextSyncAt: '2026-01-15T12:35:00.000Z',
}

export const mockSyncSuppliesResponseNoChanges: SyncSuppliesResponse = {
  syncedCount: 10,
  statusChanges: [],
  errors: [],
  nextSyncAt: '2026-01-15T12:35:00.000Z',
}

export const mockSyncSuppliesResponseWithErrors: SyncSuppliesResponse = {
  syncedCount: 8,
  statusChanges: [{ supplyId: 'supply-002', oldStatus: 'CLOSED', newStatus: 'DELIVERING' }],
  errors: [
    { supplyId: 'supply-007', error: 'WB API timeout' },
    { supplyId: 'supply-008', error: 'Supply not found in WB' },
  ],
  nextSyncAt: '2026-01-15T12:35:00.000Z',
}

// =============================================================================
// Error Response Fixtures
// =============================================================================

export const mockErrorNotFound: SuppliesErrorResponse = {
  code: 'SUPPLY_NOT_FOUND',
  message: 'Поставка не найдена',
}

export const mockErrorForbidden: SuppliesErrorResponse = {
  code: 'FORBIDDEN',
  message: 'Нет доступа к этой поставке',
}

export const mockErrorBadRequest: SuppliesErrorResponse = {
  code: 'BAD_REQUEST',
  message: 'Некорректные данные запроса',
  details: { field: 'orderIds', error: 'Array cannot be empty' },
}

export const mockErrorConflict: SuppliesErrorResponse = {
  code: 'CONFLICT',
  message: 'Поставка была изменена другим пользователем',
  details: { expectedVersion: 1, actualVersion: 2 },
}

export const mockErrorRateLimit: SuppliesErrorResponse = {
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Превышен лимит запросов. Следующий запрос доступен через 5 минут.',
  details: { retryAfter: 300, resetAt: '2026-01-15T12:35:00.000Z' },
}

export const mockErrorSupplyNotOpen: SuppliesErrorResponse = {
  code: 'SUPPLY_NOT_MODIFIABLE',
  message: 'Нельзя изменить закрытую поставку',
}

export const mockErrorSupplyEmpty: SuppliesErrorResponse = {
  code: 'SUPPLY_EMPTY',
  message: 'Нельзя закрыть пустую поставку',
}

export const mockErrorMaxOrdersExceeded: SuppliesErrorResponse = {
  code: 'MAX_ORDERS_EXCEEDED',
  message: 'Превышено максимальное количество заказов (1000)',
  details: { max: 1000, requested: 1500 },
}

export const mockErrorServerError: SuppliesErrorResponse = {
  code: 'INTERNAL_ERROR',
  message: 'Ошибка сервера. Попробуйте позже.',
}

export const mockErrorNetworkError: SuppliesErrorResponse = {
  code: 'NETWORK_ERROR',
  message: 'Не удалось загрузить данные. Проверьте соединение.',
}

// =============================================================================
// Blob Fixtures (for document download tests)
// =============================================================================

export const mockPngBlob = new Blob(['PNG content'], { type: 'image/png' })
export const mockSvgBlob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' })
export const mockZplBlob = new Blob(['^XA^FO...^XZ'], { type: 'application/octet-stream' })
export const mockPdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
