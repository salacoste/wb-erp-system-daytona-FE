/**
 * Test Fixtures for Analytics Comparison API
 * Story 61.5-FE: Comparison Endpoint Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * These fixtures provide mock data for testing:
 * - getAnalyticsComparison API function
 * - useAnalyticsComparison hook
 * - useDashboardComparison hook
 * - buildPeriodRange helper
 * - deltaToComparison helper
 */

import type {
  ComparisonResponse,
  PeriodMetrics,
  ComparisonDeltas,
  DeltaValue,
  BreakdownItem,
  MetricComparison,
} from '@/types/analytics-comparison'

// =============================================================================
// Period Metrics Fixtures
// =============================================================================

export const mockPeriod1Metrics: PeriodMetrics = {
  week: '2026-W05',
  revenue: 5200000,
  profit: 1040000,
  margin_pct: 20.0,
  orders: 1450,
  cogs: 3120000,
  logistics: 520000,
  storage: 260000,
  advertising: 260000,
}

export const mockPeriod2Metrics: PeriodMetrics = {
  week: '2026-W04',
  revenue: 4800000,
  profit: 864000,
  margin_pct: 18.0,
  orders: 1320,
  cogs: 2880000,
  logistics: 480000,
  storage: 240000,
  advertising: 336000,
}

// =============================================================================
// Delta Fixtures
// =============================================================================

export const mockPositiveDeltas: ComparisonDeltas = {
  revenue: { absolute: 400000, percent: 8.33 },
  profit: { absolute: 176000, percent: 20.37 },
  margin_pct: { absolute: 2.0, percent: 11.11 },
  orders: { absolute: 130, percent: 9.85 },
  cogs: { absolute: 240000, percent: 8.33 },
  logistics: { absolute: 40000, percent: 8.33 },
  storage: { absolute: 20000, percent: 8.33 },
  advertising: { absolute: -76000, percent: -22.62 }, // Decreased spend
}

export const mockNegativeDeltas: ComparisonDeltas = {
  revenue: { absolute: -1000000, percent: -20.0 },
  profit: { absolute: -400000, percent: -40.0 },
  margin_pct: { absolute: -5.0, percent: -25.0 },
  orders: { absolute: -300, percent: -21.43 },
  cogs: { absolute: -600000, percent: -20.0 },
  logistics: { absolute: 0, percent: 0 },
  storage: { absolute: 0, percent: 0 },
  advertising: { absolute: 0, percent: 0 },
}

export const mockZeroDeltas: ComparisonDeltas = {
  revenue: { absolute: 0, percent: 0 },
  profit: { absolute: 0, percent: 0 },
  margin_pct: { absolute: 0, percent: 0 },
  orders: { absolute: 0, percent: 0 },
  cogs: { absolute: 0, percent: 0 },
  logistics: { absolute: 0, percent: 0 },
  storage: { absolute: 0, percent: 0 },
  advertising: { absolute: 0, percent: 0 },
}

// =============================================================================
// Full Comparison Response Fixtures
// =============================================================================

/**
 * Standard comparison response with positive growth
 */
export const mockComparisonResponse: ComparisonResponse = {
  period1: mockPeriod1Metrics,
  period2: mockPeriod2Metrics,
  delta: mockPositiveDeltas,
}

/**
 * Comparison response with breakdown by SKU
 */
export const mockComparisonWithBreakdownResponse: ComparisonResponse = {
  period1: { ...mockPeriod1Metrics, week: '2026-W01:W05' },
  period2: { ...mockPeriod2Metrics, week: '2025-W49:W52' },
  delta: mockPositiveDeltas,
  breakdown: [
    {
      id: '12345678',
      name: 'Product A',
      period1_value: 2000000,
      period2_value: 1800000,
      delta_absolute: 200000,
      delta_percent: 11.11,
    },
    {
      id: '87654321',
      name: 'Product B',
      period1_value: 1500000,
      period2_value: 1600000,
      delta_absolute: -100000,
      delta_percent: -6.25,
    },
    {
      id: '11112222',
      name: 'Product C',
      period1_value: 1700000,
      period2_value: 1400000,
      delta_absolute: 300000,
      delta_percent: 21.43,
    },
  ] as BreakdownItem[],
}

