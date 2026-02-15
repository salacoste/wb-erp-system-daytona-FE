/**
 * Shared Mock Factories for Epic 65 Wave 3 TDD Tests
 *
 * Provides mock API response factories for new/extended endpoints.
 * Mock data structures match the backend-gap-analysis.md specifications.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 */

import type { FinanceSummary } from '@/types/finance-summary'
import type { FulfillmentSummaryResponse } from '@/types/fulfillment'

// =============================================================================
// Inventory Summary (Request #140)
// =============================================================================

/**
 * Response type for GET /v1/inventory/summary
 * Matches backend-gap-analysis.md Section 3, Request #140
 */
export interface InventorySummaryResponse {
  totalStock: number
  onWarehouse: number
  inWayToClient: number
  inWayFromClient: number
  capitalizationByCogs: number | null
  capitalizationByRetail: number
  cogsCoveragePct: number
  uniqueSkus: number
  warehouseBreakdown: Array<{ name: string; count: number }>
  snapshotDate: string
  snapshotSyncedAt: string
}

/**
 * Factory for inventory/summary mock response
 * Default: realistic stock data with full COGS coverage
 */
export function createInventorySummaryMock(
  overrides: Partial<InventorySummaryResponse> = {}
): InventorySummaryResponse {
  return {
    totalStock: 2988,
    onWarehouse: 2756,
    inWayToClient: 207,
    inWayFromClient: 25,
    capitalizationByCogs: 1485600,
    capitalizationByRetail: 2297861,
    cogsCoveragePct: 95.4,
    uniqueSkus: 145,
    warehouseBreakdown: [
      { name: 'Коледино', count: 1200 },
      { name: 'Подольск', count: 800 },
      { name: 'Электросталь', count: 756 },
    ],
    snapshotDate: '2026-02-14',
    snapshotSyncedAt: '2026-02-14T10:00:00Z',
    ...overrides,
  }
}

/**
 * Factory for inventory summary with no COGS data
 */
export function createInventoryNoCogsMock(): InventorySummaryResponse {
  return createInventorySummaryMock({
    capitalizationByCogs: null,
    cogsCoveragePct: 0,
  })
}

/**
 * Factory for empty inventory (no snapshots)
 */
export function createEmptyInventoryMock(): InventorySummaryResponse {
  return createInventorySummaryMock({
    totalStock: 0,
    onWarehouse: 0,
    inWayToClient: 0,
    inWayFromClient: 0,
    capitalizationByCogs: null,
    capitalizationByRetail: 0,
    cogsCoveragePct: 0,
    uniqueSkus: 0,
    warehouseBreakdown: [],
  })
}

// =============================================================================
// Finance Summary (Extended for Request #142)
// =============================================================================

/**
 * Extended finance-summary fields for penalties/compensations separation
 * Matches backend-gap-analysis.md Section 3, Request #142
 */
export interface ExtendedFinanceSummary extends FinanceSummary {
  penalties_amount?: number
  corrections_amount?: number
}

/**
 * Factory for extended finance-summary with penalties/compensations split
 */
export function createFinanceSummaryMock(
  overrides: Partial<ExtendedFinanceSummary> = {}
): ExtendedFinanceSummary {
  return {
    week: '2026-W06',
    payout_total: 84377,
    sale_gross_total: 145266,
    sales_gross_total: 153220,
    returns_gross_total: 7954,
    logistics_cost_total: 17566,
    storage_cost_total: 2024,
    paid_acceptance_cost_total: 450,
    penalties_total: 1200,
    other_adjustments_net_total: -3500,
    wb_commission_adj_total: -800,
    wb_services_cost_total: 2100,
    wb_promotion_cost_total: 1200,
    wb_jam_cost_total: 500,
    wb_other_services_cost_total: 400,
    cogs_total: 35818,
    cogs_coverage_pct: 95,
    gross_profit: 109448,
    margin_pct: 75.3,
    retail_price_total: 198000,
    // Request #142 new fields
    penalties_amount: 1200,
    corrections_amount: 850,
    ...overrides,
  }
}

/**
 * Factory for previous period finance-summary (for comparison)
 */
export function createPreviousFinanceSummaryMock(
  overrides: Partial<ExtendedFinanceSummary> = {}
): ExtendedFinanceSummary {
  return createFinanceSummaryMock({
    week: '2026-W05',
    payout_total: 79000,
    sale_gross_total: 138000,
    sales_gross_total: 146000,
    returns_gross_total: 8000,
    logistics_cost_total: 16800,
    storage_cost_total: 1950,
    penalties_total: 900,
    penalties_amount: 900,
    corrections_amount: 600,
    wb_services_cost_total: 1800,
    wb_promotion_cost_total: 1000,
    wb_jam_cost_total: 450,
    wb_other_services_cost_total: 350,
    cogs_total: 34000,
    gross_profit: 104000,
    margin_pct: 75.4,
    ...overrides,
  })
}

