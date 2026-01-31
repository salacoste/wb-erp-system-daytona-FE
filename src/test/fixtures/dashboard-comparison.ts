/**
 * Test Fixtures for Dashboard Period Comparison
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 * Epic 63-FE: Dashboard Business Logic
 *
 * Fixtures for testing:
 * - PeriodComparisonSection component
 * - PeriodComparisonCard component
 * - ComparisonModeToggle component
 * - DeltaIndicator with inverted direction
 */

// =============================================================================
// Period Comparison Response Fixtures
// =============================================================================

export const mockWoWComparisonResponse = {
  period1: {
    week: '2026-W05',
    revenue: 150234.0,
    profit: 45070.2,
    margin_pct: 30.0,
    orders: 85,
    cogs: 90140.4,
    logistics: 12000.0,
    storage: 3500.0,
    advertising: 8000.0,
  },
  period2: {
    week: '2026-W04',
    revenue: 127564.0,
    profit: 35717.92,
    margin_pct: 28.0,
    orders: 72,
    cogs: 78026.0,
    logistics: 11000.0,
    storage: 3200.0,
    advertising: 7500.0,
  },
  delta: {
    revenue: { absolute: 22670.0, percent: 17.77 },
    profit: { absolute: 9352.28, percent: 26.18 },
    margin_pct: { absolute: 2.0, percent: 7.14 },
    orders: { absolute: 13, percent: 18.06 },
    cogs: { absolute: 12114.4, percent: 15.53 },
    logistics: { absolute: 1000.0, percent: 9.09 },
    storage: { absolute: 300.0, percent: 9.38 },
    advertising: { absolute: 500.0, percent: 6.67 },
  },
}

export const mockMoMComparisonResponse = {
  period1: {
    week: '2026-W01:W05',
    revenue: 625000.0,
    profit: 187500.0,
    margin_pct: 30.0,
    orders: 420,
    cogs: 375000.0,
    logistics: 62500.0,
    storage: 15625.0,
    advertising: 40000.0,
  },
  period2: {
    week: '2025-W49:W52',
    revenue: 580000.0,
    profit: 162400.0,
    margin_pct: 28.0,
    orders: 390,
    cogs: 348000.0,
    logistics: 58000.0,
    storage: 14500.0,
    advertising: 38000.0,
  },
  delta: {
    revenue: { absolute: 45000.0, percent: 7.76 },
    profit: { absolute: 25100.0, percent: 15.46 },
    margin_pct: { absolute: 2.0, percent: 7.14 },
    orders: { absolute: 30, percent: 7.69 },
    cogs: { absolute: 27000.0, percent: 7.76 },
    logistics: { absolute: 4500.0, percent: 7.76 },
    storage: { absolute: 1125.0, percent: 7.76 },
    advertising: { absolute: 2000.0, percent: 5.26 },
  },
}

// =============================================================================
// Negative Growth Response (Decline)
// =============================================================================

export const mockNegativeGrowthComparison = {
  period1: {
    week: '2026-W05',
    revenue: 100000.0,
    profit: 15000.0,
    margin_pct: 15.0,
    orders: 50,
    cogs: 70000.0,
    logistics: 10000.0,
    storage: 3000.0,
    advertising: 5000.0,
  },
  period2: {
    week: '2026-W04',
    revenue: 120000.0,
    profit: 24000.0,
    margin_pct: 20.0,
    orders: 65,
    cogs: 72000.0,
    logistics: 12000.0,
    storage: 3500.0,
    advertising: 6000.0,
  },
  delta: {
    revenue: { absolute: -20000.0, percent: -16.67 },
    profit: { absolute: -9000.0, percent: -37.5 },
    margin_pct: { absolute: -5.0, percent: -25.0 },
    orders: { absolute: -15, percent: -23.08 },
    cogs: { absolute: -2000.0, percent: -2.78 },
    logistics: { absolute: -2000.0, percent: -16.67 }, // Decrease = good
    storage: { absolute: -500.0, percent: -14.29 }, // Decrease = good
    advertising: { absolute: -1000.0, percent: -16.67 },
  },
}

// =============================================================================
// Zero/Neutral Change Response
// =============================================================================

