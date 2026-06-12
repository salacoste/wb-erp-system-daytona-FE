/**
 * Advertising Analytics — Epic 37 grouping row types.
 *
 * Request #88 grouped rows are consumed by the merged-groups transformer/table.
 * Kept separate from sync status/query params so response boundary types stay explicit.
 */

export interface MainProduct {
  nmId: number
  vendorCode: string
  name?: string
}

export interface AggregateMetrics {
  totalViews: number
  totalClicks: number
  totalOrders: number
  totalSpend: number
  totalRevenue: number
  totalSales: number
  organicSales: number
  organicContribution: number
  roas: number | null
  roi: number | null
  ctr: number
  cpc: number | null
  conversionRate: number
  profitAfterAds: number
}

export interface MergedGroupProduct {
  nmId: number
  vendorCode: string
  imtId: number | null
  isMainProduct: boolean
  totalViews: number
  totalClicks: number
  totalOrders: number
  totalSpend: number
  totalRevenue: number
  totalSales: number
  organicSales: number
  organicContribution: number
  roas: number | null
  roi: number | null
  ctr: number
  cpc: number | null
  conversionRate: number
  profitAfterAds: number
}

export interface AdvertisingGroup {
  type: 'merged_group' | 'individual'
  imtId: number | null
  mainProduct: MainProduct
  productCount: number
  aggregateMetrics: AggregateMetrics
  products: MergedGroupProduct[]
}
