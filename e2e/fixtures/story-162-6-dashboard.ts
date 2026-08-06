import type { Page } from '@playwright/test'
import { DASHBOARD_API_ROUTES } from './dashboard-metrics-test-data'
import {
  createStory1626RouteController,
  type Story1626RouteContract,
  type Story1626RouteController,
  type Story1626RouteMode,
} from './story-162-6-route-controller'

export const STORY_162_6_DASHBOARD_ROUTES = {
  availableWeeks: DASHBOARD_API_ROUTES.availableWeeks,
  financeSummary: DASHBOARD_API_ROUTES.financeSummary,
  ordersTrends: DASHBOARD_API_ROUTES.ordersTrends,
  ordersVolume: DASHBOARD_API_ROUTES.ordersVolume,
  dailyFinance: DASHBOARD_API_ROUTES.dailyFinance,
  dailyAdvertising: DASHBOARD_API_ROUTES.dailyAdvertising,
  fulfillmentSummary: DASHBOARD_API_ROUTES.fulfillmentSummary,
  storageTopConsumers: DASHBOARD_API_ROUTES.storageTopConsumers,
  storageTrends: DASHBOARD_API_ROUTES.storageTrends,
} as const

export type Story1626DashboardRouteName = keyof typeof STORY_162_6_DASHBOARD_ROUTES

export interface Story1626DashboardRouteOption {
  mode?: Story1626RouteMode
  data?: Story1626RouteContract['data']
  empty?: Story1626RouteContract['empty']
  error?: Story1626RouteContract['error']
}

export type Story1626DashboardRouteOptions = Partial<
  Record<Story1626DashboardRouteName, Story1626DashboardRouteOption>
>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_WEEK = /^\d{4}-W\d{2}$/
const ISO_MONTH = /^\d{4}-\d{2}$/

function periodFrom(url: URL): string {
  return url.searchParams.get('week') ?? url.searchParams.get('month') ?? '2026-W05'
}

