/**
 * Test fixtures for Buyout Analytics hooks
 * Story 72.6-FE: Buyout Hook Migration
 */

export const BUYOUT_BY_SKU_RESPONSE = {
  data: [
    {
      nmId: 100500,
      supplierArticle: 'ART-1',
      productName: 'Товар',
      brand: 'Бренд',
      buyoutRatePct: 85,
      salesCount: 100,
      returnsCount: 15,
    },
  ],
  pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
}

export const BUYOUT_SUMMARY_RESPONSE = {
  overallBuyoutRatePct: 78.5,
  overallReturnRatePct: 21.5,
  totalSalesCount: 500,
  totalReturnsCount: 107,
  skuCount: 42,
  topDecliners: [],
  period: { from: '2026-02-01', to: '2026-02-28' },
  source: 'weekly' as const,
  confidence: 'high' as const,
}

/** Reusable date range for buyout tests */
export const BUYOUT_DATE_FROM = '2026-02-01'
export const BUYOUT_DATE_TO = '2026-02-28'

/**
 * Story 96.15-FE — Pattern 3 fixture: SKU item with source = 'sdk_reconciliation'.
 * Consumed by SourceBadge unit tests + BuyoutSummaryWidget consumer tests.
 */
export function withSdkReconciliationItem() {
  return {
    nmId: 200500,
    supplierArticle: 'ART-SDK',
    productName: 'SDK-товар',
    brand: 'SDK-бренд',
    buyoutRatePct: 92,
    salesCount: 150,
    returnsCount: 12,
    source: 'sdk_reconciliation' as const,
    confidence: 'high' as const,
  }
}

/**
 * Story 96.15-FE — Summary fixture with source = 'sdk_reconciliation'.
 * Consumed by BuyoutSummaryWidget consumer tests asserting SourceBadge renders for SDK source.
 */
export const BUYOUT_SUMMARY_SDK_RESPONSE = {
  overallBuyoutRatePct: 92.0,
  overallReturnRatePct: 8.0,
  totalSalesCount: 600,
  totalReturnsCount: 48,
  skuCount: 55,
  topDecliners: [],
  period: { from: '2026-04-01', to: '2026-04-30' },
  source: 'sdk_reconciliation' as const,
  confidence: 'high' as const,
}

/**
 * Story 96.15-FE 2nd-pass L2-2 — Pattern 3 fixture: SKU item with source = 'unknown'.
 * Mirrors withSdkReconciliationItem() shape. Consumed by ReconciliationTable + SourceBadge tests
 * exercising the 'unknown' anomaly branch (Defensive Frontend Principle).
 */
export function withUnknownSourceItem() {
  return {
    nmId: 300500,
    supplierArticle: 'ART-UNK',
    productName: 'Товар с неизвестным источником',
    brand: 'Неизвестный бренд',
    buyoutRatePct: 55,
    salesCount: 80,
    returnsCount: 36,
    source: 'unknown' as const,
    confidence: 'low' as const,
  }
}

/**
 * Story 96.15-FE 2nd-pass L2-2 — Summary fixture with source = 'unknown'.
 * Consumed by BuyoutSummaryWidget tests asserting H2-1 footnote renders when source === 'unknown'.
 */
export const BUYOUT_SUMMARY_UNKNOWN_RESPONSE = {
  overallBuyoutRatePct: 55.0,
  overallReturnRatePct: 45.0,
  totalSalesCount: 200,
  totalReturnsCount: 90,
  skuCount: 12,
  topDecliners: [],
  period: { from: '2026-04-01', to: '2026-04-30' },
  source: 'unknown' as const,
  confidence: 'low' as const,
}
