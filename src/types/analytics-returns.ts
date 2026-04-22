/**
 * Types for Epic 70-FE: Returns Analytics
 * Split from analytics-epics-68-71.ts for 200-line limit
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md (labels these as Epic 71)
 * Canonical spec: docs/epics/epic-70-fe-returns-analytics.md
 */

import type { TrendDirection } from './analytics-buyout'

export type ReturnCategory = 'cancel_before_shipment' | 'refusal_at_pvz' | 'return_after_receipt'

export interface ReturnCategoryItem {
  category: ReturnCategory
  displayName: string
  count: number
  percentage: number
  trend: TrendDirection
  trendDelta: number
}

export interface ReturnReasonsResponse {
  summary: {
    totalReturns: number
    cancelBeforeShipment: number
    refusalAtPvz: number
    returnAfterReceipt: number
    overallReturnRate: number
    classificationCoverage: number
  }
  byCategory: ReturnCategoryItem[]
  period: { from: string; to: string }
}

/** Per-SKU return item with breakdown and anomaly flag */
export interface BySkuReturnItem {
  nmId: number
  productName: string
  brand: string
  /** Number of sales for this SKU (Story 71.7 — used for returnRate calculation) */
  salesCount?: number
  totalReturns: number
  returnRate: number
  cancelBeforeShipment: number
  refusalAtPvz: number
  returnAfterReceipt: number
  anomalyFlag: boolean
}

/** Response from GET /v1/analytics/returns/reasons/by-sku */
export interface BySkuReturnResponse {
  data: BySkuReturnItem[]
  pagination: { count: number; hasMore: boolean; nextCursor?: string }
  summary: { totalSkus: number; anomalyCount: number }
}

/** Query params for GET /v1/analytics/returns/reasons/by-sku */
export interface ReturnsBySkuParams {
  from?: string
  to?: string
  nmId?: number
  anomalyOnly?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  cursor?: string
}
