/**
 * Test Fixtures for Orders Module
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Centralized test data for Orders unit tests.
 * Based on backend API examples from test-api/14-orders.http
 */

import type {
  OrderFbsItem,
  OrderFbsDetails,
  OrdersListResponse,
  TriggerSyncResponse,
  SyncStatusResponse,
  SupplierStatus,
  WbStatus,
} from '@/types/orders'

import type {
  LocalHistoryResponse,
  WbHistoryResponse,
  FullHistoryResponse,
  FullHistoryEntry,
} from '@/types/orders-history'

import type {
  VelocityMetricsResponse,
  SlaMetricsResponse,
  VolumeMetricsResponse,
} from '@/types/orders-analytics'

// =============================================================================
// Status Constants
// =============================================================================

export const SUPPLIER_STATUSES: SupplierStatus[] = ['new', 'confirm', 'complete', 'cancel']

export const WB_STATUSES: WbStatus[] = [
  'waiting',
  'sorted',
  'sold',
  'canceled',
  'canceled_by_client',
  'defect',
]

// =============================================================================
// Order Item Fixtures
// =============================================================================

export const mockOrderFbsItem: OrderFbsItem = {
  orderId: '1234567890',
  orderUid: 'order-uid-abc123',
  nmId: 12345678,
  vendorCode: 'SKU-ABC-001',
  productName: 'Test Product Name',
  price: 1500.0,
  salePrice: 1200.0,
  supplierStatus: 'new',
  wbStatus: 'waiting',
  warehouseId: 507,
  deliveryType: 'fbs',
  isB2B: false,
  cargoType: 'MGT',
  createdAt: '2026-01-04T10:30:00.000Z',
  statusUpdatedAt: '2026-01-04T11:00:00.000Z',
}

export const mockOrderFbsItemConfirmed: OrderFbsItem = {
  ...mockOrderFbsItem,
  orderId: '1234567891',
  supplierStatus: 'confirm',
  wbStatus: 'sorted',
  statusUpdatedAt: '2026-01-04T12:00:00.000Z',
}

export const mockOrderFbsItemCompleted: OrderFbsItem = {
  ...mockOrderFbsItem,
  orderId: '1234567892',
  supplierStatus: 'complete',
  wbStatus: 'sold',
  statusUpdatedAt: '2026-01-04T15:00:00.000Z',
}

export const mockOrderFbsItemCanceled: OrderFbsItem = {
  ...mockOrderFbsItem,
  orderId: '1234567893',
  supplierStatus: 'cancel',
  wbStatus: 'canceled',
  statusUpdatedAt: '2026-01-04T11:30:00.000Z',
}

// =============================================================================
// Order Details Fixtures
// =============================================================================

export const mockOrderFbsDetails: OrderFbsDetails = {
  ...mockOrderFbsItem,
  supplierStatus: 'confirm',
  wbStatus: 'sorted',
  chrtId: 987654321,
  address: {
    fullAddress: 'г. Москва, ул. Примерная, д. 1',
    longitude: 37.6176,
    latitude: 55.7558,
  },
  statusHistory: [
    {
      supplierStatus: 'new',
      wbStatus: 'waiting',
      changedAt: '2026-01-04T10:30:00.000Z',
    },
    {
      supplierStatus: 'confirm',
      wbStatus: 'sorted',
      changedAt: '2026-01-04T12:00:00.000Z',
    },
  ],
  processingTimeSeconds: 5400,
  syncedAt: '2026-01-04T12:05:00.000Z',
}

export const mockOrderFbsDetailsNoAddress: OrderFbsDetails = {
  ...mockOrderFbsDetails,
  address: null,
}

// =============================================================================
// Orders List Response Fixtures
// =============================================================================

export const mockOrdersListResponse: OrdersListResponse = {
  items: [mockOrderFbsItem, mockOrderFbsItemConfirmed, mockOrderFbsItemCompleted],
  pagination: {
    total: 150,
    limit: 100,
    offset: 0,
  },
  query: {
    from: null,
    to: null,
  },
}

export const mockOrdersListResponseEmpty: OrdersListResponse = {
  items: [],
  pagination: {
    total: 0,
    limit: 100,
    offset: 0,
  },
  query: {
    from: null,
    to: null,
  },
}

export const mockOrdersListResponseFiltered: OrdersListResponse = {
  items: [mockOrderFbsItem],
  pagination: {
    total: 1,
    limit: 50,
    offset: 0,
  },
  query: {
    from: '2026-01-01',
    to: '2026-01-07',
  },
}

/** Alias for empty orders list response */
export const mockEmptyOrdersListResponse: OrdersListResponse = mockOrdersListResponseEmpty

