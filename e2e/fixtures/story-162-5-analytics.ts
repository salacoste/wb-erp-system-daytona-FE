import type { Page, Route } from '@playwright/test'
import type {
  LiquidityCategory,
  LiquidityItem,
  LiquidityResponse,
  LiquidityTrendsResponse,
  TrendDataPoint,
} from '../../src/types/liquidity'
import type {
  UnitEconomicsItem,
  UnitEconomicsResponse,
  UnitEconomicsViewBy,
} from '../../src/types/unit-economics'

const FIXED_TIMESTAMP = '2026-08-04T12:00:00.000Z'
const COST_CATEGORY_ORDER = [
  'cogs',
  'commission',
  'logistics_delivery',
  'logistics_return',
  'storage',
  'delivery_to_warehouse',
  'paid_acceptance',
  'penalties',
  'other_deductions',
  'advertising',
]

type AnalyticsMode = 'data' | 'empty' | 'error' | 'retry' | 'deferred' | 'malformed'

interface Story1625RouteOptions {
  liquidity?: AnalyticsMode
  unitEconomics?: AnalyticsMode
  /** Story 165.4-FE: trends section mode (default 'data'). */
  liquidityTrends?: AnalyticsMode
}

interface DeferredRelease {
  promise: Promise<void>
  release: () => void
}

export interface Story1625AnalyticsController {
  allowLiquidityRetrySuccess: () => void
  allowUnitEconomicsRetrySuccess: () => void
  releaseLiquidity: () => void
  releaseUnitEconomics: () => void
  assertNoUnexpectedRequests: () => void
  rejectedRequests: () => readonly string[]
}

