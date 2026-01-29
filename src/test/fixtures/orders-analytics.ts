/**
 * Test Fixtures for Orders Analytics Dashboard
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Contains mock data for:
 * - SLA metrics (good, warning, critical states)
 * - Velocity metrics (avg times, percentiles)
 * - At-risk orders list
 * - Sync status scenarios
 */

import type {
  SlaMetricsResponse,
  VelocityMetricsResponse,
  AtRiskOrder,
} from '@/types/orders-analytics'

import type { SyncStatusResponse } from '@/types/orders'

// =============================================================================
// SLA Metrics Fixtures
// =============================================================================

/** SLA metrics with excellent compliance (>95% both) - GREEN state */
export const mockSlaMetricsExcellent: SlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 98.5,
  completionCompliancePercent: 96.2,
  pendingOrdersCount: 8,
  atRiskTotal: 2,
  atRiskOrders: [
    {
      orderId: '1234567890',
      createdAt: '2026-01-29T08:30:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 45,
      riskType: 'confirmation',
      isBreached: false,
    },
    {
      orderId: '1234567891',
      createdAt: '2026-01-28T12:00:00.000Z',
      currentStatus: 'confirm',
      minutesRemaining: 180,
      riskType: 'completion',
      isBreached: false,
    },
  ],
  breachedCount: 0,
}

/** SLA metrics with warning state (85-94%) - YELLOW state */
export const mockSlaMetricsWarning: SlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 91.5,
  completionCompliancePercent: 87.3,
  pendingOrdersCount: 15,
  atRiskTotal: 8,
  atRiskOrders: [
    {
      orderId: 'at-risk-001',
      createdAt: '2026-01-29T09:00:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 25,
      riskType: 'confirmation',
      isBreached: false,
    },
    {
      orderId: 'at-risk-002',
      createdAt: '2026-01-29T09:15:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 40,
      riskType: 'confirmation',
      isBreached: false,
    },
    {
      orderId: 'at-risk-003',
      createdAt: '2026-01-28T10:00:00.000Z',
      currentStatus: 'confirm',
      minutesRemaining: 120,
      riskType: 'completion',
      isBreached: false,
    },
  ],
  breachedCount: 3,
}

/** SLA metrics with critical state (<85%) - RED state */
export const mockSlaMetricsCritical: SlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 72.0,
  completionCompliancePercent: 65.5,
  pendingOrdersCount: 45,
  atRiskTotal: 25,
  atRiskOrders: [
    {
      orderId: 'urgent-001',
      createdAt: '2026-01-29T10:30:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 5,
      riskType: 'confirmation',
      isBreached: false,
    },
    {
      orderId: 'urgent-002',
      createdAt: '2026-01-29T10:35:00.000Z',
      currentStatus: 'new',
      minutesRemaining: 10,
      riskType: 'confirmation',
      isBreached: false,
    },
    {
      orderId: 'breached-001',
      createdAt: '2026-01-29T06:00:00.000Z',
      currentStatus: 'new',
      minutesRemaining: -30,
      riskType: 'confirmation',
      isBreached: true,
    },
    {
      orderId: 'breached-002',
      createdAt: '2026-01-27T08:00:00.000Z',
      currentStatus: 'confirm',
      minutesRemaining: -120,
      riskType: 'completion',
      isBreached: true,
    },
  ],
  breachedCount: 12,
}

/** SLA metrics with no at-risk orders - perfect state */
export const mockSlaMetricsNoRisk: SlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 100.0,
  completionCompliancePercent: 100.0,
  pendingOrdersCount: 0,
  atRiskTotal: 0,
  atRiskOrders: [],
  breachedCount: 0,
}

