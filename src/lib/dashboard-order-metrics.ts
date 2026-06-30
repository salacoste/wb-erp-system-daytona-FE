export interface DashboardOrderMetricInput {
  ordersCount: number | null | undefined
  ordersRevenue: number | null | undefined
  ordersRevenueDiscounted: number | null | undefined
  financeBuyoutCount: number | null | undefined
}

export interface DashboardOrderMetrics {
  ordersCount: number | undefined
  ordersRevenue: number | undefined
  ordersRevenueDiscounted: number | undefined
}

function hasBuyoutActivity(financeBuyoutCount: number | null | undefined): boolean {
  return financeBuyoutCount != null && financeBuyoutCount > 0
}

function isZeroOrdersSlice(input: DashboardOrderMetricInput): boolean {
  return (
    input.ordersCount === 0 &&
    (input.ordersRevenue ?? 0) === 0 &&
    (input.ordersRevenueDiscounted ?? 0) === 0
  )
}

/**
 * Fulfillment/order analytics can legitimately be unavailable for a historical period while the
 * weekly finance report is present. In that case the fulfillment endpoint currently returns a
 * zeroed order slice. Do not surface that as "0 orders": it is missing order data, not proof that
 * no customers ordered anything.
 */
export function resolveDashboardOrderMetrics(
  input: DashboardOrderMetricInput
): DashboardOrderMetrics {
  if (isZeroOrdersSlice(input) && hasBuyoutActivity(input.financeBuyoutCount)) {
    return {
      ordersCount: undefined,
      ordersRevenue: undefined,
      ordersRevenueDiscounted: undefined,
    }
  }

  return {
    ordersCount: input.ordersCount ?? undefined,
    ordersRevenue: input.ordersRevenue ?? undefined,
    ordersRevenueDiscounted: input.ordersRevenueDiscounted ?? undefined,
  }
}
