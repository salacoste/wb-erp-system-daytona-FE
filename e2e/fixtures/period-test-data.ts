/**
 * Period Test Data and Selectors for Dashboard Period Switching E2E Tests
 * Story 60.9-FE: E2E Tests for Period Switching
 *
 * @see docs/stories/epic-60/story-60.9-fe-e2e-tests.md
 */

/**
 * Test period values (ISO format)
 * These should align with available data in the test backend
 */
export const TEST_PERIODS = {
  currentWeek: '2026-W05',
  previousWeek: '2026-W04',
  week3: '2026-W03',
  currentMonth: '2026-01',
  previousMonth: '2025-12',
}

/**
 * Period selector data-testid selectors
 * Used for locating elements in Playwright tests
 */
export const PERIOD_SELECTORS = {
  // Period type toggle (Tabs component)
  periodToggle: '[data-testid="period-type-toggle"]',
  weekTab: '[data-testid="period-tab-week"]',
  monthTab: '[data-testid="period-tab-month"]',

  // Period dropdowns (Select components)
  weekDropdown: '[data-testid="week-selector"]',
  monthDropdown: '[data-testid="month-selector"]',

  // Refresh functionality
  refreshButton: '[data-testid="refresh-button"]',
  refreshSpinner: '[data-testid="refresh-spinner"]',
  lastUpdated: '[data-testid="last-updated"]',

  // Period context display
  periodContextLabel: '[data-testid="period-context-label"]',
  periodSelectorContainer: '[data-testid="period-selector-container"]',

  // Metric cards
  metricCard: '[data-testid="metric-card"]',
  metricCardSkeleton: '[data-testid="metric-card-skeleton"]',
  metricValue: '[data-testid="metric-value"]',

  // Comparison indicators
  comparisonBadge: '[data-testid="comparison-badge"]',
  trendIndicator: '[data-testid="trend-indicator"]',
}

/**
 * Russian labels for period selector (used in text assertions)
 */
export const PERIOD_LABELS = {
  week: 'Неделя',
  month: 'Месяц',
  refreshLabel: 'Обновлено',
  periodOverview: 'Обзор за',
  selectPeriod: 'Выберите период',
}

/**
 * Expected week label patterns (Russian format)
 * Used for dropdown option text matching
 */
export const WEEK_LABEL_PATTERNS = {
  week5_2026: /Неделя 5, 2026/,
  week4_2026: /Неделя 4, 2026/,
  week3_2026: /Неделя 3, 2026/,
}

/**
 * Expected month label patterns (Russian format)
 */
export const MONTH_LABEL_PATTERNS = {
  january_2026: /Январь 2026/,
  december_2025: /Декабрь 2025/,
}

/**
 * URL parameter patterns for assertions
 */
export const URL_PATTERNS = {
  weekParam: /week=\d{4}-W\d{2}/,
  monthParam: /month=\d{4}-\d{2}/,
  typeWeek: /type=week/,
  typeMonth: /type=month/,
}

/**
 * API route patterns for intercepting requests
 */
export const API_ROUTES = {
  weeklyAnalytics: '**/api/v1/analytics/weekly/**',
  financeSummary: '**/api/v1/analytics/weekly/finance-summary**',
  availableWeeks: '**/api/v1/analytics/weeks**',
}

/**
 * Mock data for testing (when using route interception)
 */
export const MOCK_METRICS = {
  week5: {
    payout_total: 87074.72,
    revenue: 150000,
    logistics_cost: 25000,
    storage_cost: 8000,
    margin_pct: 15.5,
    product_count: 142,
  },
  week4: {
    payout_total: 82780.0,
    revenue: 145000,
    logistics_cost: 24000,
    storage_cost: 7500,
    margin_pct: 14.2,
    product_count: 138,
  },
}

/**
 * Comparison indicators expected patterns
 */
export const COMPARISON_PATTERNS = {
  positiveChange: /\+\d+[,.]?\d*%/,
  negativeChange: /-\d+[,.]?\d*%/,
  noChange: /0[,.]?0*%/,
}
