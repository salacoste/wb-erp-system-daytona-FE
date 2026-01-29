/**
 * Test Fixtures for Orders Module - Core Types
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 */

import type { SupplierStatus, WbStatus } from '@/types/orders'

// Status Constants
export const SUPPLIER_STATUSES: SupplierStatus[] = ['new', 'confirm', 'complete', 'cancel']
export const WB_STATUSES: WbStatus[] = [
  'waiting',
  'sorted',
  'sold',
  'canceled',
  'canceled_by_client',
  'defect',
]

// Order Item Fixture
export const mockOrderFbsItem = {
  orderId: '1234567890',
  orderUid: 'order-uid-abc123',
  nmId: 12345678,
  vendorCode: 'SKU-ABC-001',
  productName: 'Test Product Name',
  price: 1500.0,
  salePrice: 1200.0,
  supplierStatus: 'new' as const,
  wbStatus: 'waiting' as const,
  warehouseId: 507,
  deliveryType: 'fbs',
  isB2B: false,
  cargoType: 'MGT',
  createdAt: '2026-01-04T10:30:00.000Z',
  statusUpdatedAt: '2026-01-04T11:00:00.000Z',
}

// Order Details Fixture
export const mockOrderFbsDetails = {
  ...mockOrderFbsItem,
  supplierStatus: 'confirm' as const,
  wbStatus: 'sorted' as const,
  chrtId: 987654321,
  address: { fullAddress: 'г. Москва, ул. Примерная, д. 1', longitude: 37.6176, latitude: 55.7558 },
  statusHistory: [
    {
      supplierStatus: 'new' as const,
      wbStatus: 'waiting' as const,
      changedAt: '2026-01-04T10:30:00.000Z',
    },
    {
      supplierStatus: 'confirm' as const,
      wbStatus: 'sorted' as const,
      changedAt: '2026-01-04T12:00:00.000Z',
    },
  ],
  processingTimeSeconds: 5400,
  syncedAt: '2026-01-04T12:05:00.000Z',
}

// Orders List Response
export const mockOrdersListResponse = {
  items: [mockOrderFbsItem],
  pagination: { total: 150, limit: 100, offset: 0 },
  query: { from: null, to: null },
}

// Local History Response
export const mockLocalHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  currentStatus: { supplierStatus: 'complete' as const, wbStatus: 'sold' as const, isFinal: true },
  history: [
    {
      id: 'uuid-1',
      oldSupplierStatus: null,
      newSupplierStatus: 'new' as const,
      oldWbStatus: null,
      newWbStatus: 'waiting' as const,
      changedAt: '2026-01-02T10:00:00.000Z',
      durationMinutes: null,
    },
    {
      id: 'uuid-2',
      oldSupplierStatus: 'new' as const,
      newSupplierStatus: 'confirm' as const,
      oldWbStatus: 'waiting' as const,
      newWbStatus: 'sorted' as const,
      changedAt: '2026-01-02T12:30:00.000Z',
      durationMinutes: 150,
    },
  ],
  summary: {
    totalTransitions: 2,
    totalDurationMinutes: 150,
    createdAt: '2026-01-02T10:00:00.000Z',
    completedAt: '2026-01-02T12:30:00.000Z',
  },
}

// WB History Response
export const mockWbHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  wbHistory: [
    {
      id: 'uuid-1',
      wbStatusCode: 'created',
      wbStatusChangedAt: '2026-01-02T10:00:00.000Z',
      durationMinutes: null,
    },
    {
      id: 'uuid-2',
      wbStatusCode: 'assembling',
      wbStatusChangedAt: '2026-01-02T10:30:00.000Z',
      durationMinutes: 30,
    },
    {
      id: 'uuid-3',
      wbStatusCode: 'sorted_by_wh',
      wbStatusChangedAt: '2026-01-02T11:00:00.000Z',
      durationMinutes: 30,
    },
  ],
  summary: {
    totalTransitions: 3,
    totalDurationMinutes: 60,
    currentWbStatus: 'sorted_by_wh',
    createdAt: '2026-01-02T10:00:00.000Z',
    lastUpdatedAt: '2026-01-02T11:00:00.000Z',
  },
}

// Full History Response
export const mockFullHistoryResponse = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  fullHistory: [
    {
      source: 'wb_native' as const,
      wbStatusCode: 'created',
      timestamp: '2026-01-02T10:00:00.000Z',
    },
    {
      source: 'local' as const,
      oldSupplierStatus: null,
      newSupplierStatus: 'new' as const,
      oldWbStatus: null,
      newWbStatus: 'waiting' as const,
      timestamp: '2026-01-02T10:05:00.000Z',
    },
    {
      source: 'wb_native' as const,
      wbStatusCode: 'assembling',
      timestamp: '2026-01-02T10:30:00.000Z',
    },
  ],
  summary: { localEntriesCount: 1, wbNativeEntriesCount: 2, totalEntriesCount: 3 },
}

// Sync Responses
export const mockTriggerSyncResponse = {
  jobId: 'orders-fbs-sync:job-123',
  message: 'Orders sync job enqueued',
}
export const mockSyncStatusResponse = {
  enabled: true,
  lastSyncAt: '2026-01-04T10:00:00.000Z',
  nextSyncAt: '2026-01-04T10:05:00.000Z',
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

// Analytics - Velocity
export const mockVelocityMetricsResponse = {
  avgConfirmationTimeMinutes: 35.5,
  avgCompletionTimeMinutes: 240.0,
  p50ConfirmationMinutes: 28.0,
  p95ConfirmationMinutes: 90.0,
  p99ConfirmationMinutes: 120.0,
  p50CompletionMinutes: 200.0,
  p95CompletionMinutes: 480.0,
  p99CompletionMinutes: 720.0,
  byWarehouse: { '507': { avgConfirmation: 30, avgCompletion: 180 } },
  byDeliveryType: { fbs: { avgConfirmation: 35, avgCompletion: 200 } },
  totalOrders: 150,
  period: { from: '2026-01-01', to: '2026-01-31' },
}

// Analytics - SLA
export const mockSlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 95.5,
  completionCompliancePercent: 92.3,
  pendingOrdersCount: 12,
  atRiskTotal: 45,
  atRiskOrders: [
    {
      orderId: '123',
      createdAt: '2026-01-04T10:00:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 25,
      riskType: 'confirmation' as const,
      isBreached: false,
    },
    {
      orderId: '456',
      createdAt: '2026-01-03T08:00:00.000Z',
      currentStatus: 'confirm',
      minutesRemaining: -30,
      riskType: 'completion' as const,
      isBreached: true,
    },
  ],
  breachedCount: 2,
}

// Analytics - Volume
export const mockVolumeMetricsResponse = {
  hourlyTrend: [
    { hour: 14, count: 35 },
    { hour: 15, count: 30 },
  ],
  dailyTrend: [{ date: '2026-01-01', count: 120 }],
  peakHours: [14, 15, 10],
  cancellationRate: 3.5,
  b2bPercentage: 12.0,
  totalOrders: 500,
  statusBreakdown: [{ status: 'complete', count: 400, percentage: 80.0 }],
  period: { from: '2026-01-01', to: '2026-01-31' },
}