/** Paginated orders response (page 2 of 3) */
export const mockPaginatedOrdersResponse: OrdersListResponse = {
  items: [mockOrderFbsItemConfirmed, mockOrderFbsItemCompleted],
  pagination: {
    total: 250,
    limit: 100,
    offset: 100,
  },
  query: {
    from: null,
    to: null,
  },
}

// =============================================================================
// Local History Fixtures
// =============================================================================

export const mockLocalHistoryResponse: LocalHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  currentStatus: {
    supplierStatus: 'complete',
    wbStatus: 'sold',
    isFinal: true,
  },
  history: [
    {
      id: 'uuid-1234-5678',
      oldSupplierStatus: null,
      newSupplierStatus: 'new',
      oldWbStatus: null,
      newWbStatus: 'waiting',
      changedAt: '2026-01-02T10:00:00.000Z',
      durationMinutes: null,
    },
    {
      id: 'uuid-2345-6789',
      oldSupplierStatus: 'new',
      newSupplierStatus: 'confirm',
      oldWbStatus: 'waiting',
      newWbStatus: 'sorted',
      changedAt: '2026-01-02T12:30:00.000Z',
      durationMinutes: 150,
    },
    {
      id: 'uuid-3456-7890',
      oldSupplierStatus: 'confirm',
      newSupplierStatus: 'complete',
      oldWbStatus: 'sorted',
      newWbStatus: 'sold',
      changedAt: '2026-01-02T16:00:00.000Z',
      durationMinutes: 210,
    },
  ],
  summary: {
    totalTransitions: 3,
    totalDurationMinutes: 360,
    createdAt: '2026-01-02T10:00:00.000Z',
    completedAt: '2026-01-02T16:00:00.000Z',
  },
}

export const mockLocalHistoryResponseEmpty: LocalHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  currentStatus: {
    supplierStatus: 'new',
    wbStatus: 'waiting',
    isFinal: false,
  },
  history: [],
  summary: {
    totalTransitions: 0,
    totalDurationMinutes: null,
    createdAt: '2026-01-02T10:00:00.000Z',
    completedAt: null,
  },
}

// =============================================================================
// WB Native History Fixtures
// =============================================================================

export const mockWbHistoryResponse: WbHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  wbHistory: [
    {
      id: 'uuid-1234-5678',
      wbStatusCode: 'created',
      wbStatusChangedAt: '2026-01-02T10:00:00.000Z',
      durationMinutes: null,
    },
    {
      id: 'uuid-2345-6789',
      wbStatusCode: 'assembling',
      wbStatusChangedAt: '2026-01-02T10:30:00.000Z',
      durationMinutes: 30,
    },
    {
      id: 'uuid-3456-7890',
      wbStatusCode: 'sorted_by_wh',
      wbStatusChangedAt: '2026-01-02T11:00:00.000Z',
      durationMinutes: 30,
    },
    {
      id: 'uuid-4567-8901',
      wbStatusCode: 'received_by_client',
      wbStatusChangedAt: '2026-01-03T15:30:00.000Z',
      durationMinutes: 1770,
    },
  ],
  summary: {
    totalTransitions: 4,
    totalDurationMinutes: 1770,
    currentWbStatus: 'received_by_client',
    createdAt: '2026-01-02T10:00:00.000Z',
    lastUpdatedAt: '2026-01-03T15:30:00.000Z',
  },
}

// =============================================================================
// Full History Fixtures (Merged)
// =============================================================================

export const mockFullHistoryLocalEntry: FullHistoryEntry = {
  source: 'local',
  oldSupplierStatus: null,
  newSupplierStatus: 'new',
  oldWbStatus: null,
  newWbStatus: 'waiting',
  timestamp: '2026-01-02T10:05:00.000Z',
}

export const mockFullHistoryWbNativeEntry: FullHistoryEntry = {
  source: 'wb_native',
  wbStatusCode: 'created',
  timestamp: '2026-01-02T10:00:00.000Z',
}

export const mockFullHistoryResponse: FullHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  fullHistory: [
    {
      source: 'wb_native',
      wbStatusCode: 'created',
      timestamp: '2026-01-02T10:00:00.000Z',
    },
    {
      source: 'local',
      oldSupplierStatus: null,
      newSupplierStatus: 'new',
      oldWbStatus: null,
      newWbStatus: 'waiting',
      timestamp: '2026-01-02T10:05:00.000Z',
    },
    {
      source: 'wb_native',
      wbStatusCode: 'assembling',
      timestamp: '2026-01-02T10:30:00.000Z',
    },
    {
      source: 'local',
      oldSupplierStatus: 'new',
      newSupplierStatus: 'confirm',
      oldWbStatus: 'waiting',
      newWbStatus: 'sorted',
      timestamp: '2026-01-02T12:30:00.000Z',
    },
    {
      source: 'wb_native',
      wbStatusCode: 'sorted_by_wh',
      timestamp: '2026-01-02T14:00:00.000Z',
    },
  ],
  summary: {
    localEntriesCount: 2,
    wbNativeEntriesCount: 3,
    totalEntriesCount: 5,
  },
}

