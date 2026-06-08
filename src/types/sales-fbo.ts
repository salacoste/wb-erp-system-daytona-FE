/**
 * FBO Sales Types
 * Extracted from orders-fbo.ts for 200-line cap compliance.
 *
 * Endpoints:
 *   GET  /v1/sales/fbo            — FBO sales list
 *   GET  /v1/sales/fbo/aggregate  — FBO sales aggregation
 */

import type { FboOrdersPagination, FboAggregateDateRange } from './orders-fbo'

// =============================================================================
// FBO Sales
// =============================================================================

/** Single FBO sale row */
export interface SaleFboItem {
  /** Internal UUID */
  id: string
  /** SR ID */
  srid: string
  /** Order detail ID */
  odid: number
  /** WB Article (SKU) */
  nmId: number
  /** Supplier article code */
  supplierArticle: string
  /** Brand name */
  brand: string
  /** Product subject / name */
  subject: string
  /** Product category */
  category: string | null
  /** Final sale price (RUB) */
  finishedPrice: number
  /** Amount for payment to seller (RUB) */
  forPay: number
  /** Whether this is a storno (reversal) record */
  isStorno: boolean
  /** Sale date */
  saleDate: string
  /** Warehouse name */
  warehouseName: string
  /** Region name */
  regionName: string | null
  /** Record creation timestamp */
  createdAt: string
}

/** Response from GET /v1/sales/fbo */
export interface SalesFboListResponse {
  items: SaleFboItem[]
  pagination: FboOrdersPagination
}

/** Response from GET /v1/sales/fbo/aggregate */
export interface SalesFboAggregateResponse {
  /** Total sales count */
  count: number
  /** Sum of finishedPrice (RUB) */
  totalFinishedPrice: number
  /** Sum of forPay (RUB) */
  totalForPay: number
  /** Count of returns (storno records) */
  returnsCount: number
  /** Revenue lost to returns (RUB) */
  returnsRevenue: number | null
  /** Return rate (0-100) */
  returnRate: number | null
  /** Average sale value (RUB) */
  avgSaleValue: number | null
  /** Date range of the aggregation */
  dateRange: FboAggregateDateRange
}