/** SLA metrics with many at-risk orders for pagination testing */
export const mockSlaMetricsPaginated: SlaMetricsResponse = {
  confirmationSlaHours: 2,
  completionSlaHours: 24,
  confirmationCompliancePercent: 88.0,
  completionCompliancePercent: 82.5,
  pendingOrdersCount: 30,
  atRiskTotal: 25,
  atRiskOrders: Array.from({ length: 10 }, (_, i) => ({
    orderId: `paginated-${String(i + 1).padStart(3, '0')}`,
    createdAt: new Date(Date.now() - i * 600000).toISOString(),
    currentStatus: i % 2 === 0 ? 'new' : 'confirm',
    minutesRemaining: 15 + i * 5,
    riskType: (i % 2 === 0 ? 'confirmation' : 'completion') as 'confirmation' | 'completion',
    isBreached: false,
  })),
  breachedCount: 5,
}

// =============================================================================
// Velocity Metrics Fixtures
// =============================================================================

/** Velocity metrics with fast processing times - GREEN state */
export const mockVelocityMetricsFast: VelocityMetricsResponse = {
  avgConfirmationTimeMinutes: 25.0,
  avgCompletionTimeMinutes: 150.0,
  p50ConfirmationMinutes: 20.0,
  p95ConfirmationMinutes: 45.0,
  p99ConfirmationMinutes: 60.0,
  p50CompletionMinutes: 120.0,
  p95CompletionMinutes: 240.0,
  p99CompletionMinutes: 360.0,
  byWarehouse: {
    '507': { avgConfirmation: 22, avgCompletion: 140 },
    '508': { avgConfirmation: 28, avgCompletion: 160 },
  },
  byDeliveryType: {
    fbs: { avgConfirmation: 25, avgCompletion: 150 },
  },
  totalOrders: 500,
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
  },
}

/** Velocity metrics with acceptable times - YELLOW state */
export const mockVelocityMetricsAcceptable: VelocityMetricsResponse = {
  avgConfirmationTimeMinutes: 45.0,
  avgCompletionTimeMinutes: 270.0,
  p50ConfirmationMinutes: 38.0,
  p95ConfirmationMinutes: 85.0,
  p99ConfirmationMinutes: 110.0,
  p50CompletionMinutes: 220.0,
  p95CompletionMinutes: 420.0,
  p99CompletionMinutes: 600.0,
  byWarehouse: {
    '507': { avgConfirmation: 42, avgCompletion: 250 },
    '508': { avgConfirmation: 48, avgCompletion: 290 },
  },
  byDeliveryType: {
    fbs: { avgConfirmation: 45, avgCompletion: 270 },
  },
  totalOrders: 350,
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
  },
}

/** Velocity metrics with slow processing times - RED state */
export const mockVelocityMetricsSlow: VelocityMetricsResponse = {
  avgConfirmationTimeMinutes: 75.0,
  avgCompletionTimeMinutes: 480.0,
  p50ConfirmationMinutes: 65.0,
  p95ConfirmationMinutes: 110.0,
  p99ConfirmationMinutes: 150.0,
  p50CompletionMinutes: 420.0,
  p95CompletionMinutes: 720.0,
  p99CompletionMinutes: 960.0,
  byWarehouse: {
    '507': { avgConfirmation: 70, avgCompletion: 450 },
    '508': { avgConfirmation: 80, avgCompletion: 510 },
  },
  byDeliveryType: {
    fbs: { avgConfirmation: 75, avgCompletion: 480 },
  },
  totalOrders: 200,
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
  },
}

/** Velocity metrics with zero orders (edge case) */
export const mockVelocityMetricsEmpty: VelocityMetricsResponse = {
  avgConfirmationTimeMinutes: 0,
  avgCompletionTimeMinutes: 0,
  p50ConfirmationMinutes: 0,
  p95ConfirmationMinutes: 0,
  p99ConfirmationMinutes: 0,
  p50CompletionMinutes: 0,
  p95CompletionMinutes: 0,
  p99CompletionMinutes: 0,
  byWarehouse: {},
  byDeliveryType: {},
  totalOrders: 0,
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
  },
}

// =============================================================================
// At-Risk Orders Fixtures
// =============================================================================

