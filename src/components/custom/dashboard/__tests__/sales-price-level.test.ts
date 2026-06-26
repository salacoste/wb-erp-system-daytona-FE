/**
 * Unit tests for buildSalesPriceLevelRows (TZ-3).
 * Verifies row ordering, inline labels/clarifiers, value wiring (current + previous),
 * and the value-color grouping — so each price level is distinguishable without a tooltip.
 */

import { describe, it, expect } from 'vitest'
import { buildSalesPriceLevelRows } from '../sales-price-level'
import type { DashboardMetricsGridProps } from '../DashboardMetricsGridTypes'

function createProps(
  overrides: Partial<DashboardMetricsGridProps> = {}
): DashboardMetricsGridProps {
  return {
    totalOrders: 100,
    ordersRevenue: 120000,
    ordersRevenueDiscounted: 45600,
    saleGross: 50000,
    wbSalesGross: 90000,
    wbReturnsGross: 10000,
    salesCount: 80,
    returnsCount: 20,
    commissionSales: 3000,
    acquiringFee: 500,
    loyaltyFee: 200,
    penaltiesTotal: 100,
    wbCommissionAdj: 50,
    logisticsCost: 8000,
    payoutTotal: 40000,
    storageCost: 2000,
    paidAcceptanceCost: 500,
    cogsTotal: 15000,
    cogsCoverage: 100,
    productsWithCogs: 20,
    totalProducts: 20,
    advertisingSpend: 5000,
    advertisingRoas: 3.5,
    grossProfit: 20000,
    marginPct: 25,
    previousPeriodData: {
      ordersAmount: 100000,
      ordersCount: 90,
      saleGross: 45000,
      wbCommissionsTotal: 3000,
      logisticsCost: 7000,
      payoutTotal: 38000,
      storageAcceptanceTotal: 1800,
      cogsTotal: 14000,
      advertisingSpend: 4000,
      grossProfit: 18000,
      marginPct: 22,
      ordersCogs: null,
      salesAmount: 85000,
      salesCogs: 14000,
      storageCost: 1800,
      theoreticalProfit: null,
      paidAcceptanceCost: 400,
      wbOtherDeductionsTotal: 60,
    },
    isLoading: false,
    error: null,
    ...overrides,
  }
}

describe('buildSalesPriceLevelRows (TZ-3)', () => {
  it('returns 4 rows in price-chain order with distinguishing labels', () => {
    const rows = buildSalesPriceLevelRows(createProps())
    expect(rows.map(r => r.id)).toEqual([
      'orders-rrc',
      'orders-discounted',
      'buyouts',
      'retail-sales',
    ])
    // Each label distinguishes the price level inline (no tooltip needed).
    expect(rows.map(r => r.label)).toEqual([
      'Заказы по РРЦ',
      'Заказы на карточке',
      'Выкупы',
      'Продажи (розница)',
    ])
  })

  it('wires each current value to the correct source field', () => {
    const rows = buildSalesPriceLevelRows(createProps())
    const byId = Object.fromEntries(rows.map(r => [r.id, r.current]))
    expect(byId['orders-rrc']).toBe(120000) // ordersRevenue
    expect(byId['orders-discounted']).toBe(45600) // ordersRevenueDiscounted
    expect(byId.buyouts).toBe(90000) // wbSalesGross
    expect(byId['retail-sales']).toBe(50000) // saleGross
  })

  it('wires previous values for comparison (discounted card has none)', () => {
    const rows = buildSalesPriceLevelRows(createProps())
    const byId = Object.fromEntries(rows.map(r => [r.id, r.previous]))
    expect(byId['orders-rrc']).toBe(100000) // prev.ordersAmount
    expect(byId['orders-discounted']).toBeUndefined() // no comparison
    expect(byId.buyouts).toBe(85000) // prev.salesAmount
    expect(byId['retail-sales']).toBe(45000) // prev.saleGross
  })

  it('groups value colors: blue for order-price levels, green for revenue', () => {
    const rows = buildSalesPriceLevelRows(createProps())
    const byId = Object.fromEntries(rows.map(r => [r.id, r.valueColor]))
    expect(byId['orders-rrc']).toBe('text-blue-600')
    expect(byId['orders-discounted']).toBe('text-blue-600')
    expect(byId.buyouts).toBe('text-green-600')
    expect(byId['retail-sales']).toBe('text-green-600')
  })

  it('each row carries a non-empty clarifier', () => {
    const rows = buildSalesPriceLevelRows(createProps())
    expect(rows.every(r => r.clarifier.length > 0)).toBe(true)
  })

  it('handles undefined current values (renders — downstream)', () => {
    const rows = buildSalesPriceLevelRows(
      createProps({
        ordersRevenue: undefined,
        wbSalesGross: undefined,
        previousPeriodData: undefined,
      })
    )
    const byId = Object.fromEntries(rows.map(r => [r.id, r.current]))
    expect(byId['orders-rrc']).toBeUndefined()
    expect(byId.buyouts).toBeUndefined()
    // previous undefined across the board
    expect(rows.every(r => r.previous === undefined)).toBe(true)
  })
})
