import type { UnitEconomicsItem } from '@/types/unit-economics'
import type { UnitEconomicsResponse } from '@/types/unit-economics'
import type { FcuBySkuItem } from '@/lib/api/shipment-cost/fcu-aggregation-api'

/** Sort fields: revenue/net_margin_pct are server-side; delivery_to_warehouse is client-side (Story 77.5) */
export type UeTableSortField = 'revenue' | 'net_margin_pct' | 'delivery_to_warehouse'

/** Nulls-last comparator for delivery_to_warehouse sort (Story 77.5). */
export function deliveryNullsLastSort(
  a: UnitEconomicsItem,
  b: UnitEconomicsItem,
  order: 'asc' | 'desc'
): number {
  const aVal = a.costs_pct.delivery_to_warehouse
  const bVal = b.costs_pct.delivery_to_warehouse
  if (aVal == null && bVal == null) return 0
  if (aVal == null) return 1
  if (bVal == null) return -1
  return order === 'asc' ? aVal - bVal : bVal - aVal
}

/** Compute avg delivery cost per unit and coverage ratio (Story 77.5). */
export function computeDeliveryMetrics(items: UnitEconomicsItem[] | undefined) {
  if (!items?.length)
    return {
      avgDeliveryCost: undefined as number | undefined,
      deliverySkuCount: 0,
      deliveryCoverageRatio: undefined as number | undefined,
    }
  const revenueItems = items.filter(i => i.revenue > 0)
  const withDelivery = revenueItems.filter(
    i => i.costs_rub.delivery_to_warehouse != null && i.units_sold && i.units_sold > 0
  )
  const ratio = revenueItems.length > 0 ? withDelivery.length / revenueItems.length : undefined
  if (withDelivery.length === 0)
    return {
      avgDeliveryCost: undefined as number | undefined,
      deliverySkuCount: 0,
      deliveryCoverageRatio: ratio,
    }
  const sum = withDelivery.reduce(
    (acc, i) => acc + i.costs_rub.delivery_to_warehouse! / i.units_sold!,
    0
  )
  return {
    avgDeliveryCost: sum / withDelivery.length,
    deliverySkuCount: withDelivery.length,
    deliveryCoverageRatio: ratio,
  }
}

/** Merge FCU delivery costs into unit economics items (Story 77.4) */
export function mergeDeliveryCosts(
  ueData: UnitEconomicsResponse,
  fcuItems: FcuBySkuItem[]
): UnitEconomicsResponse {
  const fcuMap = new Map(fcuItems.map(f => [String(f.nmId), f]))
  const merged = ueData.data.map(item => {
    const fcu = fcuMap.get(item.sku_id)
    // M2-2: if no FCU map entry at all, leave item unchanged (latestFcu/Dcu stay undefined per type).
    if (!fcu) return item

    // M2-2: FCU exists — ALWAYS propagate raw values regardless of arithmetic-skip conditions.
    // This preserves the JSDoc invariant: null = backend sent null; undefined = no FCU entry at all.
    // H-1: latestDcu is number | null — null-narrow before arithmetic (CLAUDE.md anti-pattern #8).
    const baseItem = {
      ...item,
      latestFcu: fcu.latestFcu,
      latestDcu: fcu.latestDcu,
    }

    // Skip delivery cost arithmetic when conditions are unsafe or DCU is null.
    if (!item.units_sold || item.revenue <= 0 || fcu.latestDcu == null) {
      return baseItem
    }

    const safeDcu = fcu.latestDcu
    const deliveryRub = safeDcu * item.units_sold
    const deliveryPct = (deliveryRub / item.revenue) * 100
    return {
      ...baseItem,
      costs_rub: { ...item.costs_rub, delivery_to_warehouse: deliveryRub },
      costs_pct: { ...item.costs_pct, delivery_to_warehouse: deliveryPct },
    }
  })
  return { ...ueData, data: merged }
}