/** Single at-risk order with minimal time remaining */
export const mockAtRiskOrderUrgent: AtRiskOrder = {
  orderId: 'urgent-order-001',
  createdAt: '2026-01-29T10:45:00.000Z',
  currentStatus: 'new',
  minutesRemaining: 5,
  riskType: 'confirmation',
  isBreached: false,
}

/** At-risk order approaching completion SLA */
export const mockAtRiskOrderCompletion: AtRiskOrder = {
  orderId: 'completion-risk-001',
  createdAt: '2026-01-28T12:00:00.000Z',
  currentStatus: 'confirm',
  minutesRemaining: 60,
  riskType: 'completion',
  isBreached: false,
}

/** Breached order (negative minutes remaining) */
export const mockAtRiskOrderBreached: AtRiskOrder = {
  orderId: 'breached-order-001',
  createdAt: '2026-01-29T06:00:00.000Z',
  currentStatus: 'new',
  minutesRemaining: -45,
  riskType: 'confirmation',
  isBreached: true,
}

/** List of at-risk orders sorted by urgency (most urgent first) */
export const mockAtRiskOrdersSortedByUrgency: AtRiskOrder[] = [
  {
    orderId: 'sorted-001',
    createdAt: '2026-01-29T10:55:00.000Z',
    currentStatus: 'new',
    minutesRemaining: 3,
    riskType: 'confirmation',
    isBreached: false,
  },
  {
    orderId: 'sorted-002',
    createdAt: '2026-01-29T10:50:00.000Z',
    currentStatus: 'new',
    minutesRemaining: 8,
    riskType: 'confirmation',
    isBreached: false,
  },
  {
    orderId: 'sorted-003',
    createdAt: '2026-01-29T10:40:00.000Z',
    currentStatus: 'new',
    minutesRemaining: 18,
    riskType: 'confirmation',
    isBreached: false,
  },
  {
    orderId: 'sorted-004',
    createdAt: '2026-01-29T10:30:00.000Z',
    currentStatus: 'new',
    minutesRemaining: 28,
    riskType: 'confirmation',
    isBreached: false,
  },
  {
    orderId: 'sorted-005',
    createdAt: '2026-01-28T14:00:00.000Z',
    currentStatus: 'confirm',
    minutesRemaining: 45,
    riskType: 'completion',
    isBreached: false,
  },
]

// =============================================================================
// Sync Status Fixtures
// =============================================================================

