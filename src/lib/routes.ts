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
    SINGLE: '/cogs/single',
    BULK: '/cogs/bulk',
    PRICE_CALCULATOR: '/cogs/price-calculator', // Epic 44: Price Calculator UI
  },
  ANALYTICS: {
    ROOT: '/analytics',
    DASHBOARD: '/analytics/dashboard', // Story 6.4-FE: Cabinet Summary Dashboard
    SKU: '/analytics/sku',
    BRAND: '/analytics/brand',
    CATEGORY: '/analytics/category',
    TIME_PERIOD: '/analytics/time-period',
    SUMMARY: '/analytics/summary',
    STORAGE: '/analytics/storage', // Epic 24: Paid Storage Analytics
    SUPPLY_PLANNING: '/analytics/supply-planning', // Epic 6: Supply Planning & Stockout Prevention
    UNIT_ECONOMICS: '/analytics/unit-economics', // Epic 5: Unit Economics Analytics
    LIQUIDITY: '/analytics/liquidity', // Epic 7: Liquidity Analysis
    ADVERTISING: '/analytics/advertising', // Epic 33: Advertising Analytics
    CAMPAIGN_DETAIL: '/analytics/advertising/campaigns', // Story 86.1: Bid Recommendations
    ORDERS: '/analytics/orders', // Epic 51-FE: FBS Historical Analytics
    FUNNEL: '/analytics/funnel', // Epic 68: Marketing Funnel Analytics
    BUYOUT: '/analytics/buyout', // Epic 69: Buyout Rate Analytics
    RETURNS: '/analytics/returns', // Epic 71: Return Analytics
    ACQUIRING: '/analytics/acquiring', // Epic 90-FE: Acquiring Cost Reports
    ACQUIRING_PERIOD: '/analytics/acquiring/period', // Epic 90-FE Story 90.4: Period Detail
    FBS_STOCK: '/analytics/fbs-stock', // Epic 96-FE Story 96.11: FBS Stock Breakdowns
    FBS_ENHANCED: '/analytics/fbs-enhanced', // Epic 96-FE Story 96.13: FBS Enhanced Analytics aggregated view
    BUYOUT_RECONCILIATION: '/analytics/buyout-reconciliation', // Epic 96-FE Story 96.14: Buyout reconciliation audit
    REORDER: '/analytics/reorder', // Reorder Dashboard — warehouse replenishment recommendations
    SEARCH: '/analytics/search', // Epic 71-FE: Search Analytics
    CROSS_REFERENCE: '/analytics/cross-reference', // Story 73.7-FE: Search + Advertising Cross-Reference
    ALERTS: '/analytics/alerts', // Alerts Dashboard — notification rules & history
    PRICING: '/analytics/pricing', // Epic 121: Price Recommendations
    FORECAST: '/analytics/forecast', // Epic 103-FE: AI Sales Forecast
    FORECAST_ACCURACY: '/analytics/forecast-accuracy', // Epic 123-FE: Forecast Accuracy Dashboard
    MODELS: '/analytics/models', // Epic 109-FE: AI Model Management
    PRODUCT: '/analytics/product', // Epic 120-FE Story 120.5: Unified Product Analytics (dynamic /[nmId] — use buildProductAnalyticsRoute)
    // Epic 112-FE: AI Admin (Owner-only cross-cabinet management)
    AI_ADMIN: {
      MODELS: '/analytics/ai-admin/models', // Story 112.1-FE: Model rollback admin UI
      PREFERENCES: '/analytics/ai-admin/preferences', // Story 112.2-FE: Master aiEnabled toggle
      ANOMALIES: '/analytics/ai-admin/anomalies', // Story 112.3-FE: Anomaly resolution (Owner/Manager)
    },
  },

  // Epic 40-FE: Orders UI (WB Native Orders History)
  ORDERS: {
    ROOT: '/orders',
    LIST: '/orders/list',
  },

  // Epic 53-FE: Supply Management
  SUPPLIES: {
    ROOT: '/supplies',
    DETAIL: '/supplies/[id]', // Dynamic route - use buildSupplyDetailRoute helper
  },
  // Epic 75-FE / 76-FE: Shipment Cost Allocation
  SHIPMENTS: {
    ROOT: '/shipments',
    DETAIL: '/shipments/[id]', // Dynamic route — use buildShipmentDetailRoute helper
    BOX_TYPES: '/shipments/box-types',
    SKU_PACKAGING: '/shipments/sku-packaging',
  },

  // Epic 68-FE: Monitoring Health Dashboard
  MONITORING: '/monitoring',
  // Epic 92-FE: Monitor Dashboard (business KPI surface — distinct from /monitoring ops surface)
  MONITOR: '/monitor',

  SETTINGS: {
    ROOT: '/settings',
    CABINET: '/settings/cabinet', // Seller info + Jam subscription status
    NOTIFICATIONS: '/settings/notifications', // Epic 34-FE: Telegram Notifications
    TARIFFS: '/settings/tariffs', // Epic 52-FE: Tariff Settings Admin (Admin only)
    BACKFILL: '/settings/backfill', // Epic 51-FE: Backfill Admin (Admin only)
    TAX: '/settings/tax', // Epic 66-FE: Tax & VAT Settings
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

// Protected route matcher
export const isProtectedRoute = (pathname: string): boolean => {
  const protectedPaths = [
    ROUTES.DASHBOARD,
    ROUTES.COGS.ROOT,
    ROUTES.COGS.SINGLE,
    ROUTES.COGS.BULK,
    ROUTES.COGS.PRICE_CALCULATOR, // Epic 44: Price Calculator UI
    ROUTES.ANALYTICS.ROOT,
    ROUTES.ANALYTICS.DASHBOARD, // Story 6.4-FE: Cabinet Summary Dashboard
    ROUTES.ANALYTICS.SKU,
    ROUTES.ANALYTICS.BRAND,
    ROUTES.ANALYTICS.CATEGORY,
    ROUTES.ANALYTICS.TIME_PERIOD,
    ROUTES.ANALYTICS.SUMMARY,
    ROUTES.ANALYTICS.STORAGE,
    ROUTES.ANALYTICS.SUPPLY_PLANNING,
    ROUTES.ANALYTICS.UNIT_ECONOMICS,
    ROUTES.ANALYTICS.LIQUIDITY,
    ROUTES.ANALYTICS.ADVERTISING,
    ROUTES.ANALYTICS.ORDERS, // Epic 51-FE: FBS Historical Analytics
    ROUTES.ANALYTICS.FUNNEL, // Epic 68: Marketing Funnel Analytics
    ROUTES.ANALYTICS.BUYOUT, // Epic 69: Buyout Rate Analytics
    ROUTES.ANALYTICS.RETURNS, // Epic 71: Return Analytics
    ROUTES.ANALYTICS.ACQUIRING, // Epic 90-FE: Acquiring Cost Reports
    ROUTES.ANALYTICS.ACQUIRING_PERIOD, // Epic 90-FE Story 90.4: Period Detail
    ROUTES.ANALYTICS.FBS_STOCK, // Epic 96-FE Story 96.11: FBS Stock Breakdowns
    ROUTES.ANALYTICS.FBS_ENHANCED, // Epic 96-FE Story 96.13: FBS Enhanced Analytics
    ROUTES.ANALYTICS.BUYOUT_RECONCILIATION, // Epic 96-FE Story 96.14: Buyout reconciliation audit
    ROUTES.ANALYTICS.REORDER, // Reorder Dashboard
    ROUTES.ANALYTICS.SEARCH, // Epic 71-FE: Search Analytics
    ROUTES.ANALYTICS.CROSS_REFERENCE, // Story 73.7-FE: Search + Advertising Cross-Reference
    ROUTES.ANALYTICS.ALERTS, // Alerts Dashboard
    ROUTES.ANALYTICS.PRICING, // Epic 121: Price Recommendations
    ROUTES.ANALYTICS.FORECAST, // Epic 103-FE: AI Sales Forecast
    ROUTES.ANALYTICS.FORECAST_ACCURACY, // Epic 123-FE: Forecast Accuracy Dashboard
    ROUTES.ANALYTICS.MODELS, // Epic 109-FE: AI Model Management
    ROUTES.ANALYTICS.AI_ADMIN.MODELS, // Epic 112-FE: AI Admin Model Rollback (Owner only)
    ROUTES.ANALYTICS.AI_ADMIN.PREFERENCES, // Story 112.2-FE: AI Preferences toggle (Owner only)
    ROUTES.ANALYTICS.AI_ADMIN.ANOMALIES, // Story 112.3-FE: Anomaly Resolution (Owner/Manager)
    ROUTES.ORDERS.ROOT, // Epic 40-FE: Orders UI
    ROUTES.ORDERS.LIST,
    ROUTES.MONITORING, // Epic 68-FE: Monitoring Health Dashboard
    ROUTES.MONITOR, // Epic 92-FE: Monitor Dashboard
    ROUTES.SHIPMENTS.ROOT, // Epic 75-FE: Shipment Cost Allocation
    ROUTES.SHIPMENTS.BOX_TYPES,
    ROUTES.SHIPMENTS.SKU_PACKAGING,
    ROUTES.SUPPLIES.ROOT, // Epic 53-FE: Supply Management
    ROUTES.SETTINGS.ROOT,
    ROUTES.SETTINGS.CABINET, // Seller info + Jam subscription
    ROUTES.SETTINGS.NOTIFICATIONS, // Epic 34-FE: Telegram Notifications
    ROUTES.SETTINGS.TARIFFS, // Epic 52-FE: Tariff Settings Admin (Admin only)
    ROUTES.SETTINGS.BACKFILL, // Epic 51-FE: Backfill Admin (Admin only)
    ROUTES.SETTINGS.TAX, // Epic 66-FE: Tax & VAT Settings
  ]

  return protectedPaths.some(path => pathname.startsWith(path))
}

// Public route matcher
export const isPublicRoute = (pathname: string): boolean => {
  const publicPaths: string[] = [
    ROUTES.HOME,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.ONBOARDING.CABINET,
    ROUTES.ONBOARDING.WB_TOKEN,
    ROUTES.ONBOARDING.PROCESSING,
  ]

  return publicPaths.includes(pathname)
}

// Route builder helpers for dynamic routes

/**
 * Build supply detail route with specific supply ID
 * Epic 53-FE: Supply Management
 */
export const buildSupplyDetailRoute = (supplyId: string): string => {
  return `/supplies/${supplyId}`
}

/**
 * Build shipment detail route with specific shipment ID
 * Epic 76-FE: Shipment Planning & Cost Calculation
 */
export const buildShipmentDetailRoute = (shipmentId: string): string => {
  return `/shipments/${shipmentId}`
}

export const buildCampaignDetailRoute = (advertId: number): string => {
  return `/analytics/advertising/campaigns/${advertId}`
}

/**
 * Build model performance detail route.
 * Story 109.5-FE: dynamic route /analytics/models/[id]/performance.
 * Function-style helper (not ROUTES entry) because ROUTES.ANALYTICS is `as const`
 * and only accepts string-literal values — matches buildSupplyDetailRoute / buildCampaignDetailRoute precedent.
 * Renamed buildModelPerformanceRoute (F-6: aligns with buildSupplyDetailRoute / buildCampaignDetailRoute naming).
 */
export const buildModelPerformanceRoute = (modelId: string): string => {
  return `${ROUTES.ANALYTICS.MODELS}/${modelId}/performance`
}

/**
 * Build model evaluations list route.
 * Story 110.1-FE: pre-registered for Epic 110 evaluations feature (Story 110.2 destination).
 * Arrow-function style — matches buildModelPerformanceRoute / buildCampaignDetailRoute precedent.
 */
export const buildModelEvaluationsRoute = (modelId: string): string =>
  `${ROUTES.ANALYTICS.MODELS}/${modelId}/evaluations`

/**
 * Build model SKU accuracy table route.
 * Story 110.1-FE: pre-registered for Epic 110 evaluations feature (Story 110.3 destination).
 * Arrow-function style — matches buildModelPerformanceRoute / buildCampaignDetailRoute precedent.
 */
export const buildModelSkuAccuracyRoute = (modelId: string): string =>
  `${ROUTES.ANALYTICS.MODELS}/${modelId}/evaluations/sku-accuracy`

/**
 * Build Unified Product Analytics route for a given nmId.
 * Epic 120-FE Story 120.5: dynamic route /analytics/product/[nmId].
 * nmId is an opaque ID — typed `string` so the AP#10 "never formatNumber / never
 * lose precision" contract is enforced at the call boundary (callers with a
 * numeric nmId must String() it explicitly). Matches the opaque-ID sibling
 * precedent buildModelPerformanceRoute / buildShipmentDetailRoute (string-typed).
 */
export const buildProductAnalyticsRoute = (nmId: string): string =>
  `${ROUTES.ANALYTICS.PRODUCT}/${nmId}`