// =============================================================================
// Sync Status Fixtures
// =============================================================================

export const mockTriggerSyncResponse: TriggerSyncResponse = {
  jobId: 'orders-fbs-sync:f75836f7-c0bc-4b2c-823c-a1f3508cce8e:1704387600000',
  message: 'Orders sync job enqueued',
}

export const mockSyncStatusResponse: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: '2026-01-04T10:00:00.000Z',
  nextSyncAt: '2026-01-04T10:05:00.000Z',
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

export const mockSyncStatusResponseDisabled: SyncStatusResponse = {
  enabled: false,
  lastSyncAt: null,
  nextSyncAt: null,
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - idle (waiting for next scheduled sync) */
export const mockSyncStatusIdle: SyncStatusResponse = mockSyncStatusResponse

/** Sync status - syncing (in progress) */
export const mockSyncStatusSyncing: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: '2026-01-04T10:00:00.000Z',
  nextSyncAt: '2026-01-04T10:05:00.000Z',
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - completed (just finished) */
export const mockSyncStatusCompleted: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: '2026-01-04T10:05:00.000Z',
  nextSyncAt: '2026-01-04T10:10:00.000Z',
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - failed (error state) */
export const mockSyncStatusFailed: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: '2026-01-04T09:55:00.000Z',
  nextSyncAt: '2026-01-04T10:05:00.000Z',
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

// =============================================================================
// Analytics Fixtures
// =============================================================================

export const mockVelocityMetricsResponse: VelocityMetricsResponse = {
  avgConfirmationTimeMinutes: 35.5,
  avgCompletionTimeMinutes: 240.0,
  p50ConfirmationMinutes: 28.0,
  p95ConfirmationMinutes: 90.0,
  p99ConfirmationMinutes: 120.0,
  p50CompletionMinutes: 200.0,
  p95CompletionMinutes: 480.0,
  p99CompletionMinutes: 720.0,
  byWarehouse: {
    '507': { avgConfirmation: 30, avgCompletion: 180 },
    '508': { avgConfirmation: 40, avgCompletion: 220 },
  },
  byDeliveryType: {
    fbs: { avgConfirmation: 35, avgCompletion: 200 },
  },
  totalOrders: 150,
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
  },
}

export const mockSlaMetricsResponse: SlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 95.5,
  completionCompliancePercent: 92.3,
  pendingOrdersCount: 12,
  atRiskTotal: 45,
  atRiskOrders: [
    {
      orderId: '1234567890',
      createdAt: '2026-01-04T10:00:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 25,
      riskType: 'confirmation',
      isBreached: false,
    },
    {
      orderId: '9876543210',
      createdAt: '2026-01-03T08:00:00.000Z',
      currentStatus: 'confirm',
      minutesRemaining: -30,
      riskType: 'completion',
      isBreached: true,
    },
  ],
  breachedCount: 2,
}

export const mockVolumeMetricsResponse: VolumeMetricsResponse = {
  hourlyTrend: [
    { hour: 9, count: 15 },
    { hour: 10, count: 22 },
    { hour: 14, count: 35 },
    { hour: 15, count: 30 },
  ],
  dailyTrend: [
    { date: '2026-01-01', count: 120 },
    { date: '2026-01-02', count: 135 },
    { date: '2026-01-03', count: 110 },
  ],
  peakHours: [14, 15, 10],
  cancellationRate: 3.5,
  b2bPercentage: 12.0,
  totalOrders: 500,
  statusBreakdown: [
    { status: 'complete', count: 400, percentage: 80.0 },
    { status: 'cancel', count: 18, percentage: 3.6 },
    { status: 'new', count: 50, percentage: 10.0 },
    { status: 'confirm', count: 32, percentage: 6.4 },
  ],
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
  },
}

/** SLA metrics with no at-risk orders */
export const mockSlaMetricsWithNoRisk: SlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 100.0,
  completionCompliancePercent: 100.0,
  pendingOrdersCount: 0,
  atRiskTotal: 0,
  atRiskOrders: [],
  breachedCount: 0,
}

