/**
 * Test Fixtures for Fulfillment (FBO/FBS) Analytics
 * Epic 60: FBO/FBS Order Analytics Separation
 *
 * Centralized test data for FBO/FBS fulfillment analytics unit tests.
 * Based on types from src/types/fulfillment.ts
 */

import type {
  FulfillmentSummaryResponse,
  FulfillmentTrendsResponse,
  FulfillmentSyncStatusResponse,
} from '@/types/fulfillment'

// =============================================================================
// Summary Response Fixtures
// =============================================================================

const fboMetrics = {
  ordersCount: 150,
  ordersRevenue: 450000,
  salesCount: 142,
  salesRevenue: 420000,
  forPayTotal: 380000,
  returnsCount: 8,
  returnsRevenue: 30000,
  returnRate: 5.3,
  avgOrderValue: 3000,
}

const fbsMetrics = {
  ordersCount: 85,
  ordersRevenue: 255000,
  salesCount: 80,
  salesRevenue: 240000,
  forPayTotal: 220000,
  returnsCount: 5,
  returnsRevenue: 15000,
  returnRate: 5.9,
  avgOrderValue: 3000,
}

const zeroMetrics = {
  ordersCount: 0,
  ordersRevenue: 0,
  salesCount: 0,
  salesRevenue: 0,
  forPayTotal: 0,
  returnsCount: 0,
  returnsRevenue: 0,
  returnRate: 0,
  avgOrderValue: 0,
}

export const mockFulfillmentSummary: FulfillmentSummaryResponse = {
  summary: {
    fbo: fboMetrics,
    fbs: fbsMetrics,
    total: { ordersCount: 235, ordersRevenue: 705000, fboShare: 63.8, fbsShare: 36.2 },
  },
  period: { from: '2026-01-19', to: '2026-01-25' },
}

export const mockFulfillmentSummaryEmpty: FulfillmentSummaryResponse = {
  summary: {
    fbo: zeroMetrics,
    fbs: zeroMetrics,
    total: { ordersCount: 0, ordersRevenue: 0, fboShare: 0, fbsShare: 0 },
  },
  period: { from: '2026-01-19', to: '2026-01-25' },
}

export const mockFulfillmentSummaryPrevious: FulfillmentSummaryResponse = {
  summary: {
    fbo: { ...fboMetrics, ordersCount: 130, ordersRevenue: 390000 },
    fbs: { ...fbsMetrics, ordersCount: 70, ordersRevenue: 210000 },
    total: { ordersCount: 200, ordersRevenue: 600000, fboShare: 65.0, fbsShare: 35.0 },
  },
  period: { from: '2026-01-12', to: '2026-01-18' },
}

// =============================================================================
// Sync Status Response Fixtures
// =============================================================================

const syncDataInfo = {
  lastSyncAt: '2026-02-01T06:00:00Z',
  recordsCount: 15000,
  dateRange: { from: '2025-11-03', to: '2026-02-01' },
}

export const mockSyncStatusAvailable: FulfillmentSyncStatusResponse = {
  orders: syncDataInfo,
  sales: { ...syncDataInfo, lastSyncAt: '2026-02-01T07:00:00Z', recordsCount: 14200 },
  aggregation: { lastRunAt: '2026-02-01T08:00:00Z', status: 'complete' },
  isDataAvailable: true,
}

export const mockSyncStatusUnavailable: FulfillmentSyncStatusResponse = {
  orders: null,
  sales: null,
  aggregation: null,
  isDataAvailable: false,
}

export const mockSyncStatusInProgress: FulfillmentSyncStatusResponse = {
  orders: syncDataInfo,
  sales: { ...syncDataInfo, lastSyncAt: '2026-02-01T07:00:00Z', recordsCount: 14200 },
  aggregation: { lastRunAt: '2026-02-01T08:00:00Z', status: 'in_progress' },
  isDataAvailable: false,
}

// =============================================================================
// Trends Response Fixtures
// =============================================================================

export const mockFulfillmentTrends: FulfillmentTrendsResponse = {
  trends: [
    {
      date: '2026-01-19',
      fbo: { ordersCount: 22, ordersRevenue: 66000, salesRevenue: 62000, returnsCount: 1 },
      fbs: { ordersCount: 12, ordersRevenue: 36000, salesRevenue: 34000, returnsCount: 0 },
    },
    {
      date: '2026-01-20',
      fbo: { ordersCount: 24, ordersRevenue: 72000, salesRevenue: 68000, returnsCount: 2 },
      fbs: { ordersCount: 14, ordersRevenue: 42000, salesRevenue: 40000, returnsCount: 1 },
    },
  ],
  period: { from: '2026-01-19', to: '2026-01-25', daysIncluded: 7 },
}

export const mockFulfillmentTrendsEmpty: FulfillmentTrendsResponse = {
  trends: [],
  period: { from: '2026-01-19', to: '2026-01-25', daysIncluded: 0 },
}
