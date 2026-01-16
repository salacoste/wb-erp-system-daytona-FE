/**
 * E2E Test Data and Fixtures
 * WB Repricer System
 */

// Base URL (frontend runs on 3100 in development)
export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3100'

// Test user credentials (configure in .env.local or CI secrets)
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@test.com',
  password: process.env.E2E_TEST_PASSWORD || 'Russia23!',
}

// Test cabinet data
export const TEST_CABINET = {
  name: 'E2E Test Cabinet',
  description: 'Cabinet for E2E testing',
}

// Test WB API token (use test/sandbox token)
export const TEST_WB_TOKEN = {
  // Token should be provided via environment variable for security
  value: process.env.E2E_WB_TOKEN || 'test-token-placeholder',
  masked: '****-****-****-test',
}

// Test product data
export const TEST_PRODUCTS = {
  withCogs: {
    nmId: 173589742,
    name: 'Test Product With COGS',
    brand: 'TestBrand',
    cogs: 150.5,
  },
  withoutCogs: {
    nmId: 173589743,
    name: 'Test Product Without COGS',
    brand: 'TestBrand',
  },
  forBulkAssignment: [
    { nmId: 173589744, cogs: 100 },
    { nmId: 173589745, cogs: 200 },
    { nmId: 173589746, cogs: 300 },
  ],
}

// Test week data (ISO format)
export const TEST_WEEKS = {
  current: '2025-W47',
  previous: '2025-W46',
  historical: '2025-W44',
}

// Expected metric ranges for validation
export const EXPECTED_METRICS = {
  revenue: { min: 0, max: 10_000_000 },
  margin: { min: -100, max: 100 },
  payout: { min: -1_000_000, max: 10_000_000 },
}

// Page URLs (matches Next.js App Router structure in src/app/)
export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  onboarding: {
    cabinet: '/cabinet',      // (onboarding)/cabinet/page.tsx
    token: '/wb-token',       // (onboarding)/wb-token/page.tsx
    processing: '/processing', // (onboarding)/processing/page.tsx
  },
  cogs: '/cogs',
  cogsBulk: '/cogs/bulk',
  analytics: {
    main: '/analytics',           // Main analytics page
    sku: '/analytics/sku',
    brand: '/analytics/brand',
    category: '/analytics/category',
    timePeriod: '/analytics/time-period',  // Time period analytics
    unitEconomics: '/analytics/unit-economics',  // Epic 5: Unit Economics
    supplyPlanning: '/analytics/supply-planning', // Epic 6: Supply Planning
    liquidity: '/analytics/liquidity', // Epic 7: Liquidity Analysis
  },
}

// Timeouts
export const TIMEOUTS = {
  navigation: 10_000,
  api: 30_000,
  polling: 60_000,
  processing: 120_000,
}

// Selectors (data-testid based)
export const SELECTORS = {
  // Auth
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  loginButton: '[data-testid="login-button"]',
  registerButton: '[data-testid="register-button"]',
  logoutButton: '[data-testid="logout-button"]',

  // Dashboard
  sidebar: '[data-testid="sidebar"]',
  metricCard: '[data-testid="metric-card"]',
  expenseChart: '[data-testid="expense-chart"]',
  trendGraph: '[data-testid="trend-graph"]',

  // Onboarding
  cabinetNameInput: '[data-testid="cabinet-name-input"]',
  tokenInput: '[data-testid="token-input"]',
  processingStatus: '[data-testid="processing-status"]',
  progressBar: '[data-testid="progress-bar"]',

  // COGS
  productList: '[data-testid="product-list"]',
  productRow: '[data-testid="product-row"]',
  cogsInput: '[data-testid="cogs-input"]',
  assignCogsButton: '[data-testid="assign-cogs-button"]',
  marginDisplay: '[data-testid="margin-display"]',

  // Analytics
  weekSelector: '[data-testid="week-selector"]',
  analyticsTable: '[data-testid="analytics-table"]',
  sortableHeader: '[data-testid="sortable-header"]',
  filterInput: '[data-testid="filter-input"]',

  // Common
  toast: '[data-testid="toast"]',
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  submitButton: '[data-testid="submit-button"]',
}
