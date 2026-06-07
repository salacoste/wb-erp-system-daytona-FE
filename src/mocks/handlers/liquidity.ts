/**
 * MSW Handlers for Liquidity Analysis API
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Story 7.1: API Integration
 *
 * Mock handlers for testing liquidity hooks and components
 */

import { http, HttpResponse, delay } from 'msw'
import type {
  LiquidityResponse,
  LiquidityItem,
  LiquiditySummary,
  LiquidityDistribution,
  LiquidityBenchmarks,
  LiquidityCategory,
  LiquidationScenario,
  LiquidityTrendsResponse,
  TrendDataPoint,
  TrendInsight,
} from '@/types/liquidity'
import { mapLiquidationScenarios } from '@/lib/api/liquidity-item-mapper'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Determine liquidity category based on turnover days
 */
function getLiquidityCategoryFromDays(days: number): LiquidityCategory {
  if (days <= 30) return 'highly_liquid'
  if (days <= 60) return 'medium'
  if (days <= 90) return 'low'
  return 'illiquid'
}

/**
 * Generate liquidation scenarios for illiquid items.
 *
 * Emits the LIVE backend OBJECT shape — {full_price, discount_20pct, discount_50pct}
 * keyed objects of {discountPct (fraction), recovery (RUB), daysToClear} — then routes
 * it through the production mapper (mapLiquidationScenarios' OBJECT branch) so the fixture
 * exercises the real code path the live backend drives, not the stale rich-array shape.
 * recovery mirrors backend liquidation-calculator: full = stock*cost, 20% = *0.8, 50% = *0.5.
 * Backend omits new_price/expected_profit/is_profitable/velocity → mapper yields null → FE "—".
 */
function generateLiquidationScenarios(
  cogsPerUnit: number,
  currentStock: number,
  velocityPerDay: number
): LiquidationScenario[] | null {
  // daysToClear from velocity; 999 (∞ sentinel) when item has no movement.
  const daysToClear = velocityPerDay > 0 ? Math.round(currentStock / velocityPerDay) : 999
  const baseRecovery = currentStock * cogsPerUnit

  const backendShape = {
    full_price: { discountPct: 0, recovery: Math.round(baseRecovery), daysToClear },
    discount_20pct: { discountPct: 0.2, recovery: Math.round(baseRecovery * 0.8), daysToClear },
    discount_50pct: { discountPct: 0.5, recovery: Math.round(baseRecovery * 0.5), daysToClear },
  }

  return mapLiquidationScenarios(backendShape)
}

/**
 * Generate a mock liquidity item
 */
export function generateMockLiquidityItem(overrides: Partial<LiquidityItem> = {}): LiquidityItem {
  const turnoverDays = overrides.turnover_days ?? 45
  const category = getLiquidityCategoryFromDays(turnoverDays)
  const currentPrice = overrides.current_price ?? 1000
  const cogsPerUnit = overrides.cogs_per_unit ?? 450
  const currentStock = overrides.current_stock_qty ?? 120
  const velocityPerDay = overrides.velocity_per_day ?? 5.5

  const item: LiquidityItem = {
    sku_id: overrides.sku_id ?? `SKU-${Math.random().toString(36).substr(2, 9)}`,
    product_name: overrides.product_name ?? 'Тестовый товар',
    category: overrides.category ?? 'Электроника',
    brand: overrides.brand ?? 'Test Brand',
    current_stock_qty: currentStock,
    avg_stock_qty_30d: overrides.avg_stock_qty_30d ?? currentStock * 0.9,
    stock_value: overrides.stock_value ?? currentStock * cogsPerUnit,
    units_sold_30d: overrides.units_sold_30d ?? Math.round(velocityPerDay * 30),
    velocity_per_day: velocityPerDay,
    turnover_days: turnoverDays,
    liquidity_category: overrides.liquidity_category ?? category,
    current_price: currentPrice,
    cogs_per_unit: cogsPerUnit,
    recommendation: overrides.recommendation ?? getRecommendation(category),
    action_type: overrides.action_type ?? getActionType(category),
    liquidation_scenarios:
      category === 'illiquid'
        ? generateLiquidationScenarios(cogsPerUnit, currentStock, velocityPerDay)
        : null,
  }

  return item
}

function getRecommendation(category: LiquidityCategory): string {
  switch (category) {
    case 'highly_liquid':
      return 'Масштабируйте — инвестируйте больше'
    case 'medium':
      return 'Поддерживайте текущий уровень'
    case 'low':
      return 'Рассмотрите сокращение закупок'
    case 'illiquid':
      return 'Рекомендуется ликвидация со скидкой'
  }
}

function getActionType(category: LiquidityCategory): LiquidityItem['action_type'] {
  switch (category) {
    case 'highly_liquid':
      return 'MAXIMIZE'
    case 'medium':
      return 'MAINTAIN'
    case 'low':
      return 'REDUCE'
    case 'illiquid':
      return 'LIQUIDATE'
  }
}

/**
 * Generate mock distribution
 */