function createDeferredRelease(): DeferredRelease {
  let resolvePromise: (() => void) | undefined
  let released = false
  const promise = new Promise<void>(resolve => {
    resolvePromise = resolve
  })

  return {
    promise,
    release() {
      if (released) return
      released = true
      resolvePromise?.()
    },
  }
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

function liquidityItem(index: number, category: LiquidityCategory, marker: string): LiquidityItem {
  const turnoverByCategory: Record<LiquidityCategory, number> = {
    highly_liquid: 14,
    medium: 44,
    low: 76,
    illiquid: 140,
  }
  const turnoverDays = turnoverByCategory[category] + index
  const currentStock = 18 + index * 7
  const cogs = 90 + index * 15
  const hasLiquidation = category === 'illiquid'
  const skuId = `LQ-${String(index + 1).padStart(3, '0')}`

  return {
    sku_id: skuId,
    product_name: `${skuId} · ${marker} · товар ${String(index + 1).padStart(2, '0')}`,
    category: `Категория ${index + 1}`,
    brand: 'Story 162.5',
    current_stock_qty: currentStock,
    avg_stock_qty_30d: currentStock + 4,
    stock_value: currentStock * cogs,
    units_sold_30d: Math.max(1, 48 - index * 3),
    velocity_per_day: Math.max(0.1, 4.8 - index * 0.3),
    turnover_days: turnoverDays,
    liquidity_category: category,
    current_price: 800 + index * 50,
    cogs_per_unit: cogs,
    recommendation: hasLiquidation
      ? 'Неликвид. Рекомендуется ликвидация со скидкой.'
      : 'Поддерживайте наблюдаемую скорость продаж.',
    action_type: hasLiquidation ? 'LIQUIDATE' : category === 'low' ? 'REDUCE' : 'MAINTAIN',
    liquidation_scenarios: hasLiquidation
      ? [
          {
            target_days: 30,
            required_velocity: 2,
            velocity_multiplier: 3,
            suggested_discount_pct: 20,
            new_price: 720,
            expected_revenue: 12_960,
            expected_profit: 7_560,
            is_profitable: true,
          },
          {
            target_days: 14,
            required_velocity: 4,
            velocity_multiplier: 6,
            suggested_discount_pct: 50,
            new_price: 450,
            expected_revenue: 8_100,
            expected_profit: 2_700,
            is_profitable: true,
          },
        ]
      : null,
  }
}

const LIQUIDITY_CATEGORIES: LiquidityCategory[] = [
  'highly_liquid',
  'medium',
  'low',
  'illiquid',
  'highly_liquid',
  'medium',
  'low',
  'illiquid',
]

function buildLiquidityResponse(url: URL, empty: boolean): Readonly<LiquidityResponse> {
  const category = url.searchParams.get('category_filter') as LiquidityCategory | null
  const sortBy = url.searchParams.get('sort_by') ?? 'turnover_days'
  const sortOrder = url.searchParams.get('sort_order') ?? 'desc'
  const marker = `LQ ${category ?? 'all'} ${sortBy} ${sortOrder}`
  const allItems = LIQUIDITY_CATEGORIES.map((itemCategory, index) =>
    liquidityItem(index, itemCategory, marker)
  )
  const filteredItems = category
    ? allItems.filter(item => item.liquidity_category === category)
    : allItems
  const fieldBySort: Record<string, keyof LiquidityItem> = {
    frozen_capital: 'stock_value',
    turnover_days: 'turnover_days',
    current_stock: 'current_stock_qty',
    product_name: 'product_name',
  }
  const field = fieldBySort[sortBy] ?? 'turnover_days'
  const sortedItems = [...filteredItems].sort((left, right) => {
    const leftValue = left[field] ?? 0
    const rightValue = right[field] ?? 0
    const result = String(leftValue).localeCompare(String(rightValue), 'ru', { numeric: true })
    return sortOrder === 'asc' ? result : -result
  })
  const data = empty ? [] : sortedItems

  return deepFreeze({
    meta: {
      cabinet_id: `story-162-5-${category ?? 'all'}-${sortBy}-${sortOrder}`,
      analysis_period_days: 30,
      generated_at: FIXED_TIMESTAMP,
      stock_data_updated_at: FIXED_TIMESTAMP,
    },
    summary: {
      total_inventory_value: empty ? 0 : 109_500,
      total_sku_count: empty ? 0 : data.length,
      frozen_capital: empty ? 0 : 41_000,
      frozen_capital_pct: empty ? 0 : 37.44,
      avg_turnover_days: empty ? 0 : 69,
      distribution: {
        highly_liquid: {
          count: 2,
          value: 18_000,
          pct: 16.44,
          avg_turnover_days: 16,
          no_sales_count: 0,
        },
        medium: { count: 2, value: 22_000, pct: 20.09, avg_turnover_days: 46, no_sales_count: 0 },
        low: { count: 2, value: 28_500, pct: 26.03, avg_turnover_days: 78, no_sales_count: 0 },
        illiquid: {
          count: 2,
          value: 41_000,
          pct: 37.44,
          avg_turnover_days: 142,
          no_sales_count: 0,
        },
      },
      benchmarks: {
        your_avg_turnover: 69,
        target_avg_turnover: 45,
        industry_avg_turnover: 58,
        highly_liquid_pct: 16.44,
        target_highly_liquid_pct: 35,
        illiquid_pct: 37.44,
        target_illiquid_pct: 10,
        overall_status: 'warning',
      },
    },
    data,
  })
}

/**
 * Story 165.4-FE: build a deterministic liquidity trends response.
 * Returns `period` daily points ending today. The first 4 days are zero days
 * (frozen_capital=0) to exercise the gaps rendering (AC2 — zeros preserved).
 */
function buildLiquidityTrendsResponse(
  url: URL,
  mode: AnalyticsMode
): Readonly<LiquidityTrendsResponse> | Readonly<{ unexpected: true }> {
  const period = parseInt(url.searchParams.get('period') || '90', 10)

  if (mode === 'malformed') {
    // Missing required meta/trends fields. With the Story 165.4-FE B2 boundary
    // guard, getLiquidityTrends THROWS on this body (no `meta` / non-array
    // `trends`) -> TanStack isError -> the section's canonical error/retry
    // branch. (The normalizer no longer masks this into an empty response.)
    return deepFreeze({ unexpected: true } as const)
  }

  if (mode === 'empty') {
    return deepFreeze<LiquidityTrendsResponse>({
      meta: { cabinet_id: 'story-165-4-empty', period_days: period, generated_at: FIXED_TIMESTAMP },
      trends: [],
      insights: [{ type: 'info', message: 'Недостаточно данных для анализа динамики' }],
    })
  }

  const today = new Date(FIXED_TIMESTAMP)
  const points: TrendDataPoint[] = []
  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    // First 4 days (i = period-1..period-4) are zero days.
    const isZeroDay = i >= period - 4
    points.push({
      date: date.toISOString().split('T')[0],
      distribution: isZeroDay
        ? { highly_liquid_pct: 0, medium_pct: 0, low_pct: 0, illiquid_pct: 0 }
        : { highly_liquid_pct: 60, medium_pct: 25, low_pct: 10, illiquid_pct: 5 },
      frozen_capital: isZeroDay ? 0 : 500_000,
      avg_turnover_days: isZeroDay ? 0 : 40,
    })
  }

  return deepFreeze<LiquidityTrendsResponse>({
    meta: { cabinet_id: 'story-165-4-trends', period_days: period, generated_at: FIXED_TIMESTAMP },
    trends: points,
    insights: [{ type: 'improvement', message: 'Динамика стабильна' }],
  })
}

