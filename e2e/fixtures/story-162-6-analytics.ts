import type { Page } from '@playwright/test'
import {
  createStory1626RouteController,
  type Story1626QueryRules,
  type Story1626RouteContract,
  type Story1626RouteController,
  type Story1626RouteMode,
} from './story-162-6-route-controller'

export const STORY_162_6_ANALYTICS_PATHS = {
  ordersTrends: '/v1/analytics/orders/trends',
  ordersSeasonal: '/v1/analytics/orders/seasonal',
  ordersCompare: '/v1/analytics/orders/compare',
  weeklyBySku: '/v1/analytics/weekly/by-sku',
  weeklyByBrand: '/v1/analytics/weekly/by-brand',
  weeklyByCategory: '/v1/analytics/weekly/by-category',
  weeklyCabinetExpenses: '/v1/analytics/weekly/cabinet-expenses',
  weeklyMarginTrends: '/v1/analytics/weekly/margin-trends',
  storageBySku: '/v1/analytics/storage/by-sku',
  storageTopConsumers: '/v1/analytics/storage/top-consumers',
  storageTrends: '/v1/analytics/storage/trends',
  forecastAccuracy: '/v1/ai/forecast-accuracy',
  advertising: '/v1/analytics/advertising',
  mergedGroupSyncStatus: '/v1/analytics/advertising/sync-status',
} as const

export type Story1626AnalyticsRouteName = keyof typeof STORY_162_6_ANALYTICS_PATHS

export interface Story1626AnalyticsRouteOption {
  mode?: Story1626RouteMode
  data?: Story1626RouteContract['data']
  empty?: Story1626RouteContract['empty']
  error?: Story1626RouteContract['error']
}

export type Story1626AnalyticsRouteOptions = Partial<
  Record<Story1626AnalyticsRouteName, Story1626AnalyticsRouteOption>
>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_WEEK = /^\d{4}-W\d{2}$/
const BOOLEAN = /^(true|false)$/

const RANGE_QUERY: Story1626QueryRules = {
  optional: {
    week: ISO_WEEK,
    weekStart: ISO_WEEK,
    weekEnd: ISO_WEEK,
    include_cogs: BOOLEAN,
    include_ads: BOOLEAN,
    include_stock: BOOLEAN,
    compare_to: ISO_WEEK,
    compare_to_start: ISO_WEEK,
    compare_to_end: ISO_WEEK,
    cursor: /^.+$/,
    limit: /^\d+$/,
  },
}

function validateWeekOrRange(name: string, url: URL): void {
  const hasWeek = url.searchParams.has('week')
  const hasStart = url.searchParams.has('weekStart')
  const hasEnd = url.searchParams.has('weekEnd')
  if (hasWeek === (hasStart || hasEnd) || hasStart !== hasEnd) {
    throw new Error(`${name}: expected week or complete weekStart/weekEnd range`)
  }
}

function storagePeriod(url: URL) {
  return {
    from: url.searchParams.get('weekStart') ?? '2026-W02',
    to: url.searchParams.get('weekEnd') ?? '2026-W05',
    days_count: 28,
  }
}

