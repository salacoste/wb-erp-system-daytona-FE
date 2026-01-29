/**
 * Test Fixtures for FBS Trends Chart
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Contains test data for:
 * - 30-day daily trend data
 * - 90-day daily trend data
 * - 365-day weekly trend data
 * - Empty and edge case data
 * - Trend calculations
 *
 * @see docs/stories/epic-51/story-51.4-fe-fbs-trends-chart.md
 */

import type { TrendDataPoint, TrendsResponse } from '@/types/fbs-analytics'

// ============================================================================
// Chart Line Colors (matching component constants)
// ============================================================================

export const LINE_COLORS = {
  orders: '#3B82F6', // Blue
  revenue: '#22C55E', // Green
  cancellations: '#EF4444', // Red
} as const

// ============================================================================
// Metric Visibility State Type
// ============================================================================

export interface MetricVisibility {
  orders: boolean
  revenue: boolean
  cancellations: boolean
}

export const defaultMetricVisibility: MetricVisibility = {
  orders: true,
  revenue: true,
  cancellations: false,
}

// ============================================================================
// Single Data Point Fixtures
// ============================================================================

/** Single trend data point for tooltip tests */
export const mockSingleTrendPoint: TrendDataPoint = {
  date: '2026-01-15',
  ordersCount: 45,
  revenue: 67500.0,
  cancellations: 3,
  cancellationRate: 6.67,
  returns: 2,
  returnRate: 4.44,
  avgOrderValue: 1500.0,
}

/** Data point with zero values */
export const mockZeroTrendPoint: TrendDataPoint = {
  date: '2026-01-20',
  ordersCount: 0,
  revenue: 0,
  cancellations: 0,
  cancellationRate: 0,
  returns: 0,
  returnRate: 0,
  avgOrderValue: 0,
}

/** Data point with high cancellation rate */
export const mockHighCancellationPoint: TrendDataPoint = {
  date: '2026-01-18',
  ordersCount: 100,
  revenue: 150000.0,
  cancellations: 25,
  cancellationRate: 25.0,
  returns: 5,
  returnRate: 5.0,
  avgOrderValue: 1500.0,
}

// ============================================================================
// 30-Day Daily Data (0-30 days range - orders_fbs source)
// ============================================================================

/** Generate 30 days of daily trend data */
export const mockTrends30DaysDaily: TrendDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2025-12-31')
  date.setDate(date.getDate() + i)
  const dateStr = date.toISOString().split('T')[0]
  const baseOrders = 40 + Math.floor(i * 1.5) // Slight upward trend
  return {
    date: dateStr,
    ordersCount: baseOrders,
    revenue: baseOrders * 1500,
    cancellations: Math.floor(baseOrders * 0.05),
    cancellationRate: 5.0,
    returns: Math.floor(baseOrders * 0.03),
    returnRate: 3.0,
    avgOrderValue: 1500,
  }
})

/** Response fixture for 30-day daily data */
export const mockTrends30DaysResponse: TrendsResponse = {
  trends: mockTrends30DaysDaily,
  summary: {
    totalOrders: 1350,
    totalRevenue: 2025000.0,
    avgDailyOrders: 45.0,
    cancellationRate: 5.0,
    returnRate: 3.0,
  },
  dataSource: { primary: 'orders_fbs' },
  period: {
    from: '2025-12-31',
    to: '2026-01-29',
    aggregation: 'day',
    daysIncluded: 30,
  },
}

// ============================================================================
// 90-Day Daily Data (31-90 days range - reports source)
// ============================================================================

/** Generate 90 days of daily trend data */
export const mockTrends90DaysDaily: TrendDataPoint[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date('2025-11-01')
  date.setDate(date.getDate() + i)
  const dateStr = date.toISOString().split('T')[0]
  // Add some variability with seasonal pattern
  const seasonalFactor = 1 + 0.2 * Math.sin((i / 30) * Math.PI)
  const baseOrders = Math.floor(40 * seasonalFactor)
  return {
    date: dateStr,
    ordersCount: baseOrders,
    revenue: baseOrders * 1450,
    cancellations: Math.floor(baseOrders * 0.06),
    cancellationRate: 6.0,
    returns: Math.floor(baseOrders * 0.04),
    returnRate: 4.0,
    avgOrderValue: 1450,
  }
})

/** Response fixture for 90-day daily data */
export const mockTrends90DaysResponse: TrendsResponse = {
  trends: mockTrends90DaysDaily,
  summary: {
    totalOrders: 3600,
    totalRevenue: 5220000.0,
    avgDailyOrders: 40.0,
    cancellationRate: 6.0,
    returnRate: 4.0,
  },
  dataSource: { primary: 'reports' },
  period: {
    from: '2025-11-01',
    to: '2026-01-29',
    aggregation: 'day',
    daysIncluded: 90,
  },
}

// ============================================================================
// 365-Day Weekly Data (91-365 days range - analytics source)
// ============================================================================

