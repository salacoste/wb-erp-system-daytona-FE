/**
 * MSW Handlers for Supply Planning API
 * Epic 6 - Supply Planning & Stockout Prevention
 * Story 6.1: API Integration - AC 6, 7, 8
 *
 * Mock handlers for testing supply planning hooks and components
 */

import { http, HttpResponse, delay } from 'msw'
import type {
  SupplyPlanningResponse,
  SupplyPlanningItem,
  SupplyPlanningSummary,
  StockoutRisk,
} from '@/types/supply-planning'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate a mock supply planning item
 * Updated to match SupplyPlanningItem type (Epic 28)
 */
export function generateMockSupplyPlanningItem(
  overrides: Partial<SupplyPlanningItem> = {},
): SupplyPlanningItem {
  const daysUntilStockout = overrides.days_until_stockout ?? 15
  const stockoutRisk = getStockoutRiskFromDays(daysUntilStockout ?? 15)
  const avgDailySales = overrides.avg_daily_sales ?? 10
  const currentStock = overrides.current_stock ?? 150
  const inTransit = overrides.in_transit ?? 0

  return {
    sku_id: overrides.sku_id ?? `SKU-${Math.random().toString(36).substr(2, 9)}`,
    product_name: overrides.product_name ?? 'Тестовый товар',
    brand: overrides.brand ?? 'Test Brand',
    category: overrides.category ?? 'Test Category',
    current_stock: currentStock,
    in_transit: inTransit,
    effective_stock: currentStock + inTransit,
    avg_daily_sales: avgDailySales,
    velocity_trend: overrides.velocity_trend ?? 'stable',
    days_until_stockout: daysUntilStockout,
    stockout_date: overrides.stockout_date ?? '2025-12-25',
    stockout_risk: overrides.stockout_risk ?? stockoutRisk,
    safety_stock_units: overrides.safety_stock_units ?? Math.round(avgDailySales * 7),
    reorder_quantity: overrides.reorder_quantity ?? 140,
    reorder_status: overrides.reorder_status ?? 'ok',
    reorder_value: overrides.reorder_value ?? 70000,
    cogs_per_unit: overrides.cogs_per_unit ?? 500,
    has_cogs: overrides.has_cogs ?? true,
    warehouses: overrides.warehouses ?? [
      { name: 'Коледино', stock: Math.round(currentStock * 0.6) },
      { name: 'Электросталь', stock: Math.round(currentStock * 0.4) },
    ],
  }
}

/**
 * Determine stockout risk based on days until stockout
 */
function getStockoutRiskFromDays(days: number): StockoutRisk {
  if (days === 0) return 'out_of_stock'
  if (days <= 7) return 'critical'
  if (days <= 14) return 'warning'
  if (days <= 30) return 'low'
  return 'healthy'
}

/**
 * Generate mock supply planning summary based on items
 * Updated to match SupplyPlanningSummary type (Epic 28)
 */
export function generateMockSupplyPlanningSummary(
  items: SupplyPlanningItem[],
): SupplyPlanningSummary {
  return {
    total_skus: items.length,
    out_of_stock_count: items.filter((i) => i.stockout_risk === 'out_of_stock').length,
    stockout_critical: items.filter((i) => i.stockout_risk === 'critical').length,
    stockout_warning: items.filter((i) => i.stockout_risk === 'warning').length,
    stockout_low: items.filter((i) => i.stockout_risk === 'low').length,
    healthy_stock: items.filter((i) => i.stockout_risk === 'healthy').length,
    reorder_urgent: items.filter((i) => i.reorder_status === 'urgent').length,
    reorder_soon: items.filter((i) => i.reorder_status === 'soon').length,
    total_in_transit_units: items.reduce((sum, i) => sum + i.in_transit, 0),
    total_reorder_value: items.reduce((sum, i) => sum + i.reorder_value, 0),
  }
}

// ============================================================================
// Pre-generated Mock Fixtures
// ============================================================================

/**
 * Standard mock items covering different risk levels
 * Updated to match SupplyPlanningItem type (Epic 28)
 */
export const mockSupplyPlanningItems: SupplyPlanningItem[] = [
  generateMockSupplyPlanningItem({
    sku_id: 'SKU-001',
    product_name: 'Футболка мужская',
    brand: 'SportWear',
    category: 'Одежда',
    current_stock: 5,
    avg_daily_sales: 15,
    days_until_stockout: 0,
    stockout_risk: 'out_of_stock',
    reorder_quantity: 200,
    reorder_status: 'urgent',
    velocity_trend: 'growing',
  }),
  generateMockSupplyPlanningItem({
    sku_id: 'SKU-002',
    product_name: 'Джинсы женские',
    brand: 'DenimCo',
    category: 'Одежда',
    current_stock: 20,
    avg_daily_sales: 5,
    days_until_stockout: 4,
    stockout_risk: 'critical',
    reorder_quantity: 100,
    reorder_status: 'urgent',
    velocity_trend: 'stable',
  }),
  generateMockSupplyPlanningItem({
    sku_id: 'SKU-003',
    product_name: 'Кроссовки',
    brand: 'RunFast',
    category: 'Обувь',
    current_stock: 50,
    avg_daily_sales: 4,
    days_until_stockout: 12,
    stockout_risk: 'warning',
    reorder_quantity: 80,
    reorder_status: 'soon',
    velocity_trend: 'growing',
  }),
  generateMockSupplyPlanningItem({
    sku_id: 'SKU-004',
    product_name: 'Куртка зимняя',
    brand: 'WarmStyle',
    category: 'Одежда',
    current_stock: 200,
    avg_daily_sales: 8,
    days_until_stockout: 25,
    stockout_risk: 'low',
    reorder_quantity: 120,
    reorder_status: 'ok',
    velocity_trend: 'stable',
  }),
  generateMockSupplyPlanningItem({
    sku_id: 'SKU-005',
    product_name: 'Рюкзак',
    brand: 'TravelPro',
    category: 'Аксессуары',
    current_stock: 500,
    avg_daily_sales: 10,
    days_until_stockout: 50,
    stockout_risk: 'healthy',
    reorder_quantity: 0,
    reorder_status: 'ok',
    velocity_trend: 'declining',
  }),
]