function unitEconomicsItem(index: number, marker: string): UnitEconomicsItem {
  const revenue = 10_000 + index * 1_000
  const cogsPct = index === 0 ? 125 : 28 + (index % 9)
  const commission = 13 + (index % 3)
  const logisticsDelivery = 6 + (index % 4)
  const logisticsReturn = 1 + (index % 2)
  const storage = 1 + (index % 3) * 0.5
  const paidAcceptance = 0.8
  const penalties = index % 5 === 0 ? 1.2 : 0.2
  const otherDeductions = 0.5
  const totalCosts =
    cogsPct +
    commission +
    logisticsDelivery +
    logisticsReturn +
    storage +
    paidAcceptance +
    penalties +
    otherDeductions
  const netMargin = 100 - totalCosts
  const toRub = (pct: number) => Math.round((revenue * pct) / 100)

  return {
    sku_id: String(700_001 + index),
    product_name: `${marker} · SKU ${String(index + 1).padStart(2, '0')}`,
    category: `Категория ${index % 4}`,
    brand: `Бренд ${index % 3}`,
    revenue,
    units_sold: 10 + index,
    costs_pct: {
      cogs: cogsPct,
      commission,
      logistics_delivery: logisticsDelivery,
      logistics_return: logisticsReturn,
      storage,
      paid_acceptance: paidAcceptance,
      penalties,
      other_deductions: otherDeductions,
      advertising: 0,
      delivery_to_warehouse: null,
    },
    costs_rub: {
      cogs: toRub(cogsPct),
      commission: toRub(commission),
      logistics_delivery: toRub(logisticsDelivery),
      logistics_return: toRub(logisticsReturn),
      storage: toRub(storage),
      paid_acceptance: toRub(paidAcceptance),
      penalties: toRub(penalties),
      other_deductions: toRub(otherDeductions),
      advertising: 0,
      delivery_to_warehouse: null,
    },
    total_costs_pct: totalCosts,
    net_margin_pct: netMargin,
    net_profit: Math.round((revenue * netMargin) / 100),
    profitability_status:
      netMargin < 0
        ? 'loss'
        : netMargin < 5
          ? 'critical'
          : netMargin < 15
            ? 'warning'
            : netMargin < 25
              ? 'good'
              : 'excellent',
    insights: index === 0 ? ['COGS превышает выручку'] : [],
    has_cogs: true,
  }
}