/**
 * Comparison response with negative growth (decline)
 */
export const mockNegativeGrowthResponse: ComparisonResponse = {
  period1: {
    week: '2026-W05',
    revenue: 4000000,
    profit: 600000,
    margin_pct: 15.0,
    orders: 1100,
    cogs: 2400000,
    logistics: 500000,
    storage: 250000,
    advertising: 250000,
  },
  period2: {
    week: '2026-W04',
    revenue: 5000000,
    profit: 1000000,
    margin_pct: 20.0,
    orders: 1400,
    cogs: 3000000,
    logistics: 500000,
    storage: 250000,
    advertising: 250000,
  },
  delta: mockNegativeDeltas,
}

/**
 * Comparison response with no change
 */
export const mockZeroChangeResponse: ComparisonResponse = {
  period1: {
    week: '2026-W05',
    revenue: 5000000,
    profit: 1000000,
    margin_pct: 20.0,
    orders: 1400,
    cogs: 3000000,
    logistics: 500000,
    storage: 250000,
    advertising: 250000,
  },
  period2: {
    week: '2026-W04',
    revenue: 5000000,
    profit: 1000000,
    margin_pct: 20.0,
    orders: 1400,
    cogs: 3000000,
    logistics: 500000,
    storage: 250000,
    advertising: 250000,
  },
  delta: mockZeroDeltas,
}

/**
 * Cross-year comparison response
 */
export const mockCrossYearComparisonResponse: ComparisonResponse = {
  period1: { ...mockPeriod1Metrics, week: '2026-W01' },
  period2: { ...mockPeriod2Metrics, week: '2025-W52' },
  delta: mockPositiveDeltas,
}

// =============================================================================
// Breakdown Item Fixtures
// =============================================================================

export const mockBreakdownItems: BreakdownItem[] = [
  {
    id: '12345678',
    name: 'Product A',
    period1_value: 2000000,
    period2_value: 1800000,
    delta_absolute: 200000,
    delta_percent: 11.11,
  },
  {
    id: '87654321',
    name: 'Product B',
    period1_value: 1500000,
    period2_value: 1600000,
    delta_absolute: -100000,
    delta_percent: -6.25,
  },
]

// =============================================================================
// MetricComparison Fixtures (transformed UI format)
// =============================================================================

export const mockRevenueComparison: MetricComparison = {
  current: 5200000,
  previous: 4800000,
  change: 400000,
  changePercent: 8.33,
  direction: 'up',
}

export const mockProfitComparison: MetricComparison = {
  current: 1040000,
  previous: 864000,
  change: 176000,
  changePercent: 20.37,
  direction: 'up',
}

export const mockNegativeRevenueComparison: MetricComparison = {
  current: 4000000,
  previous: 5000000,
  change: -1000000,
  changePercent: -20.0,
  direction: 'down',
}

export const mockNeutralComparison: MetricComparison = {
  current: 5000000,
  previous: 5000000,
  change: 0,
  changePercent: 0,
  direction: 'neutral',
}

// =============================================================================
// Delta Value Fixtures
// =============================================================================

export const mockPositiveDelta: DeltaValue = { absolute: 400000, percent: 8.33 }
export const mockNegativeDelta: DeltaValue = { absolute: -1000000, percent: -20.0 }
export const mockZeroDelta: DeltaValue = { absolute: 0, percent: 0 }

// =============================================================================
// Period Range Building Test Cases
// =============================================================================

export const periodRangeTestCases = [
  { input: [], expected: '' },
  { input: ['2026-W05'], expected: '2026-W05' },
  { input: ['2026-W01', '2026-W05'], expected: '2026-W01:W05' },
  {
    input: ['2026-W01', '2026-W02', '2026-W03', '2026-W04', '2026-W05'],
    expected: '2026-W01:W05',
  },
  {
    input: ['2025-W49', '2025-W50', '2025-W51', '2025-W52', '2026-W01'],
    expected: '2025-W49:2026-W01',
  },
  {
    input: ['2026-W52', '2026-W53', '2027-W01'], // 53-week year
    expected: '2026-W52:2027-W01',
  },
]
