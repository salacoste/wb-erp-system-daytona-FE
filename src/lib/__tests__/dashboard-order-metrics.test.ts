import { describe, expect, it } from 'vitest'
import { resolveDashboardOrderMetrics } from '../dashboard-order-metrics'

describe('resolveDashboardOrderMetrics', () => {
  it('preserves a real zero-order period when finance also has no buyouts', () => {
    expect(
      resolveDashboardOrderMetrics({
        ordersCount: 0,
        ordersRevenue: 0,
        ordersRevenueDiscounted: 0,
        financeBuyoutCount: 0,
      })
    ).toEqual({
      ordersCount: 0,
      ordersRevenue: 0,
      ordersRevenueDiscounted: 0,
    })
  })

  it('does not surface zeroed fulfillment data as 0 orders when finance has buyout activity', () => {
    expect(
      resolveDashboardOrderMetrics({
        ordersCount: 0,
        ordersRevenue: 0,
        ordersRevenueDiscounted: 0,
        financeBuyoutCount: 794,
      })
    ).toEqual({
      ordersCount: undefined,
      ordersRevenue: undefined,
      ordersRevenueDiscounted: undefined,
    })
  })

  it('preserves positive fulfillment order metrics', () => {
    expect(
      resolveDashboardOrderMetrics({
        ordersCount: 1025,
        ordersRevenue: 900000,
        ordersRevenueDiscounted: 700000,
        financeBuyoutCount: 836,
      })
    ).toEqual({
      ordersCount: 1025,
      ordersRevenue: 900000,
      ordersRevenueDiscounted: 700000,
    })
  })
})