export const mockZeroChangeComparison = {
  period1: {
    week: '2026-W05',
    revenue: 100000.0,
    profit: 20000.0,
    margin_pct: 20.0,
    orders: 60,
    cogs: 60000.0,
    logistics: 10000.0,
    storage: 5000.0,
    advertising: 5000.0,
  },
  period2: {
    week: '2026-W04',
    revenue: 100000.0,
    profit: 20000.0,
    margin_pct: 20.0,
    orders: 60,
    cogs: 60000.0,
    logistics: 10000.0,
    storage: 5000.0,
    advertising: 5000.0,
  },
  delta: {
    revenue: { absolute: 0, percent: 0 },
    profit: { absolute: 0, percent: 0 },
    margin_pct: { absolute: 0, percent: 0 },
    orders: { absolute: 0, percent: 0 },
    cogs: { absolute: 0, percent: 0 },
    logistics: { absolute: 0, percent: 0 },
    storage: { absolute: 0, percent: 0 },
    advertising: { absolute: 0, percent: 0 },
  },
}

// =============================================================================
// Edge Cases
// =============================================================================

export const mockNullValuesComparison = {
  period1: {
    week: '2026-W05',
    revenue: null,
    profit: null,
    margin_pct: null,
    orders: null,
    cogs: null,
    logistics: null,
    storage: null,
    advertising: null,
  },
  period2: {
    week: '2026-W04',
    revenue: 100000.0,
    profit: 20000.0,
    margin_pct: 20.0,
    orders: 60,
    cogs: 60000.0,
    logistics: 10000.0,
    storage: 5000.0,
    advertising: 5000.0,
  },
  delta: null,
}

export const mockLargeChangeComparison = {
  period1: {
    week: '2026-W05',
    revenue: 1000000.0,
    profit: 300000.0,
    margin_pct: 30.0,
    orders: 500,
    cogs: 600000.0,
    logistics: 50000.0,
    storage: 25000.0,
    advertising: 25000.0,
  },
  period2: {
    week: '2026-W04',
    revenue: 50000.0,
    profit: 10000.0,
    margin_pct: 20.0,
    orders: 25,
    cogs: 30000.0,
    logistics: 5000.0,
    storage: 2500.0,
    advertising: 2500.0,
  },
  delta: {
    revenue: { absolute: 950000.0, percent: 1900.0 }, // >1000%
    profit: { absolute: 290000.0, percent: 2900.0 },
    margin_pct: { absolute: 10.0, percent: 50.0 },
    orders: { absolute: 475, percent: 1900.0 },
    cogs: { absolute: 570000.0, percent: 1900.0 },
    logistics: { absolute: 45000.0, percent: 900.0 },
    storage: { absolute: 22500.0, percent: 900.0 },
    advertising: { absolute: 22500.0, percent: 900.0 },
  },
}

// =============================================================================
// Metric Card Props Fixtures
// =============================================================================

export const mockRevenueCardProps = {
  title: 'Выручка',
  currentValue: 150234.0,
  previousValue: 127564.0,
  delta: { absolute: 22670.0, percent: 17.77 },
  currentPeriodLabel: 'W05',
  previousPeriodLabel: 'W04',
  format: 'currency' as const,
  invertDirection: false,
}

export const mockLogisticsCardProps = {
  title: 'Логистика',
  currentValue: 12000.0,
  previousValue: 11000.0,
  delta: { absolute: 1000.0, percent: 9.09 },
  currentPeriodLabel: 'W05',
  previousPeriodLabel: 'W04',
  format: 'currency' as const,
  invertDirection: true, // Expense - increase is bad
}

export const mockStorageCardProps = {
  title: 'Хранение',
  currentValue: 3500.0,
  previousValue: 3200.0,
  delta: { absolute: 300.0, percent: 9.38 },
  currentPeriodLabel: 'W05',
  previousPeriodLabel: 'W04',
  format: 'currency' as const,
  invertDirection: true, // Expense - increase is bad
}

export const mockMarginCardProps = {
  title: 'Маржа',
  currentValue: 30.0,
  previousValue: 28.0,
  delta: { absolute: 2.0, percent: 7.14 },
  currentPeriodLabel: 'W05',
  previousPeriodLabel: 'W04',
  format: 'percentage' as const,
  invertDirection: false,
}

export const mockOrdersCardProps = {
  title: 'Заказы',
  currentValue: 85,
  previousValue: 72,
  delta: { absolute: 13, percent: 18.06 },
  currentPeriodLabel: 'W05',
  previousPeriodLabel: 'W04',
  format: 'number' as const,
  invertDirection: false,
}

// =============================================================================
// Constants
// =============================================================================

export const COMPARISON_METRICS = [
  'revenue',
  'profit',
  'margin_pct',
  'orders',
  'logistics',
  'storage',
] as const

export const EXPENSE_METRICS = ['logistics', 'storage'] as const

export const METRIC_LABELS = {
  revenue: 'Выручка',
  profit: 'Прибыль',
  margin_pct: 'Маржа',
  orders: 'Заказы',
  logistics: 'Логистика',
  storage: 'Хранение',
} as const

export const LOCAL_STORAGE_KEY = 'comparisonMode'