function buildUnitEconomicsResponse(url: URL, empty: boolean): Readonly<UnitEconomicsResponse> {
  const week = url.searchParams.get('week') ?? 'unknown-week'
  const viewBy = (url.searchParams.get('view_by') ?? 'sku') as UnitEconomicsViewBy
  const sortBy = url.searchParams.get('sort_by') ?? 'revenue'
  const sortOrder = url.searchParams.get('sort_order') ?? 'desc'
  const countByView: Record<UnitEconomicsViewBy, number> = {
    sku: 52,
    category: 4,
    brand: 3,
    total: 1,
  }
  const marker = `UE ${week} ${viewBy} ${sortBy} ${sortOrder}`
  const items = Array.from({ length: countByView[viewBy] }, (_, index) =>
    unitEconomicsItem(index, marker)
  )
  const field = sortBy === 'net_margin_pct' ? 'net_margin_pct' : 'revenue'
  const sorted = [...items].sort((left, right) => {
    const leftValue = left[field] ?? Number.NEGATIVE_INFINITY
    const rightValue = right[field] ?? Number.NEGATIVE_INFINITY
    return sortOrder === 'asc' ? leftValue - rightValue : rightValue - leftValue
  })
  const data = empty ? [] : sorted
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const totalNetProfit = data.reduce((sum, item) => sum + item.net_profit, 0)

  return deepFreeze({
    meta: {
      week,
      cabinet_id: `story-162-5-${week}-${viewBy}-${sortBy}-${sortOrder}`,
      view_by: viewBy,
      generated_at: FIXED_TIMESTAMP,
      cost_category_order: COST_CATEGORY_ORDER,
    },
    summary: {
      total_revenue: totalRevenue,
      total_net_profit: totalNetProfit,
      total_your_price: totalRevenue + 20_000,
      avg_cogs_pct: empty ? null : 34,
      avg_wb_fees_pct: empty ? 0 : 24,
      avg_net_margin_pct: empty ? null : 30,
      sku_count: data.length,
      profitable_sku_count: data.filter(item => (item.net_margin_pct ?? 0) >= 0).length,
      loss_making_sku_count: data.filter(item => (item.net_margin_pct ?? 0) < 0).length,
      missing_cogs_count: 0,
    },
    data,
  })
}

function buildFcuResponse(week: string) {
  return deepFreeze({
    data: Array.from({ length: 52 }, (_, index) => ({
      nmId: 700_001 + index,
      productName: `FCU ${week} SKU ${index + 1}`,
      latestPcu: 100 + index,
      latestDcu: index === 51 ? null : 5 + index,
      latestFcu: index === 51 ? null : 105 + index * 2,
      shipmentId: `shipment-${String(index + 1).padStart(2, '0')}`,
      shipmentName: `Поставка ${index + 1}`,
      confirmedAt: FIXED_TIMESTAMP,
    })),
  })
}

function validateExactQuery(
  route: Route,
  expectedPath: string,
  required: Record<string, RegExp>,
  optional: Record<string, RegExp> = {}
): URL {
  const request = route.request()
  const url = new URL(request.url())
  if (url.pathname !== expectedPath) {
    throw new Error(`Story 162.5 fixture rejected pathname ${url.pathname}`)
  }
  if (request.method() !== 'GET') {
    throw new Error(`Story 162.5 fixture rejected ${request.method()} ${url.pathname}`)
  }

  const allowed = new Set([...Object.keys(required), ...Object.keys(optional)])
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key)) throw new Error(`Story 162.5 fixture rejected query key ${key}`)
  }
  for (const [key, matcher] of Object.entries(required)) {
    const value = url.searchParams.get(key)
    if (value === null || !matcher.test(value)) {
      throw new Error(`Story 162.5 fixture rejected ${key}=${String(value)}`)
    }
  }
  for (const [key, matcher] of Object.entries(optional)) {
    const value = url.searchParams.get(key)
    if (value !== null && !matcher.test(value)) {
      throw new Error(`Story 162.5 fixture rejected ${key}=${value}`)
    }
  }
  return url
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

