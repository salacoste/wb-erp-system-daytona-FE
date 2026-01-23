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
  },
  SETTINGS: {
    ROOT: '/settings',
    NOTIFICATIONS: '/settings/notifications', // Epic 34-FE: Telegram Notifications
    TARIFFS: '/settings/tariffs', // Epic 52-FE: Tariff Settings Admin (Admin only)
  },
} as const

// Type for route paths
export type RoutePath =
  | typeof ROUTES[keyof typeof ROUTES]
  | typeof ROUTES.ONBOARDING[keyof typeof ROUTES.ONBOARDING]
  | typeof ROUTES.COGS[keyof typeof ROUTES.COGS]
  | typeof ROUTES.ANALYTICS[keyof typeof ROUTES.ANALYTICS]
  | typeof ROUTES.SETTINGS[keyof typeof ROUTES.SETTINGS]
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
    ROUTES.SETTINGS.ROOT,
    ROUTES.SETTINGS.NOTIFICATIONS, // Epic 34-FE: Telegram Notifications
    ROUTES.SETTINGS.TARIFFS, // Epic 52-FE: Tariff Settings Admin (Admin only)
  ]

  return protectedPaths.some((path) => pathname.startsWith(path))
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

