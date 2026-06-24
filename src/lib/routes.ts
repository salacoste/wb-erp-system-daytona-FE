/**
 * Application route definitions
 * Centralized route constants for type-safe navigation
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Onboarding routes (using route groups, so no /onboarding prefix in URL)
  ONBOARDING: {
    CABINET: '/cabinet',
    WB_TOKEN: '/wb-token',
    PROCESSING: '/processing',
  },

  // Protected routes
  DASHBOARD: '/dashboard',
  COGS: {
    ROOT: '/cogs',
    BULK: '/cogs/bulk',
    PRICE_CALCULATOR: '/cogs/price-calculator',
  },
  ANALYTICS: {
    ROOT: '/analytics',
    DASHBOARD: '/analytics/dashboard',
    SKU: '/analytics/sku',
    BRAND: '/analytics/brand',
    CATEGORY: '/analytics/category',
    TIME_PERIOD: '/analytics/time-period',
    STORAGE: '/analytics/storage',
    SUPPLY_PLANNING: '/analytics/supply-planning',
    UNIT_ECONOMICS: '/analytics/unit-economics',
    LIQUIDITY: '/analytics/liquidity',
    ADVERTISING: '/analytics/advertising',
    CAMPAIGN_DETAIL: '/analytics/advertising/campaigns',
    ORDERS: '/analytics/orders',
    FUNNEL: '/analytics/funnel',
    BUYOUT: '/analytics/buyout',
    RETURNS: '/analytics/returns',
    ACQUIRING: '/analytics/acquiring',
    ACQUIRING_PERIOD: '/analytics/acquiring/period',
    FBS_STOCK: '/analytics/fbs-stock',
    FBS_ENHANCED: '/analytics/fbs-enhanced',
    BUYOUT_RECONCILIATION: '/analytics/buyout-reconciliation',
    REORDER: '/analytics/reorder',
    SEARCH: '/analytics/search',
    CROSS_REFERENCE: '/analytics/cross-reference',
    ALERTS: '/analytics/alerts',
    GAPS: '/analytics/gaps',
    PRICING: '/analytics/pricing',
    FORECAST: '/analytics/forecast',
    FORECAST_ACCURACY: '/analytics/forecast-accuracy',
    MODELS: '/analytics/models',
    PRODUCT: '/analytics/product',
    AI_ADMIN: {
      MODELS: '/analytics/ai-admin/models',
      PREFERENCES: '/analytics/ai-admin/preferences',
      ANOMALIES: '/analytics/ai-admin/anomalies',
    },
  },

  ORDERS: {
    ROOT: '/orders',
    INTEGRITY: '/orders/integrity',
    FBO: '/orders/fbo', // FBO Orders & Sales
  },

  SUPPLIES: {
    ROOT: '/supplies',
    DETAIL: '/supplies/[id]',
  },
  SHIPMENTS: {
    ROOT: '/shipments',
    DETAIL: '/shipments/[id]',
    BOX_TYPES: '/shipments/box-types',
    SKU_PACKAGING: '/shipments/sku-packaging',
  },

  MONITORING: '/monitoring',
  MONITOR: '/monitor',

  SETTINGS: {
    ROOT: '/settings',
    CABINET: '/settings/cabinet',
    NOTIFICATIONS: '/settings/notifications',
    TARIFFS: '/settings/tariffs',
    BACKFILL: '/settings/backfill',
    TAX: '/settings/tax',
    EXPENSES: '/settings/expenses',
  },
} as const

// Type for route paths
export type RoutePath =
  | (typeof ROUTES)[keyof typeof ROUTES]
  | (typeof ROUTES.ONBOARDING)[keyof typeof ROUTES.ONBOARDING]
  | (typeof ROUTES.COGS)[keyof typeof ROUTES.COGS]
  | (typeof ROUTES.ANALYTICS)[keyof typeof ROUTES.ANALYTICS]
  | (typeof ROUTES.ANALYTICS.AI_ADMIN)[keyof typeof ROUTES.ANALYTICS.AI_ADMIN]
  | (typeof ROUTES.ORDERS)[keyof typeof ROUTES.ORDERS]
  | (typeof ROUTES.SHIPMENTS)[keyof typeof ROUTES.SHIPMENTS]
  | (typeof ROUTES.SUPPLIES)[keyof typeof ROUTES.SUPPLIES]
  | (typeof ROUTES.SETTINGS)[keyof typeof ROUTES.SETTINGS]
  | string

// Route matchers moved to routes-protected.ts (circular dependency fix).
// Import isProtectedRoute / isPublicRoute directly from '@/lib/routes-protected'.

// Route builder helpers re-exported from route-helpers.ts for backward compatibility.
// New consumers should import directly from '@/lib/route-helpers'.
export {
  buildSupplyDetailRoute,
  buildShipmentDetailRoute,
  buildCampaignDetailRoute,
  buildModelPerformanceRoute,
  buildModelEvaluationsRoute,
  buildModelSkuAccuracyRoute,
  buildProductAnalyticsRoute,
} from '@/lib/route-helpers'