/**
 * Full mock response
 * Updated to match SupplyPlanningResponse type (Epic 28)
 */
export const mockSupplyPlanningResponse: SupplyPlanningResponse = {
  meta: {
    cabinet_id: 'test-cabinet',
    velocity_weeks: 4,
    safety_stock_days: 7,
    stocks_updated_at: new Date().toISOString(),
    generated_at: new Date().toISOString(),
  },
  summary: generateMockSupplyPlanningSummary(mockSupplyPlanningItems),
  data: mockSupplyPlanningItems,
}

/**
 * Empty response fixture
 * Updated to match SupplyPlanningResponse type (Epic 28)
 */
export const mockEmptySupplyPlanningResponse: SupplyPlanningResponse = {
  meta: {
    cabinet_id: 'test-cabinet',
    velocity_weeks: 4,
    safety_stock_days: 7,
    stocks_updated_at: new Date().toISOString(),
    generated_at: new Date().toISOString(),
  },
  summary: {
    total_skus: 0,
    out_of_stock_count: 0,
    stockout_critical: 0,
    stockout_warning: 0,
    stockout_low: 0,
    healthy_stock: 0,
    reorder_urgent: 0,
    reorder_soon: 0,
    total_in_transit_units: 0,
    total_reorder_value: 0,
  },
  data: [],
}

// ============================================================================
// MSW Handlers
// ============================================================================

export const supplyPlanningHandlers = [
  /**
   * GET /v1/analytics/supply-planning
   * Returns supply planning data with filtering and sorting
   */
  http.get(`${API_BASE_URL}/v1/analytics/supply-planning`, ({ request }) => {
    const url = new URL(request.url)
    const showOnly = url.searchParams.get('show_only')
    const sortBy = url.searchParams.get('sort_by')
    const sortOrder = url.searchParams.get('sort_order') || 'asc'
    const limit = url.searchParams.get('limit')
    const week = url.searchParams.get('week')

    // Handle special test cases
    if (week === 'empty') {
      return HttpResponse.json({ data: mockEmptySupplyPlanningResponse })
    }

    if (week === 'error') {
      return HttpResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        },
        { status: 500 },
      )
    }

    // Filter items
    let filteredItems = [...mockSupplyPlanningItems]

    if (showOnly === 'stockout_risk') {
      filteredItems = filteredItems.filter((item) =>
        ['out_of_stock', 'critical', 'warning'].includes(item.stockout_risk),
      )
    } else if (showOnly === 'reorder_needed') {
      // Filter items that need reordering (urgent or soon status)
      filteredItems = filteredItems.filter(
        (item) => item.reorder_status === 'urgent' || item.reorder_status === 'soon',
      )
    }

    // Sort items
    if (sortBy) {
      filteredItems.sort((a, b) => {
        const aVal = a[sortBy as keyof SupplyPlanningItem] as number
        const bVal = b[sortBy as keyof SupplyPlanningItem] as number
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      })
    }

    // Apply limit
    if (limit) {
      filteredItems = filteredItems.slice(0, parseInt(limit, 10))
    }

    const response: SupplyPlanningResponse = {
      meta: {
        cabinet_id: 'test-cabinet',
        velocity_weeks: 4,
        safety_stock_days: 7,
        stocks_updated_at: new Date().toISOString(),
        generated_at: new Date().toISOString(),
      },
      summary: generateMockSupplyPlanningSummary(filteredItems),
      data: filteredItems,
    }

    // Wrap in { data: ... } to match apiClient response format
    return HttpResponse.json({ data: response })
  }),
]

// ============================================================================
// Additional Test Handlers
// ============================================================================

/**
 * Handler that simulates slow network response
 * Use with server.use() in specific tests
 */
export const slowSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  async () => {
    await delay(2000)
    return HttpResponse.json({ data: mockSupplyPlanningResponse })
  },
)

/**
 * Handler that simulates 401 Unauthorized
 */
export const unauthorizedSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 },
    )
  },
)

/**
 * Handler that simulates 403 Forbidden
 */
export const forbiddenSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this cabinet',
        },
      },
      { status: 403 },
    )
  },
)

/**
 * Handler that simulates 404 Not Found
 */
export const notFoundSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Cabinet not found',
        },
      },
      { status: 404 },
    )
  },
)

/**
 * Handler that simulates network error
 */
export const networkErrorSupplyPlanningHandler = http.get(
  `${API_BASE_URL}/v1/analytics/supply-planning`,
  () => {
    return HttpResponse.error()
  },
)
