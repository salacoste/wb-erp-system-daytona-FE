/**
 * Search Position Trends types
 * Backend: commit 3f29d8ca (2026-06-07)
 *
 * Four endpoints:
 *   GET /v1/analytics/search/position/trends       — week-over-week movers + page-one candidates
 *   GET /v1/analytics/search/position-movers        — rolling N-day period movers
 *   GET /v1/analytics/search/page-one-opportunities — SKUs close to page 1
 *   GET /v1/analytics/search/position-history/:nmId — daily position history for one SKU
 */

// --- Union Types ---

export type TrendDirection = 'improving' | 'declining' | 'stable'
export type PositionMoverPeriod = '7d' | '14d' | '30d'
export type TrendsFilterDirection = 'improving' | 'declining' | 'all'

// --- Endpoint 1: Position Trends (week-over-week) ---

export interface PositionTrendsParams {
  direction?: TrendsFilterDirection
  limit?: number
  min_queries?: number
}

export interface PositionTrendMover {
  nmId: number
  currentAvgPosition: number
  previousAvgPosition: number
  positionChange: number
  trend: TrendDirection
  totalQueries: number
  totalImpressions: number
  topQuery?: string
}

export interface CloseToPageOneItem {
  nmId: number
  currentAvgPosition: number
  positionsAway: number
  totalImpressions: number
  totalQueries: number
  topQuery?: string
}

export interface PositionTrendsSummary {
  improvingCount: number
  decliningCount: number
  stableCount: number
  closeToPageOneCount: number
  totalSkusAnalyzed: number
  currentWeekStart: string
  previousWeekStart: string
}

export interface PositionTrendsResponse {
  movers: PositionTrendMover[]
  closeToPageOne: CloseToPageOneItem[]
  summary: PositionTrendsSummary
}

// --- Endpoint 2: Position Movers (rolling period) ---

export interface PositionMoversParams {
  period?: PositionMoverPeriod
}

export interface PositionMoverItem {
  nmId: number
  vendorCode: string | null
  productName: string | null
  currentPosition: number
  previousPosition: number
  positionDelta: number
  query: string | null
}

export interface PositionMoversResponse {
  movers: PositionMoverItem[]
  period: string
}

// --- Endpoint 3: Page One Opportunities ---

export interface PageOneOpportunityItem {
  nmId: number
  vendorCode: string | null
  currentPosition: number
  query: string | null
  avgImpressions: number
  avgClicks: number
}

export interface PageOneOpportunitiesResponse {
  opportunities: PageOneOpportunityItem[]
}

// --- Endpoint 4: Position History (per-SKU) ---

export interface PositionHistoryParams {
  days?: number
}

export interface PositionHistoryPoint {
  date: string
  avgPosition: number
  impressions: number
  clicks: number
  ctr: number
}

export interface PositionHistoryResponse {
  nmId: number
  history: PositionHistoryPoint[]
  days: number
}