/** Generate 52 weeks of weekly trend data */
export const mockTrends365DaysWeekly: TrendDataPoint[] = Array.from({ length: 52 }, (_, i) => {
  const weekNum = ((i + 1) % 52) + 1
  const year = i < 4 ? 2025 : 2026
  const weekStr = `${year}-W${weekNum.toString().padStart(2, '0')}`
  // Seasonal pattern: higher in Nov-Dec, lower in summer
  const seasonalFactor = 1 + 0.3 * Math.sin(((i - 13) / 52) * 2 * Math.PI)
  const baseOrders = Math.floor(300 * seasonalFactor)
  return {
    date: weekStr,
    ordersCount: baseOrders,
    revenue: baseOrders * 1480,
    cancellations: Math.floor(baseOrders * 0.055),
    cancellationRate: 5.5,
    returns: Math.floor(baseOrders * 0.035),
    returnRate: 3.5,
    avgOrderValue: 1480,
  }
})

/** Response fixture for 365-day weekly data */
export const mockTrends365DaysResponse: TrendsResponse = {
  trends: mockTrends365DaysWeekly,
  summary: {
    totalOrders: 16380,
    totalRevenue: 24237600.0,
    avgDailyOrders: 44.9,
    cancellationRate: 5.5,
    returnRate: 3.5,
  },
  dataSource: { primary: 'analytics' },
  period: {
    from: '2025-01-30',
    to: '2026-01-29',
    aggregation: 'week',
    daysIncluded: 365,
  },
}

// ============================================================================
// Empty and Edge Case Data
// ============================================================================

/** Empty trends response */
export const mockTrendsEmptyResponse: TrendsResponse = {
  trends: [],
  summary: {
    totalOrders: 0,
    totalRevenue: 0,
    avgDailyOrders: 0,
    cancellationRate: 0,
    returnRate: 0,
  },
  dataSource: { primary: 'orders_fbs' },
  period: {
    from: '2026-01-01',
    to: '2026-01-29',
    aggregation: 'day',
    daysIncluded: 29,
  },
}

/** Single data point response */
export const mockTrendsSinglePointResponse: TrendsResponse = {
  trends: [mockSingleTrendPoint],
  summary: {
    totalOrders: 45,
    totalRevenue: 67500.0,
    avgDailyOrders: 45.0,
    cancellationRate: 6.67,
    returnRate: 4.44,
  },
  dataSource: { primary: 'orders_fbs' },
  period: {
    from: '2026-01-15',
    to: '2026-01-15',
    aggregation: 'day',
    daysIncluded: 1,
  },
}

/** Data with gaps (some dates missing) */
export const mockTrendsWithGaps: TrendDataPoint[] = [
  { ...mockSingleTrendPoint, date: '2026-01-10' },
  // Gap: 2026-01-11 to 2026-01-14 missing
  { ...mockSingleTrendPoint, date: '2026-01-15', ordersCount: 50, revenue: 75000 },
  // Gap: 2026-01-16 to 2026-01-18 missing
  { ...mockSingleTrendPoint, date: '2026-01-19', ordersCount: 55, revenue: 82500 },
  { ...mockSingleTrendPoint, date: '2026-01-20', ordersCount: 48, revenue: 72000 },
]

export const mockTrendsWithGapsResponse: TrendsResponse = {
  trends: mockTrendsWithGaps,
  summary: {
    totalOrders: 198,
    totalRevenue: 297000.0,
    avgDailyOrders: 49.5,
    cancellationRate: 6.0,
    returnRate: 4.0,
  },
  dataSource: { primary: 'orders_fbs' },
  period: {
    from: '2026-01-10',
    to: '2026-01-20',
    aggregation: 'day',
    daysIncluded: 11,
  },
}

// ============================================================================
// Data Source Indicator Fixtures
// ============================================================================

export const dataSourceConfigs = {
  orders_fbs: {
    label: 'Реалтайм',
    color: 'bg-green-100 text-green-800',
    description: 'Данные из API заказов FBS (последние 30 дней)',
  },
  reports: {
    label: 'Ежедневно',
    color: 'bg-blue-100 text-blue-800',
    description: 'Ежедневные отчёты (31-90 дней)',
  },
  analytics: {
    label: 'Еженедельно',
    color: 'bg-purple-100 text-purple-800',
    description: 'Еженедельные агрегаты (91-365 дней)',
  },
} as const

export type DataSourceType = keyof typeof dataSourceConfigs

// ============================================================================
// Aggregation Toggle Fixtures
// ============================================================================

export const aggregationOptions = [
  { value: 'day' as const, label: 'День' },
  { value: 'week' as const, label: 'Неделя' },
  { value: 'month' as const, label: 'Месяц' },
]

/** Aggregation auto-suggest based on date range */
export const aggregationTestCases = [
  { daysDiff: 7, expected: 'day' as const, disabled: [] },
  { daysDiff: 30, expected: 'day' as const, disabled: [] },
  { daysDiff: 60, expected: 'day' as const, disabled: [] },
  { daysDiff: 90, expected: 'day' as const, disabled: [] },
  { daysDiff: 91, expected: 'week' as const, disabled: [] },
  { daysDiff: 120, expected: 'week' as const, disabled: [] },
  { daysDiff: 180, expected: 'week' as const, disabled: [] },
  { daysDiff: 181, expected: 'month' as const, disabled: [] },
  { daysDiff: 365, expected: 'month' as const, disabled: [] },
]