function dashboardContract(name: Story1626DashboardRouteName): Story1626RouteContract {
  const contracts: Record<Story1626DashboardRouteName, Story1626RouteContract> = {
    availableWeeks: {
      name: 'dashboard.availableWeeks',
      path: STORY_162_6_DASHBOARD_ROUTES.availableWeeks,
      data: [
        { week: '2026-W05', start_date: '2026-01-26' },
        { week: '2026-W04', start_date: '2026-01-19' },
        { week: '2026-W03', start_date: '2026-01-12' },
      ],
      empty: [],
    },
    financeSummary: {
      name: 'dashboard.financeSummary',
      path: STORY_162_6_DASHBOARD_ROUTES.financeSummary,
      query: { optional: { week: ISO_WEEK, month: ISO_MONTH } },
      validate(url) {
        const periods = ['week', 'month'].filter(key => url.searchParams.has(key))
        if (periods.length !== 1) {
          throw new Error('dashboard.financeSummary: expected exactly one of week or month')
        }
      },
      data: (url: URL) => {
        const period = periodFrom(url)
        return {
          summary_total: {
            week: period,
            payout_total: 87_074.72,
            sales_gross_total: 150_000,
            sale_gross_total: 142_000,
            to_pay_goods_total: 118_000,
            logistics_cost_total: 25_000,
            storage_cost_total: 8_000,
            penalties_total: 900,
            cogs_total: 45_000,
            margin_pct: 68.31,
            product_transactions: 142,
          },
          summary_rus: null,
          summary_eaeu: null,
          meta: {
            week: period,
            cabinet_id: 'story-162-6',
            generated_at: '2026-08-06T10:00:00.000Z',
            timezone: 'Europe/Moscow',
          },
        }
      },
      empty: {
        summary_total: null,
        summary_rus: null,
        summary_eaeu: null,
        meta: {
          week: '2026-W05',
          cabinet_id: 'story-162-6',
          generated_at: '2026-08-06T10:00:00.000Z',
          timezone: 'Europe/Moscow',
        },
      },
    },
    ordersTrends: {
      name: 'dashboard.ordersTrends',
      path: STORY_162_6_DASHBOARD_ROUTES.ordersTrends,
      query: {
        required: { from: ISO_DATE, to: ISO_DATE, aggregation: /^day$/ },
      },
      data: (url: URL) => ({
        trends: [
          {
            date: url.searchParams.get('from'),
            ordersCount: 12,
            revenue: 12_600,
            cancellations: 1,
            returns: 0,
          },
        ],
      }),
      empty: { trends: [] },
    },
    ordersVolume: {
      name: 'dashboard.ordersVolume',
      path: STORY_162_6_DASHBOARD_ROUTES.ordersVolume,
      query: {
        required: { from: ISO_DATE, to: ISO_DATE, include_cogs: /^true$/ },
        optional: { aggregation: /^day$/ },
      },
      data: (url: URL) => ({
        by_day_with_cogs: [
          {
            date: url.searchParams.get('from'),
            orders_count: 12,
            cogs: 4_200,
          },
        ],
      }),
      empty: { by_day_with_cogs: [] },
    },
    dailyFinance: {
      name: 'dashboard.dailyFinance',
      path: STORY_162_6_DASHBOARD_ROUTES.dailyFinance,
      query: { required: { from: ISO_DATE, to: ISO_DATE } },
      data: (url: URL) => ({
        data: [
          {
            date: url.searchParams.get('from'),
            sales: 12_000,
            cogs: 4_000,
            logistics: 800,
            storage: 250,
            penalties: 0,
            commission: 1_500,
          },
        ],
      }),
      empty: { data: [] },
    },
    dailyAdvertising: {
      name: 'dashboard.dailyAdvertising',
      path: STORY_162_6_DASHBOARD_ROUTES.dailyAdvertising,
      query: { required: { from: ISO_DATE, to: ISO_DATE } },
      data: (url: URL) => ({ data: [{ date: url.searchParams.get('from'), spend: 700 }] }),
      empty: { data: [] },
    },
    fulfillmentSummary: {
      name: 'dashboard.fulfillmentSummary',
      path: STORY_162_6_DASHBOARD_ROUTES.fulfillmentSummary,
      query: { required: { from: ISO_DATE, to: ISO_DATE } },
      data: (url: URL) => ({
        summary: {
          fbo: {
            ordersCount: 8,
            ordersRevenue: 8_000,
            ordersRevenueDiscounted: 7_000,
            salesCount: 7,
            salesRevenue: 6_500,
            forPayTotal: 5_500,
            returnsCount: 1,
            returnsRevenue: 500,
            returnRate: 12.5,
            avgOrderValue: 1_000,
          },
          fbs: {
            ordersCount: 4,
            ordersRevenue: 4_000,
            ordersRevenueDiscounted: 3_500,
            salesCount: 4,
            salesRevenue: 3_400,
            forPayTotal: 2_900,
            returnsCount: 0,
            returnsRevenue: 0,
            returnRate: 0,
            avgOrderValue: 1_000,
          },
          total: {
            ordersCount: 12,
            ordersRevenue: 12_000,
            ordersRevenueDiscounted: 10_500,
            fboShare: 66.67,
            fbsShare: 33.33,
          },
        },
        period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      }),
      empty: {
        summary: { fbo: {}, fbs: {}, total: {} },
        period: { from: '2026-01-26', to: '2026-02-01' },
      },
    },
    storageTopConsumers: {
      name: 'dashboard.storageTopConsumers',
      path: STORY_162_6_DASHBOARD_ROUTES.storageTopConsumers,
      query: {
        required: { week_start: ISO_WEEK, week_end: ISO_WEEK },
        optional: { limit: /^\d+$/ },
      },
      data: { data: [], pagination: { total: 0 } },
      empty: { data: [], pagination: { total: 0 } },
    },
    storageTrends: {
      name: 'dashboard.storageTrends',
      path: STORY_162_6_DASHBOARD_ROUTES.storageTrends,
      query: {
        required: { week_start: ISO_WEEK, week_end: ISO_WEEK },
        optional: { metrics: /^[a-z_,]+$/ },
      },
      data: { data: [] },
      empty: { data: [] },
    },
  }

  return contracts[name]
}

export async function installStory1626DashboardRoutes(
  page: Page,
  options: Story1626DashboardRouteOptions
): Promise<Story1626RouteController> {
  const controller = createStory1626RouteController(page)

  for (const name of Object.keys(options) as Story1626DashboardRouteName[]) {
    const override = options[name] ?? {}
    const contract = dashboardContract(name)
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
