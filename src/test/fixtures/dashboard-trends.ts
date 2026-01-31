/**
 * Test Fixtures for Dashboard Historical Trends
 * Story 63.12-FE: Historical Trends Dashboard Section
 * Epic 63-FE: Dashboard Business Logic
 *
 * Fixtures for testing:
 * - HistoricalTrendsSection component
 * - TrendsChart component
 * - TrendsLegend component
 * - TrendsSummaryGrid component
 * - TrendsPeriodSelector component
 */

// =============================================================================
// Types
// =============================================================================

export interface TrendDataPoint {
  week: string
  wb_sales_gross: number
  payout_total: number
  margin_pct?: number
  logistics_cost: number
  storage_cost: number
}

export interface MetricSummary {
  min: { value: number; week: string }
  max: { value: number; week: string }
  avg: number
  trend_pct: number
}

export interface TrendsResponse {
  data: TrendDataPoint[]
  summary?: Record<string, MetricSummary>
  meta: {
    from: string
    to: string
    weeks_count: number
    generated_at: string
  }
}

// =============================================================================
// Mock Trend Data (8 weeks)
// =============================================================================

export const mock8WeekTrendData: TrendDataPoint[] = [
  {
    week: '2025-W50',
    wb_sales_gross: 180000,
    payout_total: 125000,
    margin_pct: 30.5,
    logistics_cost: 32000,
    storage_cost: 5200,
  },
  {
    week: '2025-W51',
    wb_sales_gross: 195000,
    payout_total: 132000,
    margin_pct: 32.0,
    logistics_cost: 34500,
    storage_cost: 5800,
  },
  {
    week: '2025-W52',
    wb_sales_gross: 165000,
    payout_total: 118000,
    margin_pct: 28.5,
    logistics_cost: 30000,
    storage_cost: 4900,
  },
  {
    week: '2026-W01',
    wb_sales_gross: 175000,
    payout_total: 122000,
    margin_pct: 29.5,
    logistics_cost: 31000,
    storage_cost: 5100,
  },
  {
    week: '2026-W02',
    wb_sales_gross: 190000,
    payout_total: 135000,
    margin_pct: 31.0,
    logistics_cost: 33000,
    storage_cost: 5500,
  },
  {
    week: '2026-W03',
    wb_sales_gross: 210000,
    payout_total: 145000,
    margin_pct: 33.5,
    logistics_cost: 38000,
    storage_cost: 6500,
  },
  {
    week: '2026-W04',
    wb_sales_gross: 200000,
    payout_total: 140000,
    margin_pct: 32.5,
    logistics_cost: 36000,
    storage_cost: 6000,
  },
  {
    week: '2026-W05',
    wb_sales_gross: 205000,
    payout_total: 142000,
    margin_pct: 33.0,
    logistics_cost: 37000,
    storage_cost: 6200,
  },
]

// =============================================================================
// Mock Trend Data (4 weeks)
// =============================================================================

export const mock4WeekTrendData: TrendDataPoint[] = [
  {
    week: '2026-W02',
    wb_sales_gross: 190000,
    payout_total: 135000,
    margin_pct: 31.0,
    logistics_cost: 33000,
    storage_cost: 5500,
  },
  {
    week: '2026-W03',
    wb_sales_gross: 210000,
    payout_total: 145000,
    margin_pct: 33.5,
    logistics_cost: 38000,
    storage_cost: 6500,
  },
  {
    week: '2026-W04',
    wb_sales_gross: 200000,
    payout_total: 140000,
    margin_pct: 32.5,
    logistics_cost: 36000,
    storage_cost: 6000,
  },
  {
    week: '2026-W05',
    wb_sales_gross: 205000,
    payout_total: 142000,
    margin_pct: 33.0,
    logistics_cost: 37000,
    storage_cost: 6200,
  },
]

// =============================================================================
// Mock Trend Data (12 weeks)
// =============================================================================

export const mock12WeekTrendData: TrendDataPoint[] = [
  {
    week: '2025-W46',
    wb_sales_gross: 155000,
    payout_total: 108000,
    margin_pct: 27.0,
    logistics_cost: 28000,
    storage_cost: 4500,
  },
  {
    week: '2025-W47',
    wb_sales_gross: 160000,
    payout_total: 112000,
    margin_pct: 28.0,
    logistics_cost: 29000,
    storage_cost: 4700,
  },
  {
    week: '2025-W48',
    wb_sales_gross: 170000,
    payout_total: 118000,
    margin_pct: 29.0,
    logistics_cost: 30500,
    storage_cost: 5000,
  },
  {
    week: '2025-W49',
    wb_sales_gross: 175000,
    payout_total: 120000,
    margin_pct: 29.5,
    logistics_cost: 31500,
    storage_cost: 5100,
  },
  ...mock8WeekTrendData,
]

