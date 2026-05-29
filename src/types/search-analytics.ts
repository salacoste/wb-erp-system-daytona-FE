/**
 * Search Analytics TypeScript types
 * Epic 71-FE: Search Analytics & Jam Gating
 * Backend endpoints: Task-139 (complete)
 *
 * Three endpoints:
 *   GET /v1/analytics/search/by-product — queries driving traffic to a product
 *   GET /v1/analytics/search/by-query  — products ranking for a search term
 *   GET /v1/analytics/search/orders    — order attribution from organic search
 */

// --- Enum / Union Types ---

// Story 91.1-FE removed 'totalRevenue' (WB never returned real data); Story 117.2-FE (2026-05-28) live-verified the backend still returns none (Branch A) — keep removed; don't re-add without fresh backend evidence. Story 119.1-FE (2026-05-29) attached Boundary Normalizer at API layer (src/lib/api/search-analytics-normalizer.ts) — shape drift absorbed once at the boundary, consumers receive frontend-canonical shapes.
export type SearchOrderBy =
  | 'totalImpressions'
  | 'totalClicks'
  | 'avgPosition'
  | 'avgCtr'
  | 'totalOrders'

export type SearchOrdersGroupBy = 'query' | 'product' | 'day'

// --- Shared Types ---

export interface SearchPeriod {
  from: string
  to: string
}

// --- By-Product (GET /v1/analytics/search/by-product) ---

export interface SearchByProductParams {
  nmId: number
  from: string
  to: string
  orderBy?: SearchOrderBy
  limit?: number
}

export interface SearchQueryItem {
  searchQuery: string
  avgPosition: number
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  totalOrders: number
  // Story 91.1-FE: totalRevenue removed (WB never returned real data; backend dropped the field)
}

export interface SearchByProductResponse {
  nmId: number
  period: SearchPeriod
  queries: SearchQueryItem[]
  totalQueries: number
}

// --- By-Query (GET /v1/analytics/search/by-query) ---

export interface SearchByQueryParams {
  query: string
  from: string
  to: string
  limit?: number
}

export interface SearchProductItem {
  nmId: number
  vendorCode: string | null
  avgPosition: number
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  totalOrders: number
  // Story 91.1-FE: totalRevenue removed
}

export interface SearchByQueryResponse {
  query: string
  period: SearchPeriod
  products: SearchProductItem[]
  totalProducts: number
}

// --- Orders (GET /v1/analytics/search/orders) ---

export interface SearchOrdersParams {
  from: string
  to: string
  groupBy?: SearchOrdersGroupBy
  limit?: number
}

export interface SearchOrderItem {
  /** query text (groupBy=query), nmId as number (groupBy=product), or date string (groupBy=day) */
  key: string | number
  totalOrders: number
  // Story 91.1-FE: totalRevenue removed
  /** Present when groupBy='product' */
  vendorCode?: string | null
  /** Present when groupBy='query' or groupBy='day' */
  uniqueProducts?: number
  /** Present when groupBy='product' or groupBy='day' */
  uniqueQueries?: number
}

export interface SearchOrdersSummary {
  totalSearchOrders: number
  // Story 91.1-FE: totalSearchRevenue removed. Story 119.1-FE 1st-pass F-2: widened to `number | null` per AP#8 (UI renders '—')
  searchOrderShare: number | null
}

export interface SearchOrdersResponse {
  period: SearchPeriod
  groupBy: SearchOrdersGroupBy
  items: SearchOrderItem[]
  summary: SearchOrdersSummary
}
