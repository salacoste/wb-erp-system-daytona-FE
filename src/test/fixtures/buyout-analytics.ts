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