export function generateMockDistribution(items: LiquidityItem[]): LiquidityDistribution {
  const calcDistItem = (category: LiquidityCategory) => {
    const categoryItems = items.filter(i => i.liquidity_category === category)
    const totalValue = items.reduce((sum, i) => sum + (i.stock_value ?? 0), 0)
    const categoryValue = categoryItems.reduce((sum, i) => sum + (i.stock_value ?? 0), 0)
    const avgTurnover =
      categoryItems.length > 0
        ? categoryItems.reduce((sum, i) => sum + i.turnover_days, 0) / categoryItems.length
        : 0

    return {
      count: categoryItems.length,
      value: categoryValue,
      pct: totalValue > 0 ? (categoryValue / totalValue) * 100 : 0,
      avg_turnover_days: Math.round(avgTurnover),
      no_sales_count: categoryItems.filter(i => i.turnover_days >= 999).length,
    }
  }

  return {
    highly_liquid: calcDistItem('highly_liquid'),
    medium: calcDistItem('medium'),
    low: calcDistItem('low'),
    illiquid: calcDistItem('illiquid'),
  }
}

/**
 * Generate mock benchmarks
 */
export function generateMockBenchmarks(
  distribution: LiquidityDistribution,
  avgTurnover: number
): LiquidityBenchmarks {
  const illiquidPct = distribution.illiquid.pct
  const highlyLiquidPct = distribution.highly_liquid.pct

  let overallStatus: LiquidityBenchmarks['overall_status']
  if (highlyLiquidPct >= 50 && illiquidPct <= 5) {
    overallStatus = 'excellent'
  } else if (highlyLiquidPct >= 40 && illiquidPct <= 10) {
    overallStatus = 'good'
  } else if (illiquidPct <= 15) {
    overallStatus = 'warning'
  } else {
    overallStatus = 'critical'
  }

  return {
    your_avg_turnover: avgTurnover,
    target_avg_turnover: 45,
    industry_avg_turnover: 52,
    highly_liquid_pct: highlyLiquidPct,
    target_highly_liquid_pct: 50,
    illiquid_pct: illiquidPct,
    target_illiquid_pct: 5,
    overall_status: overallStatus,
  }
}

/**
 * Generate mock liquidity summary
 */
export function generateMockLiquiditySummary(items: LiquidityItem[]): LiquiditySummary {
  const totalValue = items.reduce((sum, i) => sum + (i.stock_value ?? 0), 0)
  const avgTurnover =
    items.length > 0 ? items.reduce((sum, i) => sum + i.turnover_days, 0) / items.length : 0
  const distribution = generateMockDistribution(items)
  const frozenCapital = distribution.illiquid.value

  return {
    total_inventory_value: totalValue,
    total_sku_count: items.length,
    frozen_capital: frozenCapital,
    frozen_capital_pct: totalValue > 0 ? (frozenCapital / totalValue) * 100 : 0,
    avg_turnover_days: Math.round(avgTurnover),
    distribution,
    benchmarks: generateMockBenchmarks(distribution, avgTurnover),
  }
}

/**
 * Generate mock trend data
 */
export function generateMockTrends(period: number = 90): TrendDataPoint[] {
  const trends: TrendDataPoint[] = []
  const today = new Date()

  for (let i = period; i >= 0; i -= 7) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Simulate improvement over time
    const progress = (period - i) / period
    const highlyLiquidPct = 50 + progress * 15
    const illiquidPct = 10 - progress * 7

    trends.push({
      date: date.toISOString().split('T')[0],
      distribution: {
        highly_liquid_pct: highlyLiquidPct,
        medium_pct: 25 - progress * 3,
        low_pct: 15 - progress * 5,
        illiquid_pct: Math.max(2, illiquidPct),
      },
      frozen_capital: 100000 - progress * 70000,
      avg_turnover_days: 52 - progress * 14,
    })
  }

  return trends
}

/**
 * Generate mock insights
 */
export function generateMockInsights(): TrendInsight[] {
  return [
    {
      type: 'improvement',
      message: 'Доля неликвида снизилась с 10% до 2.7% (отличный прогресс!)',
    },
    {
      type: 'improvement',
      message: 'Доля высоколиквидных товаров выросла с 50% до 65.2%',
    },
    {
      type: 'info',
      message: 'Средний оборот улучшился с 52 до 38 дней',
    },
  ]
}

// ============================================================================
// Default Mock Data
// ============================================================================

