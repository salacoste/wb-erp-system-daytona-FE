/**
 * Test Fixtures for Supply Mutations
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Centralized test data for supply mutation tests.
 * Based on backend API examples from test-api/16-supplies.http
 */

import type { SupplyListItem, CreateSupplyRequest, CreateSupplyResponse } from '@/types/supplies'

// =============================================================================
// Create Supply Request Fixtures
// =============================================================================

/** Request with custom name */
export const mockCreateSupplyRequestWithName: CreateSupplyRequest = {
  name: 'Поставка на склад Коледино',
}

/** Request without name (backend generates default) */
export const mockCreateSupplyRequestWithoutName: CreateSupplyRequest = {
  name: undefined,
}

/** Request with empty string name (treated as no name) */
export const mockCreateSupplyRequestEmptyName: CreateSupplyRequest = {
  name: '',
}

/** Request with max length name (100 chars) */
export const mockCreateSupplyRequestMaxLengthName: CreateSupplyRequest = {
  name: 'А'.repeat(100),
}

/** Request with name exceeding max length (for validation testing) */
export const mockCreateSupplyRequestTooLongName: CreateSupplyRequest = {
  name: 'А'.repeat(101),
}

// =============================================================================
// Create Supply Response Fixtures
// =============================================================================

/** Successful creation response with custom name */
export const mockCreateSupplyResponseWithName: CreateSupplyResponse = {
  id: 'sup_123abc',
  wbSupplyId: 'WB-SUPPLY-NEW-001',
  name: 'Поставка на склад Коледино',
  status: 'OPEN',
  ordersCount: 0,
  totalValue: 0,
  createdAt: '2026-03-05T10:30:00Z',
  closedAt: null,
  syncedAt: null,
}

/** Successful creation response with generated name */
export const mockCreateSupplyResponseWithGeneratedName: CreateSupplyResponse = {
  id: 'sup_456def',
  wbSupplyId: 'WB-SUPPLY-NEW-002',
  name: 'Поставка #42',
  status: 'OPEN',
  ordersCount: 0,
  totalValue: 0,
  createdAt: '2026-03-05T10:35:00Z',
  closedAt: null,
  syncedAt: null,
}

/** Successful creation - supply object for list update */
export const mockCreatedSupplyWithName: SupplyListItem = {
  id: 'sup_123abc',
  wbSupplyId: 'WB-SUPPLY-NEW-001',
  name: 'Поставка на склад Коледино',
  status: 'OPEN',
  ordersCount: 0,
  totalValue: 0,
  createdAt: '2026-03-05T10:30:00Z',
  closedAt: null,
  syncedAt: null,
}

/** Successful creation - supply with generated name */
export const mockCreatedSupplyGenerated: SupplyListItem = {
  id: 'sup_456def',
  wbSupplyId: 'WB-SUPPLY-NEW-002',
  name: 'Поставка #42',
  status: 'OPEN',
  ordersCount: 0,
  totalValue: 0,
  createdAt: '2026-03-05T10:35:00Z',
  closedAt: null,
  syncedAt: null,
}

// =============================================================================
// Optimistic Update Fixtures
// =============================================================================

/** Optimistic supply data (temporary, before server confirmation) */
export const mockOptimisticSupplyWithName: SupplyListItem = {
  id: 'temp-1709636400000',
  wbSupplyId: null,
  name: 'Поставка на склад Коледино',
  status: 'OPEN',
  ordersCount: 0,
  totalValue: 0,
  createdAt: new Date().toISOString(),
  closedAt: null,
  syncedAt: null,
}

/** Optimistic supply data without custom name */
export const mockOptimisticSupplyNoName: SupplyListItem = {
  id: 'temp-1709636400001',
  wbSupplyId: null,
  name: 'Новая поставка...',
  status: 'OPEN',
  ordersCount: 0,
  totalValue: 0,
  createdAt: new Date().toISOString(),
  closedAt: null,
  syncedAt: null,
}

/** Factory function for creating optimistic supply */
export function createOptimisticSupply(name?: string): SupplyListItem {
  return {
    id: `temp-${Date.now()}`,
    wbSupplyId: null,
    name: name || 'Новая поставка...',
    status: 'OPEN',
    ordersCount: 0,
    totalValue: 0,
    createdAt: new Date().toISOString(),
    closedAt: null,
    syncedAt: null,
  }
}

// =============================================================================
// Error Response Fixtures
// =============================================================================

/** Validation error - name too long */
export const mockValidationErrorNameTooLong = {
  status: 400,
  code: 'VALIDATION_ERROR',
  message: 'Максимум 100 символов',
  errors: [
    {
      field: 'name',
      message: 'Максимум 100 символов',
    },
  ],
}

/** Validation error - generic bad request */
export const mockValidationErrorBadRequest = {
  status: 400,
  code: 'BAD_REQUEST',
  message: 'Неверные данные запроса',
}

/** Unauthorized error */
export const mockUnauthorizedError = {
  status: 401,
  code: 'UNAUTHORIZED',
  message: 'Сессия истекла. Войдите снова.',
}

/** Forbidden error */
export const mockForbiddenError = {
  status: 403,
  code: 'FORBIDDEN',
  message: 'Нет доступа к этому кабинету',
}

/** Rate limit error */
export const mockRateLimitError = {
  status: 429,
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Слишком много запросов. Подождите.',
}

/** Server error */
export const mockServerError = {
  status: 500,
  code: 'INTERNAL_ERROR',
  message: 'Ошибка сервера. Попробуйте позже.',
}

/** Network error (no response) */
export const mockNetworkError = {
  status: 0,
  code: 'NETWORK_ERROR',
  message: 'Проверьте соединение и попробуйте снова',
}

// =============================================================================
// Supplies List Fixtures (for optimistic update context)
// =============================================================================

/** Existing supplies list (before adding new supply) */
export const mockExistingSuppliesList: SupplyListItem[] = [
  {
    id: 'sup_existing_001',
    wbSupplyId: 'WB-SUPPLY-40',
    name: 'Поставка #40',
    status: 'CLOSED',
    ordersCount: 15,
    totalValue: 75000,
    createdAt: '2026-03-01T09:00:00Z',
    closedAt: '2026-03-03T14:30:00Z',
    syncedAt: '2026-03-03T14:35:00Z',
  },
  {
    id: 'sup_existing_002',
    wbSupplyId: 'WB-SUPPLY-41',
    name: 'Поставка #41',
    status: 'DELIVERING',
    ordersCount: 8,
    totalValue: 32000,
    createdAt: '2026-03-04T11:00:00Z',
    closedAt: '2026-03-05T08:00:00Z',
    syncedAt: '2026-03-05T08:05:00Z',
  },
]

/** Supplies list response structure */
export const mockSuppliesListResponse = {
  items: mockExistingSuppliesList,
  pagination: {
    total: 42,
    limit: 20,
    offset: 0,
  },
}

/** Empty supplies list */
export const mockEmptySuppliesListResponse = {
  items: [] as SupplyListItem[],
  pagination: {
    total: 0,
    limit: 20,
    offset: 0,
  },
}