/** Empty volume metrics (no orders in period) */
export const mockEmptyVolumeMetricsResponse: VolumeMetricsResponse = {
  hourlyTrend: [],
  dailyTrend: [],
  peakHours: [],
  cancellationRate: 0,
  b2bPercentage: 0,
  totalOrders: 0,
  statusBreakdown: [],
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
  },
}

// =============================================================================
// Story 40.4-FE: Order Details Modal Fixtures
// =============================================================================

/** Alias for mockOrderFbsDetails - used in modal header tests */
export const mockOrderDetails = mockOrderFbsDetails

/** Order details with product image (for modal header display) */
export const mockOrderDetailsWithImage: OrderFbsDetails = {
  ...mockOrderFbsDetails,
  orderId: 'order-modal-001',
  productName: 'Футболка мужская хлопок 100% премиум качества с принтом и длинным названием товара',
}

/** Order details without product image (for placeholder fallback) */
export const mockOrderDetailsNoImage: OrderFbsDetails = {
  ...mockOrderFbsDetails,
  orderId: 'order-modal-002',
  productName: 'Носки',
}

/** Order with discounted price (for strikethrough display) */
export const mockOrderDetailsDiscounted: OrderFbsDetails = {
  ...mockOrderFbsDetails,
  orderId: 'order-modal-003',
  salePrice: 1200.0,
}

/** Empty full history response */
export const mockEmptyFullHistoryResponse: FullHistoryResponse = {
  orderId: 'order-empty',
  orderUid: 'UID-EMPTY',
  fullHistory: [],
  summary: {
    localEntriesCount: 0,
    wbNativeEntriesCount: 0,
    totalEntriesCount: 0,
  },
}

/** Empty local history response */
export const mockEmptyLocalHistoryResponse: LocalHistoryResponse = {
  orderId: 'order-empty',
  orderUid: 'UID-EMPTY',
  currentStatus: {
    supplierStatus: 'new',
    wbStatus: 'waiting',
    isFinal: false,
  },
  history: [],
  summary: {
    totalTransitions: 0,
    totalDurationMinutes: null,
    createdAt: '2026-01-04T10:00:00.000Z',
    completedAt: null,
  },
}

/** Empty WB history response (not synced yet) */
export const mockEmptyWbHistoryResponse: WbHistoryResponse = {
  orderId: 'order-empty',
  orderUid: 'UID-EMPTY',
  wbHistory: [],
  summary: {
    totalTransitions: 0,
    totalDurationMinutes: null,
    currentWbStatus: null,
    createdAt: '2026-01-04T10:00:00.000Z',
    lastUpdatedAt: null,
  },
}

/** WB history with unknown status code (for fallback display testing) */
export const mockWbHistoryWithUnknownStatus: WbHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  wbHistory: [
    {
      id: 'uuid-1234-5678',
      wbStatusCode: 'created',
      wbStatusChangedAt: '2026-01-02T10:00:00.000Z',
      durationMinutes: null,
    },
    {
      id: 'uuid-unknown',
      wbStatusCode: 'unknown_new_status_2026',
      wbStatusChangedAt: '2026-01-02T11:00:00.000Z',
      durationMinutes: 60,
    },
  ],
  summary: {
    totalTransitions: 2,
    totalDurationMinutes: 60,
    currentWbStatus: 'unknown_new_status_2026',
    createdAt: '2026-01-02T10:00:00.000Z',
    lastUpdatedAt: '2026-01-02T11:00:00.000Z',
  },
}

// =============================================================================
// Error Fixtures for Modal Testing
// =============================================================================

export const mockOrderNotFoundError = {
  status: 404,
  code: 'ORDER_NOT_FOUND',
  message: 'Заказ не найден',
}

export const mockUnauthorizedError = {
  status: 401,
  code: 'UNAUTHORIZED',
  message: 'Сессия истекла. Войдите снова.',
}

export const mockForbiddenError = {
  status: 403,
  code: 'FORBIDDEN',
  message: 'Нет доступа к этому заказу',
}

export const mockServerError = {
  status: 500,
  code: 'INTERNAL_ERROR',
  message: 'Ошибка сервера. Попробуйте позже.',
}

export const mockNetworkError = {
  status: 0,
  code: 'NETWORK_ERROR',
  message: 'Не удалось загрузить данные. Проверьте соединение.',
}

// =============================================================================
// Duration Calculation Helper for Tests
// =============================================================================

/**
 * Calculate expected duration string between two timestamps
 * Used for verifying timeline duration displays
 */
export function getExpectedDuration(from: string, to: string): string {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} д ${hours % 24} ч`
  }
  if (hours > 0) {
    return `${hours} ч ${minutes % 60} мин`
  }
  return `${minutes} мин`
}