/** Sync status - healthy (recently synced) */
export const mockSyncStatusHealthy: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  nextSyncAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 min from now
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - degraded (5-15 min since last sync) */
export const mockSyncStatusDegraded: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
  nextSyncAt: new Date(Date.now() + 60 * 1000).toISOString(), // 1 min from now
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - stale (15-30 min since last sync) */
export const mockSyncStatusStale: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 min ago
  nextSyncAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Overdue
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - unhealthy (>30 min since last sync) */
export const mockSyncStatusUnhealthy: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
  nextSyncAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // Way overdue
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - disabled */
export const mockSyncStatusDisabled: SyncStatusResponse = {
  enabled: false,
  lastSyncAt: null,
  nextSyncAt: null,
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

/** Sync status - never synced */
export const mockSyncStatusNeverSynced: SyncStatusResponse = {
  enabled: true,
  lastSyncAt: null,
  nextSyncAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  schedule: 'Every 5 minutes',
  timezone: 'Europe/Moscow',
}

// =============================================================================
// Trigger Sync Response Fixtures
// =============================================================================

export const mockTriggerSyncSuccess = {
  jobId: 'orders-fbs-sync:abc123:1706518800000',
  message: 'Orders sync job enqueued',
}

// =============================================================================
// Error Fixtures
// =============================================================================

export const mockAnalyticsError = {
  status: 500,
  code: 'ANALYTICS_UNAVAILABLE',
  message: 'Аналитика временно недоступна. Попробуйте позже.',
}

export const mockSyncError = {
  status: 429,
  code: 'RATE_LIMITED',
  message: 'Слишком много запросов. Подождите минуту.',
}

// =============================================================================
// Duration Formatting Test Cases
// =============================================================================

export const durationTestCases = [
  { minutes: 0, expected: '0 мин' },
  { minutes: 1, expected: '1 мин' },
  { minutes: 35, expected: '35 мин' },
  { minutes: 59, expected: '59 мин' },
  { minutes: 60, expected: '1 ч' },
  { minutes: 90, expected: '1 ч 30 мин' },
  { minutes: 120, expected: '2 ч' },
  { minutes: 270, expected: '4 ч 30 мин' },
  { minutes: 1440, expected: '1 д 0 ч' },
  { minutes: 1500, expected: '1 д 1 ч' },
  { minutes: 2880, expected: '2 д 0 ч' },
]

// =============================================================================
// SLA Color Threshold Test Cases
// =============================================================================

export const slaColorTestCases = [
  { percent: 100, expectedColor: 'green' },
  { percent: 98.5, expectedColor: 'green' },
  { percent: 95.0, expectedColor: 'green' },
  { percent: 94.9, expectedColor: 'yellow' },
  { percent: 90.0, expectedColor: 'yellow' },
  { percent: 85.0, expectedColor: 'yellow' },
  { percent: 84.9, expectedColor: 'red' },
  { percent: 75.0, expectedColor: 'red' },
  { percent: 50.0, expectedColor: 'red' },
  { percent: 0, expectedColor: 'red' },
]

// =============================================================================
// Velocity Color Threshold Test Cases
// =============================================================================

export const confirmationTimeColorTestCases = [
  { minutes: 0, expectedColor: 'green' },
  { minutes: 15, expectedColor: 'green' },
  { minutes: 29, expectedColor: 'green' },
  { minutes: 30, expectedColor: 'yellow' },
  { minutes: 45, expectedColor: 'yellow' },
  { minutes: 59, expectedColor: 'yellow' },
  { minutes: 60, expectedColor: 'red' },
  { minutes: 90, expectedColor: 'red' },
  { minutes: 120, expectedColor: 'red' },
]

export const completionTimeColorTestCases = [
  { minutes: 0, expectedColor: 'green' },
  { minutes: 60, expectedColor: 'green' },
  { minutes: 179, expectedColor: 'green' },
  { minutes: 180, expectedColor: 'yellow' },
  { minutes: 270, expectedColor: 'yellow' },
  { minutes: 359, expectedColor: 'yellow' },
  { minutes: 360, expectedColor: 'red' },
  { minutes: 480, expectedColor: 'red' },
  { minutes: 720, expectedColor: 'red' },
]

// =============================================================================
// Sync Status Health Color Test Cases
// =============================================================================

export const syncHealthTestCases = [
  { minutesSinceSync: 0, expectedHealth: 'healthy', expectedColor: 'green' },
  { minutesSinceSync: 2, expectedHealth: 'healthy', expectedColor: 'green' },
  { minutesSinceSync: 4, expectedHealth: 'healthy', expectedColor: 'green' },
  { minutesSinceSync: 5, expectedHealth: 'degraded', expectedColor: 'yellow' },
  { minutesSinceSync: 10, expectedHealth: 'degraded', expectedColor: 'yellow' },
  { minutesSinceSync: 14, expectedHealth: 'degraded', expectedColor: 'yellow' },
  { minutesSinceSync: 15, expectedHealth: 'stale', expectedColor: 'orange' },
  { minutesSinceSync: 25, expectedHealth: 'stale', expectedColor: 'orange' },
  { minutesSinceSync: 29, expectedHealth: 'stale', expectedColor: 'orange' },
  { minutesSinceSync: 30, expectedHealth: 'unhealthy', expectedColor: 'red' },
  { minutesSinceSync: 60, expectedHealth: 'unhealthy', expectedColor: 'red' },
]
