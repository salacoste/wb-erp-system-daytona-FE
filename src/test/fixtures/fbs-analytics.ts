/**
 * Test Fixtures for FBS Analytics
 * Story 51.1-FE: FBS Analytics Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Centralized test data for FBS Analytics unit tests.
 * Based on backend API examples from test-api/15-analytics-fbs.http
 */

// =============================================================================
// Type Imports (to be created in src/types/fbs-analytics.ts)
// =============================================================================

// Note: Types will be imported once src/types/fbs-analytics.ts is implemented
// import type { ... } from '@/types/fbs-analytics'

// =============================================================================
// Aggregation Types Constants
// =============================================================================

export const AGGREGATION_TYPES = ['day', 'week', 'month'] as const

export const SEASONAL_VIEW_TYPES = ['monthly', 'weekly', 'quarterly'] as const

export const TREND_METRICS = ['orders', 'revenue', 'cancellations'] as const

export const BACKFILL_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'failed',
  'paused',
] as const

export const BACKFILL_DATA_SOURCES = ['reports', 'analytics', 'both'] as const

// =============================================================================
// Trends Fixtures - Daily (0-90 days)
// =============================================================================

/** Mock daily trend data point */
export const mockTrendDataPointDaily = {
  date: '2026-01-15',
  ordersCount: 45,
  revenue: 67500.0,
  cancellations: 3,
  cancellationRate: 6.67,
  returns: 2,
  returnRate: 4.44,
  avgOrderValue: 1500.0,
}

/** Mock 30 days of daily trend data */
export const mockTrendsDailyData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2025-12-30')
  date.setDate(date.getDate() + i)
  const dateStr = date.toISOString().split('T')[0]
  const baseOrders = 40 + Math.floor(Math.random() * 20)
  return {
    date: dateStr,
    ordersCount: baseOrders,
    revenue: baseOrders * 1500,
    cancellations: Math.floor(baseOrders * 0.05),
    cancellationRate: 5.0 + Math.random() * 3,
    returns: Math.floor(baseOrders * 0.03),
    returnRate: 3.0 + Math.random() * 2,
    avgOrderValue: 1400 + Math.floor(Math.random() * 200),
  }
})