// =============================================================================
// Summary Statistics Fixtures
// =============================================================================

export const mock8WeekSummary: Record<string, MetricSummary> = {
  wb_sales_gross: {
    min: { value: 165000, week: '2025-W52' },
    max: { value: 210000, week: '2026-W03' },
    avg: 190000,
    trend_pct: 13.89,
  },
  payout_total: {
    min: { value: 118000, week: '2025-W52' },
    max: { value: 145000, week: '2026-W03' },
    avg: 132375,
    trend_pct: 13.6,
  },
  margin_pct: {
    min: { value: 28.5, week: '2025-W52' },
    max: { value: 33.5, week: '2026-W03' },
    avg: 31.31,
    trend_pct: 8.2,
  },
  logistics_cost: {
    min: { value: 30000, week: '2025-W52' },
    max: { value: 38000, week: '2026-W03' },
    avg: 33937.5,
    trend_pct: 15.63,
  },
  storage_cost: {
    min: { value: 4900, week: '2025-W52' },
    max: { value: 6500, week: '2026-W03' },
    avg: 5650,
    trend_pct: 19.23,
  },
}

// =============================================================================
// Full Response Fixtures
// =============================================================================

export const mockTrendsResponse8W: TrendsResponse = {
  data: mock8WeekTrendData,
  summary: mock8WeekSummary,
  meta: {
    from: '2025-W50',
    to: '2026-W05',
    weeks_count: 8,
    generated_at: '2026-01-31T12:00:00Z',
  },
}

export const mockTrendsResponse4W: TrendsResponse = {
  data: mock4WeekTrendData,
  summary: {
    wb_sales_gross: {
      min: { value: 190000, week: '2026-W02' },
      max: { value: 210000, week: '2026-W03' },
      avg: 201250,
      trend_pct: 7.89,
    },
    payout_total: {
      min: { value: 135000, week: '2026-W02' },
      max: { value: 145000, week: '2026-W03' },
      avg: 140500,
      trend_pct: 5.19,
    },
    margin_pct: {
      min: { value: 31.0, week: '2026-W02' },
      max: { value: 33.5, week: '2026-W03' },
      avg: 32.5,
      trend_pct: 6.45,
    },
    logistics_cost: {
      min: { value: 33000, week: '2026-W02' },
      max: { value: 38000, week: '2026-W03' },
      avg: 36000,
      trend_pct: 12.12,
    },
    storage_cost: {
      min: { value: 5500, week: '2026-W02' },
      max: { value: 6500, week: '2026-W03' },
      avg: 6050,
      trend_pct: 12.73,
    },
  },
  meta: {
    from: '2026-W02',
    to: '2026-W05',
    weeks_count: 4,
    generated_at: '2026-01-31T12:00:00Z',
  },
}

// =============================================================================
// Empty/Edge Case Fixtures
// =============================================================================

export const mockEmptyTrendsResponse: TrendsResponse = {
  data: [],
  meta: {
    from: '2026-W01',
    to: '2026-W05',
    weeks_count: 0,
    generated_at: '2026-01-31T12:00:00Z',
  },
}

export const mockSingleWeekTrendsResponse: TrendsResponse = {
  data: [
    {
      week: '2026-W05',
      wb_sales_gross: 205000,
      payout_total: 142000,
      margin_pct: 33.0,
      logistics_cost: 37000,
      storage_cost: 6200,
    },
  ],
  meta: {
    from: '2026-W05',
    to: '2026-W05',
    weeks_count: 1,
    generated_at: '2026-01-31T12:00:00Z',
  },
}

// =============================================================================
// Chart Configuration Constants
// =============================================================================

export const METRIC_COLORS = {
  wb_sales_gross: '#3B82F6', // Blue
  payout_total: '#22C55E', // Green
  margin_pct: '#F59E0B', // Yellow/Amber
  logistics_cost: '#EF4444', // Red
  storage_cost: '#7C4DFF', // Purple
} as const

export const METRIC_LABELS = {
  wb_sales_gross: 'Выручка',
  payout_total: 'К перечислению',
  margin_pct: 'Маржа',
  logistics_cost: 'Логистика',
  storage_cost: 'Хранение',
} as const

export type MetricKey = keyof typeof METRIC_LABELS

export const DEFAULT_VISIBLE_METRICS = new Set<MetricKey>(['wb_sales_gross', 'payout_total'])

export const PERIOD_OPTIONS = [4, 8, 12] as const
export type PeriodWeeks = (typeof PERIOD_OPTIONS)[number]

export const LOCAL_STORAGE_KEYS = {
  expanded: 'trendsExpanded',
  period: 'trendsPeriod',
  metrics: 'trendsMetrics',
} as const