function analyticsContract(name: Story1626AnalyticsRouteName): Story1626RouteContract {
  const contracts: Record<Story1626AnalyticsRouteName, Story1626RouteContract> = {
    ordersTrends: {
      name: 'analytics.ordersTrends',
      path: STORY_162_6_ANALYTICS_PATHS.ordersTrends,
      query: {
        required: { from: ISO_DATE, to: ISO_DATE },
        optional: { aggregation: /^(day|week|month)$/, metrics: /^[a-z,]+$/ },
      },
      data: (url: URL) => ({
        trends: [
          {
            date: url.searchParams.get('from'),
            ordersCount: 1626,
            revenue: 162_600,
            cancellations: 2,
            cancellationRate: 0.12,
            returns: 1,
            returnRate: 0.06,
            avgOrderValue: 100,
          },
        ],
        summary: {
          totalOrders: 1626,
          totalRevenue: 162_600,
          avgDailyOrders: 54.2,
          cancellationRate: 0.12,
          returnRate: 0.06,
        },
        dataSource: { primary: 'orders_fbs' },
        period: {
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          aggregation: url.searchParams.get('aggregation') ?? 'day',
          daysIncluded: 30,
        },
      }),
      empty: {
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
          to: '2026-01-30',
          aggregation: 'day',
          daysIncluded: 30,
        },
      },
    },
    ordersSeasonal: {
      name: 'analytics.ordersSeasonal',
      path: STORY_162_6_ANALYTICS_PATHS.ordersSeasonal,
      query: { optional: { months: /^\d+$/, view: /^(monthly|weekly|quarterly)$/ } },
      data: {
        patterns: {
          monthly: [{ month: 'Январь Story 162.6', avgOrders: 1626, avgRevenue: 162_600 }],
          weekday: [{ dayOfWeek: 'Понедельник', avgOrders: 1626 }],
          quarterly: [{ quarter: 'Q1', avgOrders: 1626, avgRevenue: 162_600 }],
        },
        insights: {
          peakMonth: 'Январь Story 162.6',
          lowMonth: 'Февраль',
          peakDayOfWeek: 'Понедельник',
          seasonalityIndex: 1.626,
        },
      },
      empty: { patterns: {}, insights: {} },
    },
    ordersCompare: {
      name: 'analytics.ordersCompare',
      path: STORY_162_6_ANALYTICS_PATHS.ordersCompare,
      query: {
        required: {
          period1_from: ISO_DATE,
          period1_to: ISO_DATE,
          period2_from: ISO_DATE,
          period2_to: ISO_DATE,
        },
      },
      data: (url: URL) => ({
        period1: {
          from: url.searchParams.get('period1_from'),
          to: url.searchParams.get('period1_to'),
          ordersCount: 1626,
          revenue: 162_600,
          cancellationRate: 0.12,
          avgOrderValue: 100,
        },
        period2: {
          from: url.searchParams.get('period2_from'),
          to: url.searchParams.get('period2_to'),
          ordersCount: 1500,
          revenue: 150_000,
          cancellationRate: 0.2,
          avgOrderValue: 100,
        },
        comparison: {
          ordersChange: 126,
          ordersChangePercent: 8.4,
          revenueChange: 12_600,
          revenueChangePercent: 8.4,
          cancellationRateChange: -0.08,
          avgOrderValueChange: 0,
          avgOrderValueChangePercent: 0,
        },
      }),
      empty: { period1: {}, period2: {}, comparison: {} },
    },
    weeklyBySku: {
      name: 'analytics.weeklyBySku',
      path: STORY_162_6_ANALYTICS_PATHS.weeklyBySku,
      query: RANGE_QUERY,
      validate: url => validateWeekOrRange('analytics.weeklyBySku', url),
      data: {
        data: [
          {
            nm_id: 162600001,
            sa_name: 'STORY-162-6-SKU',
            revenue_net: 162_600,
            total_units: 1626,
            cogs: 60_000,
            profit: 102_600,
            margin_pct: 63.1,
            operating_profit: 92_600,
            operating_margin_pct: 56.95,
            missing_cogs_flag: false,
          },
        ],
      },
      empty: { data: [] },
    },
    weeklyByBrand: {
      name: 'analytics.weeklyByBrand',
      path: STORY_162_6_ANALYTICS_PATHS.weeklyByBrand,
      query: RANGE_QUERY,
      validate: url => validateWeekOrRange('analytics.weeklyByBrand', url),
      data: {
        data: [
          {
            brand: 'Бренд Story 162.6',
            revenue_gross: 180_000,
            revenue_net: 162_600,
            total_units: 1626,
            total_skus: 1,
            cogs: 60_000,
            profit: 102_600,
            margin_pct: 63.1,
            markup_percent: 171,
            missing_cogs_count: 0,
            operating_margin_pct: 56.95,
            skus_with_expenses_only: 0,
          },
        ],
      },
      empty: { data: [] },
    },
    weeklyByCategory: {
      name: 'analytics.weeklyByCategory',
      path: STORY_162_6_ANALYTICS_PATHS.weeklyByCategory,
      query: RANGE_QUERY,
      validate: url => validateWeekOrRange('analytics.weeklyByCategory', url),
      data: {
        data: [
          {
            subject_name: 'Категория Story 162.6',
            revenue_gross_rub: '180000',
            revenue_net_rub: '162600',
            total_units: 1626,
            sku_count: 1,
            cogs_rub: '60000',
            profit_rub: '102600',
            margin_pct: 63.1,
            markup_percent: 171,
            missing_cogs_count: 0,
            operating_margin_pct: 56.95,
            skus_with_expenses_only: 0,
          },
        ],
      },
      empty: { data: [] },
    },
    weeklyCabinetExpenses: {
      name: 'analytics.weeklyCabinetExpenses',
      path: STORY_162_6_ANALYTICS_PATHS.weeklyCabinetExpenses,
      query: { required: { weekStart: ISO_WEEK, weekEnd: ISO_WEEK } },
      data: (url: URL) => ({
        data: {
          sales_gross: 180_000,
          returns_gross: 0,
          marketplace_commission: 17_400,
          acquiring_fee: 1000,
          cogs_total: 60_000,
          gross_profit_sku: 102_600,
          logistics: 5000,
          storage: 1626,
          storage_weekly_report: 1600,
          storage_difference: 26,
          other_adjustments: 0,
          wb_commission_adj: 0,
          penalties: 0,
          paid_acceptance: 0,
          total: 6626,
          weeks_included: [url.searchParams.get('weekEnd')],
        },
      }),
      empty: { data: null },
    },
    weeklyMarginTrends: {
      name: 'analytics.weeklyMarginTrends',
      path: STORY_162_6_ANALYTICS_PATHS.weeklyMarginTrends,
      query: {
        optional: { weeks: /^\d+$/, weekStart: ISO_WEEK, weekEnd: ISO_WEEK },
      },
      validate(url) {
        const hasWeeks = url.searchParams.has('weeks')
        const hasStart = url.searchParams.has('weekStart')
        const hasEnd = url.searchParams.has('weekEnd')
        if (hasWeeks === (hasStart || hasEnd) || hasStart !== hasEnd) {
          throw new Error(
            'analytics.weeklyMarginTrends: expected weeks or complete weekStart/weekEnd range'
          )
        }
      },
      data: {
        data: [
          {
            week: '2026-W04',
            week_start_date: '2026-01-19',
            week_end_date: '2026-01-25',
            margin_pct: 61.2,
            revenue_net: 150_000,
            cogs: 58_200,
            profit: 91_800,
            qty: 1500,
            sku_count: 10,
            missing_cogs_count: 0,
          },
          {
            week: '2026-W05',
            week_start_date: '2026-01-26',
            week_end_date: '2026-02-01',
            margin_pct: 63.1,
            revenue_net: 162_600,
            cogs: 60_000,
            profit: 102_600,
            qty: 1626,
            sku_count: 10,
            missing_cogs_count: 0,
          },
        ],
      },
      empty: { data: [] },
    },
    storageBySku: {
      name: 'analytics.storageBySku',
      path: STORY_162_6_ANALYTICS_PATHS.storageBySku,
      query: {
        required: { weekStart: ISO_WEEK, weekEnd: ISO_WEEK },
        optional: {
          nm_id: /^\d+$/,
          brand: /^.+$/,
          warehouse: /^.+$/,
          sort_by: /^(storage_cost|volume|days_stored)$/,
          sort_order: /^(asc|desc)$/,
          limit: /^\d+$/,
          cursor: /^.+$/,
        },
      },
      data: (url: URL) => ({
        period: storagePeriod(url),
        data: [
          {
            nm_id: '162600001',
            vendor_code: 'STORAGE-162-6',
            product_name: 'Товар хранения Story 162.6',
            brand: 'Бренд Story 162.6',
            storage_cost_total: 1626,
            storage_cost_avg_daily: 58.07,
            volume_avg: 16.26,
            warehouses: ['Коледино'],
            days_stored: 28,
            total_stock: 16,
            has_warehouse_stock: true,
          },
        ],
        summary: {
          total_storage_cost: 1626,
          products_count: 1,
          avg_cost_per_product: 1626,
        },
        pagination: { total: 1, cursor: null, has_more: false },
        has_data: true,
      }),
      empty: (url: URL) => ({
        period: storagePeriod(url),
        data: [],
        summary: { total_storage_cost: 0, products_count: 0, avg_cost_per_product: 0 },
        pagination: { total: 0, cursor: null, has_more: false },
        has_data: false,
      }),
    },
    storageTopConsumers: {
      name: 'analytics.storageTopConsumers',
      path: STORY_162_6_ANALYTICS_PATHS.storageTopConsumers,
      query: {
        required: { weekStart: ISO_WEEK, weekEnd: ISO_WEEK },
        optional: {
          limit: /^\d+$/,
          include_revenue: BOOLEAN,
          brand: /^.+$/,
          warehouse: /^.+$/,
        },
      },
      data: (url: URL) => ({
        period: storagePeriod(url),
        top_consumers: [
          {
            rank: 1,
            nm_id: '162600001',
            vendor_code: 'STORAGE-162-6',
            product_name: 'Товар хранения Story 162.6',
            brand: 'Бренд Story 162.6',
            storage_cost: 1626,
            percent_of_total: 100,
            volume: 16.26,
            revenue_net: 162_600,
            storage_to_revenue_ratio: 1,
            total_stock: 16,
            has_warehouse_stock: true,
          },
        ],
        total_storage_cost: 1626,
        has_data: true,
      }),
      empty: (url: URL) => ({
        period: storagePeriod(url),
        top_consumers: [],
        total_storage_cost: 0,
        has_data: false,
      }),
    },
    storageTrends: {
      name: 'analytics.storageTrends',
      path: STORY_162_6_ANALYTICS_PATHS.storageTrends,
      query: {
        required: { weekStart: ISO_WEEK, weekEnd: ISO_WEEK },
        optional: {
          nm_id: /^\d+$/,
          metrics: /^(storage_cost|volume)(,(storage_cost|volume))*$/,
          brand: /^.+$/,
          warehouse: /^.+$/,
        },
      },
      data: (url: URL) => ({
        period: storagePeriod(url),
        nm_id: null,
        data: [
          { week: url.searchParams.get('weekStart'), storage_cost: 1500, volume: 15 },
          { week: url.searchParams.get('weekEnd'), storage_cost: 1626, volume: 16.26 },
        ],
        summary: { storage_cost: { min: 1500, max: 1626, avg: 1563, trend: 8.4 } },
        has_data: true,
      }),
      empty: (url: URL) => ({
        period: storagePeriod(url),
        nm_id: null,
        data: [],
        has_data: false,
      }),
    },
    forecastAccuracy: {
      name: 'analytics.forecastAccuracy',
      path: STORY_162_6_ANALYTICS_PATHS.forecastAccuracy,
      data: {
        totalValidated: 1626,
        avgMAPE: 12.6,
        avgMAE: 16.26,
        avgBias: -1.2,
        byHorizon: [{ horizonDays: 7, mape: 12.6, mae: 16.26, count: 1626 }],
        bySKU: [{ nmId: 162600001, mape: 11.6, mae: 15.26, count: 126 }],
      },
      empty: {
        totalValidated: 0,
        avgMAPE: null,
        avgMAE: null,
        avgBias: null,
        byHorizon: [],
        bySKU: [],
      },
    },
    advertising: {
      name: 'analytics.advertising',
      path: STORY_162_6_ANALYTICS_PATHS.advertising,
      query: {
        required: { group_by: /^imtId$/ },
        optional: {
          from: ISO_DATE,
          to: ISO_DATE,
          view_by: /^(sku|campaign|day)$/,
          sort_by: /^(spend|totalSales|totalRevenue|organicSales|totalSpend|roas)$/,
          sort_order: /^(asc|desc)$/,
          efficiency_filter: /^[a-z_]+$/,
          campaign_ids: /^\d+(,\d+)*$/,
          limit: /^\d+$/,
          offset: /^\d+$/,
          include_daily: BOOLEAN,
        },
      },
      data: (url: URL) => ({
        items: [
          {
            key: 'merged:1626001',
            type: 'merged_group',
            imtId: 1626001,
            label: 'Склейка Story 162.6',
            mainProduct: {
              nmId: 162600101,
              vendorCode: 'STORY-162-6-MAIN',
              name: 'Главный товар Story 162.6',
            },
            productCount: 2,
            aggregateMetrics: {
              totalViews: 16260,
              totalClicks: 1626,
              totalOrders: 126,
              totalSpend: 1626,
              totalRevenue: 16_260,
              totalSales: 18_260,
              organicSales: 2000,
              organicContribution: 10.95,
              roas: 10,
              roi: 9,
              ctr: 10,
              cpc: 1,
              conversionRate: 7.75,
              profitAfterAds: 14_634,
            },
            products: [
              {
                nmId: 162600101,
                vendorCode: 'STORY-162-6-MAIN',
                imtId: 1626001,
                isMainProduct: true,
                totalViews: 10_000,
                totalClicks: 1000,
                totalOrders: 100,
                totalSpend: 1000,
                totalRevenue: 10_000,
                totalSales: 11_000,
                organicSales: 1000,
                organicContribution: 9.09,
                roas: 10,
                roi: 9,
                ctr: 10,
                cpc: 1,
                conversionRate: 10,
                profitAfterAds: 9000,
              },
              {
                nmId: 162600102,
                vendorCode: 'STORY-162-6-CHILD',
                imtId: 1626001,
                isMainProduct: false,
                totalViews: 6260,
                totalClicks: 626,
                totalOrders: 26,
                totalSpend: 626,
                totalRevenue: 6260,
                totalSales: 7260,
                organicSales: 1000,
                organicContribution: 13.77,
                roas: 10,
                roi: 9,
                ctr: 10,
                cpc: 1,
                conversionRate: 4.15,
                profitAfterAds: 5634,
              },
            ],
          },
        ],
        summary: {
          totalSpend: 1626,
          totalSales: 18_260,
          totalRevenue: 16_260,
          totalProfit: 14_634,
          avgRoas: 10,
          avgRoi: 9,
          avgCtr: 10,
          avgConversionRate: 7.75,
          totalOrganicSales: 2000,
          avgOrganicContribution: 10.95,
        },
        query: {
          cabinetId: 'story-162-6',
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          viewBy: url.searchParams.get('view_by') ?? 'sku',
        },
        pagination: { total: 1, limit: 25, offset: 0 },
        cachedAt: '2026-08-06T10:00:00.000Z',
      }),
      empty: { items: [], summary: {}, query: {}, pagination: { total: 0 } },
    },
    mergedGroupSyncStatus: {
      name: 'analytics.mergedGroupSyncStatus',
      path: STORY_162_6_ANALYTICS_PATHS.mergedGroupSyncStatus,
      data: {
        lastSyncAt: '2026-08-06T10:00:00.000Z',
        nextScheduledSync: '2026-08-06T11:00:00.000Z',
        status: 'completed',
        campaignsSynced: 1626,
        dataAvailableFrom: '2026-07-01',
        dataAvailableTo: '2026-08-05',
      },
      empty: {
        lastSyncAt: null,
        nextScheduledSync: '',
        status: 'pending',
        campaignsSynced: 0,
        dataAvailableFrom: null,
        dataAvailableTo: null,
      },
    },
  }

  return contracts[name]
}

export async function installStory1626AnalyticsRoutes(
  page: Page,
  options: Story1626AnalyticsRouteOptions
): Promise<Story1626RouteController> {
  const controller = createStory1626RouteController(page)

  for (const name of Object.keys(options) as Story1626AnalyticsRouteName[]) {
    const override = options[name] ?? {}
    const contract = analyticsContract(name)
    await controller.register({
      ...contract,
      ...override,
      name: contract.name,
      path: contract.path,
      query: contract.query,
      validate: contract.validate,
      data: override.data ?? contract.data,
    })
  }

  return controller
}
