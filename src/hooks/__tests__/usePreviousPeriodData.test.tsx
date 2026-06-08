/**
 * Tests for usePreviousPeriodData hook
 * Dashboard previous period comparison calculations
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePreviousPeriodData } from '../usePreviousPeriodData'
import type { FinanceSummary } from '@/types/finance-summary'
import type { FulfillmentSummaryResponse } from '@/types/fulfillment'

function makeSummary(overrides: Partial<FinanceSummary> = {}): FinanceSummary {
  return {
    sale_gross_total: 100000,
    payout_total: 60000,
    gross_profit: 25000,
    margin_pct: 25,
    logistics_cost_total: 5000,
    storage_cost_total: 2000,
    paid_acceptance_cost_total: 1000,
    cogs_total: 30000,
    wb_promotion_cost_total: 800,
    commission_sales_total: 10000,
    acquiring_fee_total: 500,
    loyalty_fee_total: 300,
    penalties_total: 200,
    wb_commission_adj_total: 150,
    wb_jam_cost_total: 100,
    wb_other_services_cost_total: 50,
    gross_profit_analytical: 22000,
    operating_profit_analytical: 18000,
    gross_margin_pct: 22,
    operating_margin_pct: 18,
    wb_sales_gross_total: 95000,
    ...overrides,
  } as FinanceSummary
}

function makeFulfillment(overrides = {}): FulfillmentSummaryResponse {
  return {
    summary: {
      total: { ordersCount: 100, ordersRevenue: 500000, ...overrides },
    },
  } as FulfillmentSummaryResponse
}

describe('usePreviousPeriodData', () => {
  it('returns undefined when all params are null/undefined', () => {
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: null,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current).toBeUndefined()
  })

  it('returns data when prevSummary is provided', () => {
    const summary = makeSummary()
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: summary,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current).toBeDefined()
    expect(result.current?.saleGross).toBe(100000)
    expect(result.current?.payoutTotal).toBe(60000)
    expect(result.current?.grossProfit).toBe(25000)
  })

  it('extracts fulfillment data', () => {
    const fulfillment = makeFulfillment({ ordersCount: 50, ordersRevenue: 250000 })
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: null,
        fulfillmentPrevious: fulfillment,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current).toBeDefined()
    expect(result.current?.ordersCount).toBe(50)
    expect(result.current?.ordersAmount).toBe(250000)
  })

  it('extracts advertising spend', () => {
    const advertisingPrevious = { summary: { total_spend: 5000 } }
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: null,
        fulfillmentPrevious: undefined,
        advertisingPrevious,
      })
    )
    expect(result.current).toBeDefined()
    expect(result.current?.advertisingSpend).toBe(5000)
  })

  it('computes wbCommissionsTotal from commission fields', () => {
    const summary = makeSummary({
      commission_sales_total: 10000,
      acquiring_fee_total: 500,
      loyalty_fee_total: 300,
      penalties_total: 200,
      wb_commission_adj_total: 150,
    })
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: summary,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current?.wbCommissionsTotal).toBe(11150)
  })

  it('sets wbCommissionsTotal to null when no commission fields', () => {
    const summary = {} as FinanceSummary
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: summary,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current?.wbCommissionsTotal).toBeNull()
  })

  it('computes storageAcceptanceTotal', () => {
    const summary = makeSummary({
      storage_cost_total: 2000,
      paid_acceptance_cost_total: 1000,
    })
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: summary,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current?.storageAcceptanceTotal).toBe(3000)
  })

  it('computes wbOtherDeductionsTotal from jam + other services', () => {
    const summary = makeSummary({
      wb_jam_cost_total: 100,
      wb_other_services_cost_total: 50,
    })
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: summary,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current?.wbOtherDeductionsTotal).toBe(150)
  })

  it('includes analytical profit metrics', () => {
    const summary = makeSummary()
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: summary,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current?.grossProfitAnalytical).toBe(22000)
    expect(result.current?.operatingProfitAnalytical).toBe(18000)
    expect(result.current?.grossMarginPct).toBe(22)
    expect(result.current?.operatingMarginPct).toBe(18)
  })

  it('sets legacy fields for backward compatibility', () => {
    const summary = makeSummary()
    const { result } = renderHook(() =>
      usePreviousPeriodData({
        prevSummary: summary,
        fulfillmentPrevious: undefined,
        advertisingPrevious: undefined,
      })
    )
    expect(result.current?.ordersCogs).toBeNull()
    expect(result.current?.theoreticalProfit).toBeNull()
    expect(result.current?.salesAmount).toBe(95000)
  })
})
