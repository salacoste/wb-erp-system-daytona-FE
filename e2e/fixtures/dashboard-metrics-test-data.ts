/**
 * Dashboard Metrics Test Data and Selectors
 * Story 62.10-FE: E2E Tests for Dashboard Metrics
 *
 * @see docs/stories/epic-62/story-62.10-fe-e2e-tests-dashboard-metrics.md
 */

/**
 * Data-testid selectors for dashboard metric components
 */
export const DASHBOARD_METRICS_SELECTORS = {
  // Metric Cards Grid
  metricsGrid: '[role="region"][aria-label="Основные метрики"]',
  metricCard: '[data-testid="metric-card"]',
  metricCardSkeleton: '[data-testid="metric-card-skeleton"]',
  metricValue: '[data-testid="metric-value"]',
  comparisonBadge: '[data-testid="comparison-badge"]',

  // Specific Cards (by metric type)
  ordersCard: '[data-testid="metric-card-orders"]',
  ordersCogsCard: '[data-testid="metric-card-orders-cogs"]',
  salesCard: '[data-testid="metric-card-sales"]',
  salesCogsCard: '[data-testid="metric-card-sales-cogs"]',
  advertisingCard: '[data-testid="metric-card-advertising"]',
  logisticsCard: '[data-testid="metric-card-logistics"]',
  storageCard: '[data-testid="metric-card-storage"]',
  profitCard: '[data-testid="metric-card-profit"]',

  // Daily Breakdown Section
  dailyBreakdownSection: 'section[aria-labelledby="daily-breakdown-title"]',
  dailyBreakdownTitle: '#daily-breakdown-title',
  dailyBreakdownChart: '[data-testid="daily-breakdown-chart"]',
  chartContainer: '[role="img"][aria-label*="детализации"]',
  chartDescription: '#chart-description',

  // View Toggle
  viewToggle: '[role="radiogroup"][aria-label="Выбор представления данных"]',
  viewChartButton: 'button[role="radio"][aria-label="Показать график"]',
  viewTableButton: 'button[role="radio"][aria-label="Показать таблицу"]',

  // Legend
  legendContainer: '[role="group"][aria-label="Управление отображением метрик"]',
  legendItem: (metric: string) => `button[data-metric="${metric}"]`,
  legendShowAllButton: 'button:has-text("Все")',
  legendResetButton: 'button:has-text("Сбросить")',

  // Table
  dailyMetricsTable: 'table[aria-label="Детализация по дням"]',
  tableHeader: 'thead th',
  tableRow: 'tbody tr',
  tableTotalsRow: 'tfoot tr',
  tableSkeleton: '[aria-busy="true"][aria-label="Загрузка данных"]',

  // Error States
  errorState: '[data-testid="error-state"]',
  chartErrorState: '[data-testid="chart-error-state"]',
  partialDataWarning: '[data-testid="partial-data-warning"]',

  // Loading States
  loadingSkeleton: '[class*="skeleton"]',
  chartLoadingSkeleton: '[data-testid="chart-loading-skeleton"]',

  // Profit Breakdown Popover
  profitBreakdownPopover: '[data-testid="profit-breakdown-popover"]',

  // COGS Warning Badge
  cogsWarningBadge: '[data-testid="cogs-warning-badge"]',
}

/**
 * Metric keys matching chart-config.ts
 */
export const METRIC_KEYS = [
  'orders',
  'ordersCogs',
  'sales',
  'salesCogs',
  'advertising',
  'logistics',
  'storage',
  'profit',
] as const

/**
 * Russian metric labels for assertions
 */
export const METRIC_LABELS = {
  orders: 'Заказы',
  ordersCogs: 'COGS заказов',
  sales: 'Выкупы',
  salesCogs: 'COGS выкупов',
  advertising: 'Реклама',
  logistics: 'Логистика',
  storage: 'Хранение',
  profit: 'Теор.прибыль',
}

/**
 * Default visible series in legend
 */
export const DEFAULT_VISIBLE_SERIES = ['orders', 'sales', 'advertising', 'profit']

/**
 * Table column headers in Russian
 */
export const TABLE_COLUMNS = [
  'День',
  'Заказы',
  'COGS',
  'Выкупы',
  'COGS',
  'Реклама',
  'Логистика',
  'Хранение',
  'Прибыль',
]

/**
 * LocalStorage keys for preferences
 */
export const STORAGE_KEYS = {
  viewPreference: 'dashboard-view-preference',
  legendVisibility: 'dashboard-legend-visibility',
}

/**
 * API routes for mocking
 */
export const DASHBOARD_API_ROUTES = {
  ordersVolume: '**/api/v1/analytics/orders-volume**',
  financeSummary: '**/api/v1/analytics/weekly/finance-summary**',
  dailyMetrics: '**/api/v1/analytics/daily**',
  advertisingSpend: '**/api/v1/analytics/advertising**',
}
