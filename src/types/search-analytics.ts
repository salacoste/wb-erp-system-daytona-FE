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

export type SearchOrderBy =
  | 'totalImpressions'
  | 'totalClicks'
  | 'avgPosition'
  | 'avgCtr'
  | 'totalOrders'
  | 'totalRevenue'

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
  /** Backend hardcodes revenue: 0 in sync processor — handle gracefully in UI */
  totalRevenue: number
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
  /** Backend hardcodes revenue: 0 in sync processor — handle gracefully in UI */
  totalRevenue: number
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
  totalRevenue: number
  /** Present when groupBy='product' */
  vendorCode?: string | null
  /** Present when groupBy='query' or groupBy='day' */
  uniqueProducts?: number
  /** Present when groupBy='product' or groupBy='day' */
  uniqueQueries?: number
}

export interface SearchOrdersSummary {
  totalSearchOrders: number
  totalSearchRevenue: number
  searchOrderShare: number
}

export interface SearchOrdersResponse {
  period: SearchPeriod
  groupBy: SearchOrdersGroupBy
  items: SearchOrderItem[]
  summary: SearchOrdersSummary
}