/** Mock 90 days of daily trend data */
export const mockTrends90DaysDaily = Array.from({ length: 90 }, (_, i) => {
  const date = new Date('2025-11-01')
  date.setDate(date.getDate() + i)
  const dateStr = date.toISOString().split('T')[0]
  const baseOrders = 35 + Math.floor(Math.random() * 25)
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

// =============================================================================
// Trends Fixtures - Weekly (91-365 days)
// =============================================================================

/** Mock weekly trend data point */
export const mockTrendDataPointWeekly = {
  date: '2025-W03',
  ordersCount: 315,
  revenue: 472500.0,
  cancellations: 19,
  cancellationRate: 6.03,
  returns: 13,
  returnRate: 4.13,
  avgOrderValue: 1500.0,
}

/** Mock 52 weeks (365 days) of weekly trend data */
export const mockTrends365DaysWeekly = Array.from({ length: 52 }, (_, i) => {
  const weekNum = ((i + 1) % 52) + 1
  const year = i < 4 ? 2025 : 2026
  const weekStr = `${year}-W${weekNum.toString().padStart(2, '0')}`
  const baseOrders = 280 + Math.floor(Math.random() * 70)
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

// =============================================================================
// Trends Summary Fixtures
// =============================================================================

export const mockTrendsSummary = {
  totalOrders: 1350,
  totalRevenue: 2025000.0,
  avgDailyOrders: 45.0,
  cancellationRate: 5.78,
  returnRate: 3.85,
}

export const mockTrendsSummaryYearly = {
  totalOrders: 16380,
  totalRevenue: 24237600.0,
  avgDailyOrders: 44.9,
  cancellationRate: 5.5,
  returnRate: 3.5,
}

// =============================================================================
// Trends Response Fixtures
// =============================================================================

export const mockTrendsResponseDaily = {
  trends: mockTrendsDailyData,
  summary: mockTrendsSummary,
  dataSource: { primary: 'orders_fbs' as const },
  period: {
    from: '2025-12-30',
    to: '2026-01-28',
    aggregation: 'day' as const,
    daysIncluded: 30,
  },
}

export const mockTrendsResponseWeekly = {
  trends: mockTrends365DaysWeekly,
  summary: mockTrendsSummaryYearly,
  dataSource: { primary: 'analytics' as const },
  period: {
    from: '2025-01-29',
    to: '2026-01-28',
    aggregation: 'week' as const,
    daysIncluded: 365,
  },
}

export const mockTrendsResponseEmpty = {
  trends: [],
  summary: {
    totalOrders: 0,
    totalRevenue: 0,
    avgDailyOrders: 0,
    cancellationRate: 0,
    returnRate: 0,
  },
  dataSource: { primary: 'orders_fbs' as const },
  period: {
    from: '2026-01-01',
    to: '2026-01-28',
    aggregation: 'day' as const,
    daysIncluded: 28,
  },
}

// =============================================================================
// Seasonal Patterns Fixtures - Monthly
// =============================================================================

export const mockMonthlyPatterns = [
  { month: 'January', avgOrders: 1200, avgRevenue: 1800000 },
  { month: 'February', avgOrders: 1100, avgRevenue: 1650000 },
  { month: 'March', avgOrders: 1300, avgRevenue: 1950000 },
  { month: 'April', avgOrders: 1150, avgRevenue: 1725000 },
  { month: 'May', avgOrders: 1250, avgRevenue: 1875000 },
  { month: 'June', avgOrders: 1050, avgRevenue: 1575000 },
  { month: 'July', avgOrders: 950, avgRevenue: 1425000 },
  { month: 'August', avgOrders: 1000, avgRevenue: 1500000 },
  { month: 'September', avgOrders: 1350, avgRevenue: 2025000 },
  { month: 'October', avgOrders: 1400, avgRevenue: 2100000 },
  { month: 'November', avgOrders: 1800, avgRevenue: 2700000 },
  { month: 'December', avgOrders: 2200, avgRevenue: 3300000 },
]

// =============================================================================
// Seasonal Patterns Fixtures - Weekly (Day of Week)
// =============================================================================

export const mockWeekdayPatterns = [
  { dayOfWeek: 'Sunday', avgOrders: 35 },
  { dayOfWeek: 'Monday', avgOrders: 52 },
  { dayOfWeek: 'Tuesday', avgOrders: 48 },
  { dayOfWeek: 'Wednesday', avgOrders: 45 },
  { dayOfWeek: 'Thursday', avgOrders: 50 },
  { dayOfWeek: 'Friday', avgOrders: 55 },
  { dayOfWeek: 'Saturday', avgOrders: 42 },
]

// =============================================================================
// Seasonal Patterns Fixtures - Quarterly
// =============================================================================

export const mockQuarterlyPatterns = [
  { quarter: 'Q1', avgOrders: 3600, avgRevenue: 5400000 },
  { quarter: 'Q2', avgOrders: 3450, avgRevenue: 5175000 },
  { quarter: 'Q3', avgOrders: 3300, avgRevenue: 4950000 },
  { quarter: 'Q4', avgOrders: 5400, avgRevenue: 8100000 },
]

// =============================================================================
// Seasonal Insights Fixtures
// =============================================================================

export const mockSeasonalInsights = {
  peakMonth: 'December',
  lowMonth: 'July',
  peakDayOfWeek: 'Friday',
  seasonalityIndex: 0.72,
}

// =============================================================================
// Seasonal Response Fixtures
// =============================================================================

export const mockSeasonalResponseMonthly = {
  patterns: { monthly: mockMonthlyPatterns },
  insights: mockSeasonalInsights,
}

export const mockSeasonalResponseWeekly = {
  patterns: { weekday: mockWeekdayPatterns },
  insights: mockSeasonalInsights,
}

export const mockSeasonalResponseQuarterly = {
  patterns: { quarterly: mockQuarterlyPatterns },
  insights: mockSeasonalInsights,
}

export const mockSeasonalResponseAll = {
  patterns: {
    monthly: mockMonthlyPatterns,
    weekday: mockWeekdayPatterns,
    quarterly: mockQuarterlyPatterns,
  },
  insights: mockSeasonalInsights,
}

// =============================================================================
// Comparison Fixtures - Period Metrics
// =============================================================================

export const mockPeriodMetrics1 = {
  from: '2025-12-01',
  to: '2025-12-31',
  ordersCount: 1450,
  revenue: 2175000.0,
  cancellationRate: 5.5,
  avgOrderValue: 1500.0,
}

export const mockPeriodMetrics2 = {
  from: '2026-01-01',
  to: '2026-01-28',
  ordersCount: 1260,
  revenue: 1890000.0,
  cancellationRate: 6.2,
  avgOrderValue: 1500.0,
}

// =============================================================================
// Comparison Fixtures - Delta Metrics
// =============================================================================

export const mockComparisonMetrics = {
  ordersChange: -190,
  ordersChangePercent: -13.1,
  revenueChange: -285000,
  revenueChangePercent: -13.1,
  cancellationRateChange: 0.7,
  avgOrderValueChange: 0,
  avgOrderValueChangePercent: 0,
}

export const mockComparisonMetricsPositive = {
  ordersChange: 200,
  ordersChangePercent: 15.5,
  revenueChange: 350000,
  revenueChangePercent: 18.2,
  cancellationRateChange: -1.2,
  avgOrderValueChange: 50,
  avgOrderValueChangePercent: 3.3,
}

// =============================================================================
// Comparison Response Fixtures
// =============================================================================

export const mockCompareResponse = {
  period1: mockPeriodMetrics1,
  period2: mockPeriodMetrics2,
  comparison: mockComparisonMetrics,
}

export const mockCompareResponsePositive = {
  period1: mockPeriodMetrics2,
  period2: mockPeriodMetrics1,
  comparison: mockComparisonMetricsPositive,
}

// =============================================================================
// Backfill Status Fixtures - In Progress
// =============================================================================

export const mockBackfillStatusInProgress = {
  cabinetId: 'cabinet-uuid-001',
  cabinetName: 'Магазин Одежды',
  reportsStatus: 'completed' as const,
  analyticsStatus: 'in_progress' as const,
  overallProgress: 65,
  estimatedEta: '2026-01-29T15:30:00Z',
  errors: [],
}

// =============================================================================
// Backfill Status Fixtures - Completed
// =============================================================================

export const mockBackfillStatusCompleted = {
  cabinetId: 'cabinet-uuid-002',
  cabinetName: 'Магазин Обуви',
  reportsStatus: 'completed' as const,
  analyticsStatus: 'completed' as const,
  overallProgress: 100,
  estimatedEta: null,
  errors: [],
}

// =============================================================================
// Backfill Status Fixtures - Failed
// =============================================================================

export const mockBackfillStatusFailed = {
  cabinetId: 'cabinet-uuid-003',
  cabinetName: 'Магазин Аксессуаров',
  reportsStatus: 'completed' as const,
  analyticsStatus: 'failed' as const,
  overallProgress: 45,
  estimatedEta: null,
  errors: ['WB API timeout after 5 retries', 'Rate limit exceeded'],
}

// =============================================================================
// Backfill Status Fixtures - Paused
// =============================================================================

export const mockBackfillStatusPaused = {
  cabinetId: 'cabinet-uuid-004',
  cabinetName: 'Магазин Косметики',
  reportsStatus: 'paused' as const,
  analyticsStatus: 'pending' as const,
  overallProgress: 30,
  estimatedEta: null,
  errors: [],
}

// =============================================================================
// Backfill Status Response Fixtures
// =============================================================================

export const mockBackfillStatusResponse = [
  mockBackfillStatusInProgress,
  mockBackfillStatusCompleted,
  mockBackfillStatusFailed,
  mockBackfillStatusPaused,
]

export const mockBackfillStatusResponseEmpty: typeof mockBackfillStatusResponse = []

// =============================================================================
// Backfill Request/Response Fixtures
// =============================================================================

export const mockStartBackfillRequest = {
  cabinetId: 'cabinet-uuid-001',
  dataSource: 'both' as const,
  dateFrom: '2025-01-29',
  dateTo: '2026-01-28',
  priority: 10,
}

export const mockStartBackfillRequestAllCabinets = {
  dataSource: 'both' as const,
}

export const mockStartBackfillResponse = {
  success: true,
  message: 'Backfill jobs enqueued successfully',
  jobCount: 4,
  jobIds: ['job-uuid-001', 'job-uuid-002', 'job-uuid-003', 'job-uuid-004'],
}

export const mockBackfillActionResponse = {
  success: true,
  message: 'Backfill paused successfully',
}

export const mockBackfillActionResponseResume = {
  success: true,
  message: 'Backfill resumed successfully',
}

// =============================================================================
// Error Response Fixtures
// =============================================================================

export const mockErrorInvalidDateFormat = {
  error: {
    code: 'INVALID_DATE_FORMAT' as const,
    message: 'Date must be in YYYY-MM-DD format',
  },
}

export const mockErrorInvalidDateRange = {
  error: {
    code: 'INVALID_DATE_RANGE' as const,
    message: 'Start date must be before end date',
  },
}

export const mockErrorDateRangeExceeded = {
  error: {
    code: 'DATE_RANGE_EXCEEDED' as const,
    message: 'Date range cannot exceed 365 days',
  },
}

export const mockErrorUnauthorized = {
  error: {
    code: 'UNAUTHORIZED' as const,
    message: 'Authentication required',
  },
}

export const mockErrorForbidden = {
  error: {
    code: 'FORBIDDEN' as const,
    message: 'Owner role required for admin operations',
  },
}

export const mockErrorCabinetNotFound = {
  error: {
    code: 'CABINET_NOT_FOUND' as const,
    message: 'Cabinet not found',
  },
}

// =============================================================================
// Query Params Fixtures
// =============================================================================

export const mockFbsTrendsParams = {
  from: '2025-12-30',
  to: '2026-01-28',
  aggregation: 'day' as const,
  metrics: ['orders', 'revenue'] as const,
}

export const mockFbsTrendsParamsMinimal = {
  from: '2025-12-30',
  to: '2026-01-28',
}

export const mockFbsSeasonalParams = {
  months: 12,
  view: 'monthly' as const,
}

export const mockFbsSeasonalParamsEmpty = {}

export const mockFbsCompareParams = {
  period1From: '2025-12-01',
  period1To: '2025-12-31',
  period2From: '2026-01-01',
  period2To: '2026-01-28',
}

// =============================================================================
// Aliases for Hook Tests (Story 51.2-FE compatibility)
// =============================================================================

/** Alias for mockTrendsResponseDaily */
export const mockTrendsResponse = mockTrendsResponseDaily

/** Alias for mockTrendsResponseEmpty */
export const mockEmptyTrendsResponse = mockTrendsResponseEmpty

/** Alias for mockTrendsResponseWeekly */
export const mockWeeklyTrendsResponse = mockTrendsResponseWeekly

/** Alias for mockSeasonalResponseAll */
export const mockSeasonalResponse = mockSeasonalResponseAll

/** Alias for mockSeasonalResponseMonthly */
export const mockMonthlyOnlySeasonalResponse = mockSeasonalResponseMonthly

/** Alias for mockSeasonalResponseWeekly */
export const mockWeeklyOnlySeasonalResponse = mockSeasonalResponseWeekly

/** Alias for mockSeasonalResponseQuarterly */
export const mockQuarterlyOnlySeasonalResponse = mockSeasonalResponseQuarterly

/** Negative comparison response (period2 worse than period1) */
export const mockNegativeCompareResponse = mockCompareResponse
