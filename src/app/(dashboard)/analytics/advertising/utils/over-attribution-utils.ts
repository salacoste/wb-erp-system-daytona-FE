/** Over-Attribution Utils — Story 73.6-FE: detect, filter, recompute for negative organicSales */

import type { AdvertisingItem, AdvertisingSummary } from '@/types/advertising-analytics'

/** Count items with negative organic sales (over-attribution) */
export function countOverAttributionItems(data: AdvertisingItem[]): number {
  return data.filter(item => item.organic_sales < 0).length
}

/** Filter out items with negative organic sales */
export function filterOutOverAttribution(data: AdvertisingItem[]): AdvertisingItem[] {
  return data.filter(item => item.organic_sales >= 0)
}

/** Recompute summary fields from filtered data, preserving non-aggregate fields */
export function recomputeSummary(
  items: AdvertisingItem[],
  original: AdvertisingSummary
): AdvertisingSummary {
  const total_spend = items.reduce((s, i) => s + i.spend, 0)
  const total_revenue = items.reduce((s, i) => s + i.revenue, 0)
  const total_sales = items.reduce((s, i) => s + i.total_sales, 0)
  const total_profit = items.reduce((s, i) => s + i.profit, 0)
  const total_organic_sales = items.reduce((s, i) => s + i.organic_sales, 0)
  const overall_roas = total_spend > 0 ? total_revenue / total_spend : 0
  const overall_roi = total_spend > 0 ? (total_profit - total_spend) / total_spend : 0
  const avg_organic_contribution = total_sales > 0 ? (total_organic_sales / total_sales) * 100 : 0

  return {
    ...original,
    total_spend,
    total_revenue,
    total_sales,
    total_profit,
    total_organic_sales,
    overall_roas,
    overall_roi,
    avg_organic_contribution,
  }
}