const defaultItems: LiquidityItem[] = [
  generateMockLiquidityItem({
    sku_id: '12345',
    product_name: 'Widget Pro',
    brand: 'BrandY',
    category: 'Электроника',
    turnover_days: 22,
    current_stock_qty: 120,
    velocity_per_day: 5.5,
    current_price: 1000,
    cogs_per_unit: 450,
  }),
  generateMockLiquidityItem({
    sku_id: '22222',
    product_name: 'Device Old',
    brand: 'BrandX',
    category: 'Электроника',
    turnover_days: 145,
    current_stock_qty: 60,
    velocity_per_day: 0.4,
    current_price: 900,
    cogs_per_unit: 300,
  }),
  generateMockLiquidityItem({
    sku_id: '33333',
    product_name: 'Gadget New',
    brand: 'BrandZ',
    category: 'Гаджеты',
    turnover_days: 18,
    current_stock_qty: 200,
    velocity_per_day: 11,
  }),
  generateMockLiquidityItem({
    sku_id: '44444',
    product_name: 'Accessory Basic',
    brand: 'BrandA',
    category: 'Аксессуары',
    turnover_days: 45,
    current_stock_qty: 80,
    velocity_per_day: 1.8,
  }),
  generateMockLiquidityItem({
    sku_id: '55555',
    product_name: 'Tool Standard',
    brand: 'BrandB',
    category: 'Инструменты',
    turnover_days: 75,
    current_stock_qty: 40,
    velocity_per_day: 0.5,
  }),
]

// ============================================================================
// MSW Handlers
// ============================================================================

export const liquidityHandlers = [
  // GET /v1/analytics/liquidity
  http.get(`${API_BASE_URL}/v1/analytics/liquidity`, async ({ request }) => {
    await delay(100)

    const url = new URL(request.url)
    const categoryFilter = url.searchParams.get('category_filter')
    const sortBy = url.searchParams.get('sort_by') || 'turnover_days'
    const sortOrder = url.searchParams.get('sort_order') || 'desc'
    const limit = parseInt(url.searchParams.get('limit') || '100', 10)

    // Handle special test cases (like supply-planning)
    if (categoryFilter === 'error') {
      return HttpResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        },
        { status: 500 }
      )
    }

    if (categoryFilter === 'empty') {
      const emptyResponse: LiquidityResponse = {
        meta: {
          cabinet_id: 'test-cabinet-uuid',
          analysis_period_days: 30,
          generated_at: new Date().toISOString(),
          stock_data_updated_at: new Date().toISOString(),
        },
        summary: generateMockLiquiditySummary([]),
        data: [],
      }
      // No { data: ... } wrapper — API module uses skipDataUnwrap: true
      return HttpResponse.json(emptyResponse)
    }

    let items = [...defaultItems]

    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      items = items.filter(i => i.liquidity_category === categoryFilter)
    }

    // Apply sorting. sort_by is a backend LiquiditySortByEnum value, whose names differ from the
    // FE LiquidityItem field names — map before indexing (else frozen_capital/current_stock index
    // undefined → NaN sort). Mirrors the real backend's field semantics.
    const SORT_FIELD_MAP: Record<string, keyof LiquidityItem> = {
      frozen_capital: 'stock_value',
      turnover_days: 'turnover_days',
      current_stock: 'current_stock_qty',
      product_name: 'product_name',
    }
    const sortKey = SORT_FIELD_MAP[sortBy] ?? 'turnover_days'
    items.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' || typeof bv === 'string') {
        const cmp = String(av).localeCompare(String(bv))
        return sortOrder === 'asc' ? cmp : -cmp
      }
      const an = typeof av === 'number' ? av : 0
      const bn = typeof bv === 'number' ? bv : 0
      return sortOrder === 'asc' ? an - bn : bn - an
    })

    // Apply limit
    items = items.slice(0, limit)

    const response: LiquidityResponse = {
      meta: {
        cabinet_id: 'test-cabinet-uuid',
        analysis_period_days: 30,
        generated_at: new Date().toISOString(),
        stock_data_updated_at: new Date().toISOString(),
      },
      summary: generateMockLiquiditySummary(defaultItems),
      data: items,
    }

    // No { data: ... } wrapper — API module uses skipDataUnwrap: true
    return HttpResponse.json(response)
  }),

  // GET /v1/analytics/liquidity/trends
  http.get(`${API_BASE_URL}/v1/analytics/liquidity/trends`, async ({ request }) => {
    await delay(100)

    const url = new URL(request.url)
    const period = parseInt(url.searchParams.get('period') || '90', 10)

    const response: LiquidityTrendsResponse = {
      meta: {
        cabinet_id: 'test-cabinet-uuid',
        period_days: period,
        generated_at: new Date().toISOString(),
      },
      trends: generateMockTrends(period),
      insights: generateMockInsights(),
    }

    // No { data: ... } wrapper — API module uses skipDataUnwrap: true
    return HttpResponse.json(response)
  }),
]

// ============================================================================
// Error Handlers (for testing error states)
// ============================================================================

export const liquidityErrorHandlers = {
  notFound: http.get(`${API_BASE_URL}/v1/analytics/liquidity`, async () => {
    await delay(100)
    return HttpResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'No inventory data available',
        },
      },
      { status: 404 }
    )
  }),

  serverError: http.get(`${API_BASE_URL}/v1/analytics/liquidity`, async () => {
    await delay(100)
    return HttpResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }),

  unauthorized: http.get(`${API_BASE_URL}/v1/analytics/liquidity`, async () => {
    await delay(100)
    return HttpResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    )
  }),
}
