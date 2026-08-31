/**
 * SKU Financials Types
 * Epic 31: Complete Per-SKU Financial Analytics
 * Reference: frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/sku-financials' continue to work unchanged.
 */

// Core types: query, profitability, response interfaces
export type {
  SkuFinancialsSortBy,
  SkuFinancialsQuery,
  ProfitabilityStatus,
  SkuFinancialRevenue,
  SkuFinancialQuantity,
  SkuFinancialCosts,
  SkuFinancialVisibility,
  SkuFinancialProfit,
  SkuFinancialParity,
  SkuFinancialItem,
  SkuFinancialsMeta,
  SkuFinancialsPagination,
  SkuFinancialsResponse,
} from './core'

export { PROFITABILITY_COLORS, PROFITABILITY_LABELS } from './core'

// Helper functions
export {
  getProfitabilityBadgeClass,
  getProfitabilityLabel,
  getTotalOperatingExpenses,
} from './helpers'