export async function installStory1625AnalyticsRoutes(
  page: Page,
  options: Story1625RouteOptions = {}
): Promise<Story1625AnalyticsController> {
  const liquidityMode = options.liquidity ?? 'data'
  const unitEconomicsMode = options.unitEconomics ?? 'data'
  const liquidityTrendsMode = options.liquidityTrends ?? 'data'
  const liquidityDeferred = createDeferredRelease()
  const unitEconomicsDeferred = createDeferredRelease()
  let liquidityRetrySuccess = false
  let unitEconomicsRetrySuccess = false
  const unexpectedRequests: string[] = []

  const guarded = (handler: (route: Route) => Promise<void>) => async (route: Route) => {
    try {
      await handler(route)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      unexpectedRequests.push(message)
      await fulfillJson(route, { error: { code: 'STORY_162_5_REJECTED', message } }, 400).catch(
        () => undefined
      )
    }
  }

  // Story 165.4-FE: liquidity TRENDS route. The main route below explicitly
  // excludes this pathname because Playwright evaluates matching page.route
  // handlers in reverse registration order. This keeps the two contracts
  // fail-closed without allowing the broad list guard to shadow trends.
  await page.route(
    /\/v1\/analytics\/liquidity\/trends(?:\?.*)?$/,
    guarded(async route => {
      const url = validateExactQuery(
        route,
        '/v1/analytics/liquidity/trends',
        {},
        {
          period: /^(30|60|90)$/,
        }
      )
      if (liquidityTrendsMode === 'error') {
        await fulfillJson(
          route,
          { error: { code: 'STORY_165_4', message: 'Liquidity trends fixture error' } },
          500
        )
        return
      }
      await fulfillJson(route, buildLiquidityTrendsResponse(url, liquidityTrendsMode))
    })
  )

  await page.route(
    /\/v1\/analytics\/liquidity(?!\/trends(?:\?|$))(?:\/[^?]*)?(?:\?.*)?$/,
    guarded(async route => {
      const url = validateExactQuery(
        route,
        '/v1/analytics/liquidity',
        {
          sort_by: /^(frozen_capital|turnover_days|current_stock|product_name)$/,
          sort_order: /^(asc|desc)$/,
          limit: /^200$/,
        },
        { category_filter: /^(highly_liquid|medium|low|illiquid)$/ }
      )
      if (liquidityMode === 'deferred') await liquidityDeferred.promise
      if (liquidityMode === 'error' || (liquidityMode === 'retry' && !liquidityRetrySuccess)) {
        await fulfillJson(
          route,
          { error: { code: 'STORY_162_5', message: 'Liquidity fixture error' } },
          500
        )
        return
      }
      await fulfillJson(route, buildLiquidityResponse(url, liquidityMode === 'empty'))
    })
  )

  await page.route(
    /\/v1\/analytics\/unit-economics(?:\/[^?]*)?(?:\?.*)?$/,
    guarded(async route => {
      const url = validateExactQuery(route, '/v1/analytics/unit-economics', {
        week: /^\d{4}-W\d{2}$/,
        view_by: /^(sku|category|brand|total)$/,
        sort_by: /^(revenue|net_margin_pct|cogs_pct|total_costs_pct)$/,
        sort_order: /^(asc|desc)$/,
        limit: /^200$/,
      })
      if (unitEconomicsMode === 'deferred') await unitEconomicsDeferred.promise
      if (
        unitEconomicsMode === 'error' ||
        (unitEconomicsMode === 'retry' && !unitEconomicsRetrySuccess)
      ) {
        await fulfillJson(
          route,
          { error: { code: 'STORY_162_5', message: 'Unit Economics fixture error' } },
          500
        )
        return
      }
      await fulfillJson(route, buildUnitEconomicsResponse(url, unitEconomicsMode === 'empty'))
    })
  )

  await page.route(
    /\/v1\/shipment-cost\/by-sku(?:\/[^?]*)?(?:\?.*)?$/,
    guarded(async route => {
      const url = validateExactQuery(route, '/v1/shipment-cost/by-sku', {
        week: /^\d{4}-W\d{2}$/,
      })
      await fulfillJson(route, buildFcuResponse(url.searchParams.get('week')!))
    })
  )

  return {
    allowLiquidityRetrySuccess() {
      liquidityRetrySuccess = true
    },
    allowUnitEconomicsRetrySuccess() {
      unitEconomicsRetrySuccess = true
    },
    releaseLiquidity: liquidityDeferred.release,
    releaseUnitEconomics: unitEconomicsDeferred.release,
    assertNoUnexpectedRequests() {
      if (unexpectedRequests.length > 0) throw new Error(unexpectedRequests.join('\n'))
    },
    rejectedRequests: () => [...unexpectedRequests],
  }
}