// ============================================================================
// Legend Metric Labels
// ============================================================================

export const METRIC_LABELS = {
  orders: 'Заказы',
  revenue: 'Выручка',
  cancellations: 'Отмены',
} as const

// ============================================================================
// Tooltip Formatting Test Cases
// ============================================================================

export const tooltipFormattingTestCases = [
  {
    dataPoint: mockSingleTrendPoint,
    expected: {
      date: '15.01.2026',
      ordersCount: '45',
      revenue: '67 500 ₽',
      cancellations: '3',
      cancellationRate: '6,67%',
      avgOrderValue: '1 500 ₽',
    },
  },
  {
    dataPoint: mockZeroTrendPoint,
    expected: {
      date: '20.01.2026',
      ordersCount: '0',
      revenue: '0 ₽',
      cancellations: '0',
      cancellationRate: '0%',
      avgOrderValue: '0 ₽',
    },
  },
  {
    dataPoint: {
      ...mockSingleTrendPoint,
      date: '2026-01-05',
      revenue: 1234567.89,
    },
    expected: {
      date: '05.01.2026',
      revenue: '1 234 568 ₽', // Rounded
    },
  },
]

// ============================================================================
// Chart Rendering Test Props
// ============================================================================

export const defaultChartProps = {
  from: '2025-12-31',
  to: '2026-01-29',
  initialAggregation: 'day' as const,
  height: 400,
}

export const chartPropsVariations = {
  shortRange: {
    from: '2026-01-22',
    to: '2026-01-29',
    height: 300,
  },
  mediumRange: {
    from: '2025-11-01',
    to: '2026-01-29',
    initialAggregation: 'day' as const,
    height: 400,
  },
  longRange: {
    from: '2025-01-30',
    to: '2026-01-29',
    initialAggregation: 'week' as const,
    height: 450,
  },
}

// ============================================================================
// Error State Fixtures
// ============================================================================

export const mockTrendsError = new Error('Не удалось загрузить данные трендов')

export const mockNetworkError = new Error('Network request failed')

export const mockTimeoutError = new Error('Request timeout after 30000ms')

// ============================================================================
// Page-Level Test Fixtures
// ============================================================================

/** Default date range for page tests (last 30 days) */
export const defaultPageDateRange = {
  from: '2025-12-31',
  to: '2026-01-29',
}

/** URL params for page state restoration */
export const urlParamsTestCases = [
  {
    params: 'from=2025-12-31&to=2026-01-29',
    expected: { from: '2025-12-31', to: '2026-01-29', aggregation: 'day' },
  },
  {
    params: 'from=2025-11-01&to=2026-01-29&aggregation=week',
    expected: { from: '2025-11-01', to: '2026-01-29', aggregation: 'week' },
  },
  {
    params: '', // Empty params - expects default 30 days
    expected: { from: 'dynamic', to: 'dynamic', aggregation: 'day' },
  },
  {
    params: 'invalid=params', // Invalid params - expects default
    expected: { from: 'dynamic', to: 'dynamic', aggregation: 'day' },
  },
]

/** Summary cards expected content */
export const summaryCardsExpected = {
  totalOrders: {
    label: 'Всего заказов',
    icon: 'ShoppingCart',
  },
  avgDaily: {
    label: 'В среднем в день',
    icon: 'TrendingUp',
  },
  cancellationRate: {
    label: 'Отмены',
    icon: 'XCircle',
  },
  returnRate: {
    label: 'Возвраты',
    icon: 'RotateCcw',
  },
}

/** Page breadcrumbs */
export const pageBreadcrumbs = [
  { label: 'Аналитика', href: '/analytics' },
  { label: 'Заказы FBS', href: '/analytics/orders' },
]

/** Preset date ranges for quick selection */
export const dateRangePresets = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
  { label: '180 дней', days: 180 },
  { label: '365 дней', days: 365 },
]

// ============================================================================
// Recharts Mock Payload Fixtures
// ============================================================================

/** Mock Recharts tooltip payload for TrendsTooltip tests */
export const mockRechartsPayload = {
  active: true,
  payload: [
    {
      dataKey: 'ordersCount',
      value: 45,
      color: LINE_COLORS.orders,
      payload: mockSingleTrendPoint,
    },
    {
      dataKey: 'revenue',
      value: 67500,
      color: LINE_COLORS.revenue,
      payload: mockSingleTrendPoint,
    },
    {
      dataKey: 'cancellations',
      value: 3,
      color: LINE_COLORS.cancellations,
      payload: mockSingleTrendPoint,
    },
  ],
}

export const mockRechartsPayloadEmpty = {
  active: false,
  payload: [],
}

export const mockRechartsPayloadUndefined = {
  active: true,
  payload: undefined,
}
