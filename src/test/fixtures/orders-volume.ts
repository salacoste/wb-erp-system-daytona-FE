/**
 * Test Fixtures for Orders Volume API
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * These fixtures provide mock data for testing:
 * - getOrdersVolume API function
 * - useOrdersVolume hook
 * - transformToMetrics helper
 */

import type {
  OrdersVolumeResponse,
  OrdersVolumeMetrics,
  OrderStatusBreakdown,
  DailyOrderVolume,
  HourlyOrderVolume,
} from '@/types/orders-volume'

// =============================================================================
// API Response Fixtures
// =============================================================================

/**
 * Standard orders volume response (totals only, no breakdown)
 */
export const mockOrdersVolumeResponse: OrdersVolumeResponse = {
  total_orders: 1250,
  total_amount: 4500000, // 4.5M RUB
  avg_order_value: 3600,
  by_status: {
    new: 50,
    confirm: 150,
    complete: 950,
    cancel: 100,
  },
}

/**
 * Orders volume with daily breakdown (aggregation=day)
 */
export const mockOrdersVolumeWithDailyResponse: OrdersVolumeResponse = {
  ...mockOrdersVolumeResponse,
  by_day: [
    { date: '2026-01-27', orders: 180, amount: 650000 },
    { date: '2026-01-28', orders: 175, amount: 630000 },
    { date: '2026-01-29', orders: 190, amount: 680000 },
    { date: '2026-01-30', orders: 185, amount: 665000 },
    { date: '2026-01-31', orders: 200, amount: 720000 },
    { date: '2026-02-01', orders: 170, amount: 610000 },
    { date: '2026-02-02', orders: 150, amount: 545000 },
  ] as DailyOrderVolume[],
}

/**
 * Orders volume with hourly breakdown (aggregation=hour)
 */
export const mockOrdersVolumeWithHourlyResponse: OrdersVolumeResponse = {
  ...mockOrdersVolumeResponse,
  by_hour: [
    { hour: 0, orders: 15, amount: 54000 },
    { hour: 1, orders: 8, amount: 28800 },
    { hour: 2, orders: 5, amount: 18000 },
    { hour: 3, orders: 3, amount: 10800 },
    { hour: 4, orders: 4, amount: 14400 },
    { hour: 5, orders: 12, amount: 43200 },
    { hour: 6, orders: 28, amount: 100800 },
    { hour: 7, orders: 45, amount: 162000 },
    { hour: 8, orders: 62, amount: 223200 },
    { hour: 9, orders: 78, amount: 280800 },
    { hour: 10, orders: 92, amount: 331200 },
    { hour: 11, orders: 88, amount: 316800 },
    { hour: 12, orders: 65, amount: 234000 },
    { hour: 13, orders: 72, amount: 259200 },
    { hour: 14, orders: 85, amount: 306000 },
    { hour: 15, orders: 90, amount: 324000 },
    { hour: 16, orders: 82, amount: 295200 },
    { hour: 17, orders: 75, amount: 270000 },
    { hour: 18, orders: 88, amount: 316800 },
    { hour: 19, orders: 95, amount: 342000 },
    { hour: 20, orders: 78, amount: 280800 },
    { hour: 21, orders: 55, amount: 198000 },
    { hour: 22, orders: 38, amount: 136800 },
    { hour: 23, orders: 22, amount: 79200 },
  ] as HourlyOrderVolume[],
}

/**
 * Empty orders volume response (no orders in period)
 */
export const mockEmptyOrdersVolumeResponse: OrdersVolumeResponse = {
  total_orders: 0,
  total_amount: 0,
  avg_order_value: 0,
  by_status: {
    new: 0,
    confirm: 0,
    complete: 0,
    cancel: 0,
  },
}

/**
 * Orders volume with high cancellation rate
 */
export const mockHighCancellationResponse: OrdersVolumeResponse = {
  total_orders: 1000,
  total_amount: 3600000,
  avg_order_value: 3600,
  by_status: {
    new: 100,
    confirm: 200,
    complete: 500,
    cancel: 200, // 20% cancellation
  },
}

// =============================================================================
// Transformed Metrics Fixtures
// =============================================================================

/**
 * Expected transformed metrics from mockOrdersVolumeResponse
 */
export const mockOrdersVolumeMetrics: OrdersVolumeMetrics = {
  totalOrders: 1250,
  totalAmount: 4500000,
  avgOrderValue: 3600,
  completionRate: 76.0, // 950 / 1250 * 100
  cancellationRate: 8.0, // 100 / 1250 * 100
  dailyBreakdown: undefined,
}

/**
 * Expected transformed metrics with daily breakdown
 */
export const mockOrdersVolumeMetricsWithDaily: OrdersVolumeMetrics = {
  ...mockOrdersVolumeMetrics,
  dailyBreakdown: mockOrdersVolumeWithDailyResponse.by_day,
}

/**
 * Expected transformed metrics for empty response
 */
export const mockEmptyOrdersVolumeMetrics: OrdersVolumeMetrics = {
  totalOrders: 0,
  totalAmount: 0,
  avgOrderValue: 0,
  completionRate: 0, // Not NaN!
  cancellationRate: 0, // Not NaN!
  dailyBreakdown: undefined,
}

// =============================================================================
// Status Breakdown Fixtures
// =============================================================================

export const mockStatusBreakdown: OrderStatusBreakdown = {
  new: 50,
  confirm: 150,
  complete: 950,
  cancel: 100,
}

export const mockEmptyStatusBreakdown: OrderStatusBreakdown = {
  new: 0,
  confirm: 0,
  complete: 0,
  cancel: 0,
}

// =============================================================================
// Daily Volume Fixtures
// =============================================================================

export const mockDailyVolumes: DailyOrderVolume[] = [
  { date: '2026-01-27', orders: 180, amount: 650000 },
  { date: '2026-01-28', orders: 175, amount: 630000 },
  { date: '2026-01-29', orders: 190, amount: 680000 },
  { date: '2026-01-30', orders: 185, amount: 665000 },
  { date: '2026-01-31', orders: 200, amount: 720000 },
  { date: '2026-02-01', orders: 170, amount: 610000 },
  { date: '2026-02-02', orders: 150, amount: 545000 },
]

// =============================================================================
// Hourly Volume Fixtures
// =============================================================================

export const mockPeakHourVolumes: HourlyOrderVolume[] = [
  { hour: 9, orders: 78, amount: 280800 },
  { hour: 10, orders: 92, amount: 331200 },
  { hour: 11, orders: 88, amount: 316800 },
  { hour: 19, orders: 95, amount: 342000 },
]