// =============================================================================
// Cabinet Settings (Request #141)
// =============================================================================

/**
 * Cabinet model with tax settings
 * Matches backend-gap-analysis.md Section 3, Request #141
 */
export interface CabinetWithTaxSettings {
  id: string
  name: string
  taxSystem?: 'usn6' | 'usn15' | 'manual' | null
  taxRate?: number | null
}

/**
 * Factory for cabinet with tax settings
 */
export function createCabinetSettingsMock(
  overrides: Partial<CabinetWithTaxSettings> = {}
): CabinetWithTaxSettings {
  return {
    id: 'cab-001',
    name: 'Test Cabinet',
    taxSystem: 'usn6',
    taxRate: null,
    ...overrides,
  }
}

// =============================================================================
// Fulfillment Summary (existing endpoint, used for turnover)
// =============================================================================

/**
 * Factory for fulfillment/summary response
 * Used by turnover calculation (Story 65.10)
 */
export function createFulfillmentSummaryMock(
  overrides: Partial<FulfillmentSummaryResponse> = {}
): FulfillmentSummaryResponse {
  return {
    summary: {
      fbo: {
        ordersCount: 280,
        ordersRevenue: 420000,
        salesCount: 210,
        salesRevenue: 315000,
        forPayTotal: 250000,
        returnsCount: 15,
        returnsRevenue: 22500,
        returnRate: 5.4,
        avgOrderValue: 1500,
      },
      fbs: {
        ordersCount: 120,
        ordersRevenue: 180000,
        salesCount: 100,
        salesRevenue: 150000,
        forPayTotal: 120000,
        returnsCount: 8,
        returnsRevenue: 12000,
        returnRate: 6.7,
        avgOrderValue: 1500,
      },
      total: {
        ordersCount: 400,
        ordersRevenue: 600000,
        fboShare: 70,
        fbsShare: 30,
      },
    },
    period: { from: '2026-02-03', to: '2026-02-09' },
    ...overrides,
  }
}

// =============================================================================
// Operational Expenses (Request #143)
// =============================================================================

/**
 * Operational expense item
 * Matches backend-gap-analysis.md Section 3, Request #143
 */
export interface OperationalExpense {
  id: string
  category: 'rent' | 'salary' | 'packaging' | 'transport' | 'other'
  amount: number
  month: string
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * Factory for operational expenses list
 */
export function createOperationalExpensesMock(
  overrides: Partial<OperationalExpense>[] = []
): OperationalExpense[] {
  const defaults: OperationalExpense[] = [
    {
      id: 'exp-001',
      category: 'rent',
      amount: 50000,
      month: '2026-02',
      description: 'Аренда склада',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'exp-002',
      category: 'salary',
      amount: 80000,
      month: '2026-02',
      description: 'Зарплата сотрудников',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'exp-003',
      category: 'packaging',
      amount: 15000,
      month: '2026-02',
      description: 'Упаковочные материалы',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
  ]

  if (overrides.length > 0) {
    return overrides.map((o, i) => ({ ...defaults[i % defaults.length], ...o }))
  }
  return defaults
}

// =============================================================================
// Advertising Analytics (existing endpoint, used for tax calc)
// =============================================================================

/**
 * Factory for advertising analytics summary
 * Used for tax calculation in Story 65.11 (advertising_spend)
 */
export interface AdvertisingAnalyticsSummary {
  total_spend: number
  overall_roas: number
  total_sales: number
}

export function createAdvertisingAnalyticsMock(
  overrides: Partial<AdvertisingAnalyticsSummary> = {}
): AdvertisingAnalyticsSummary {
  return {
    total_spend: 3728,
    overall_roas: 2.5,
    total_sales: 9320,
    ...overrides,
  }
}

// =============================================================================
// Error Response Helpers
// =============================================================================

/**
 * Creates a mock API error for testing error states
 */
export function createApiErrorMock(
  status: number,
  message: string
): { status: number; message: string } {
  return { status, message }
}

/**
 * Creates a network error
 */
export function createNetworkError(): Error {
  return new Error('Network error occurred')
}

/**
 * Creates a 404 Not Found error
 */
export function create404Error(): Error {
  const error = new Error('Not Found')
  ;(error as Error & { status: number }).status = 404
  return error
}

/**
 * Creates a 500 Internal Server Error
 */
export function create500Error(): Error {
  const error = new Error('Internal Server Error')
  ;(error as Error & { status: number }).status = 500
  return error
}
