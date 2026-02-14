/**
 * TDD Type Safety Tests for Dashboard Metrics
 * Story: null vs undefined Standardization + P&L Restructuring
 *
 * Tests verify that Dashboard types use null for optional fields,
 * NOT undefined. Updated for P&L Narrative layout (16 fields).
 *
 * @see docs/briefs/dashboard-restructuring-v2.md
 */

import { describe, it, expect } from 'vitest'
import type {
  DashboardMetricsGridProps,
  PreviousPeriodData,
  FinanceSummaryData,
} from '../DashboardMetricsGrid'
import type { ExpenseMetricCardProps } from '../ExpenseMetricCard'
import type { LogisticsMetricCardProps } from '../LogisticsMetricCard'

// =============================================================================
// Test Helpers
// =============================================================================

/** Complete PreviousPeriodData with all null values */
const ALL_NULL_PREV: PreviousPeriodData = {
  ordersAmount: null,
  ordersCount: null,
  saleGross: null,
  wbCommissionsTotal: null,
  logisticsCost: null,
  payoutTotal: null,
  storageAcceptanceTotal: null,
  cogsTotal: null,
  advertisingSpend: null,
  grossProfit: null,
  marginPct: null,
  ordersCogs: null,
  salesAmount: null,
  salesCogs: null,
  storageCost: null,
  theoreticalProfit: null,
}

function assertType<T>(_value: T): void {
  // compile-time type checking only
}

// =============================================================================
// PreviousPeriodData Type Tests
// =============================================================================

describe('PreviousPeriodData Type Safety', () => {
  it('accepts null for all fields simultaneously', () => {
    const data: PreviousPeriodData = { ...ALL_NULL_PREV }
    expect(data.ordersAmount).toBeNull()
    expect(data.ordersCount).toBeNull()
    expect(data.saleGross).toBeNull()
    expect(data.wbCommissionsTotal).toBeNull()
    expect(data.payoutTotal).toBeNull()
    expect(data.grossProfit).toBeNull()
    expect(data.marginPct).toBeNull()
  })

  it('accepts number values for all fields', () => {
    const data: PreviousPeriodData = {
      ordersAmount: 100000,
      ordersCount: 50,
      saleGross: 80000,
      wbCommissionsTotal: 12000,
      logisticsCost: 3000,
      payoutTotal: 65000,
      storageAcceptanceTotal: 5000,
      cogsTotal: 40000,
      advertisingSpend: 5000,
      grossProfit: 25000,
      marginPct: 31.2,
      ordersCogs: 50000,
      salesAmount: 80000,
      salesCogs: 40000,
      storageCost: 2000,
      theoreticalProfit: 20000,
    }
    expect(data.ordersAmount).toBe(100000)
    expect(data.grossProfit).toBe(25000)
  })

  it('accepts mixed null and number values', () => {
    const data: PreviousPeriodData = {
      ...ALL_NULL_PREV,
      ordersAmount: 100000,
      advertisingSpend: 5000,
    }
    expect(data.ordersAmount).toBe(100000)
    expect(data.ordersCogs).toBeNull()
  })

  it('has exactly 16 fields', () => {
    const data: PreviousPeriodData = { ...ALL_NULL_PREV }
    const keys = Object.keys(data)
    expect(keys).toHaveLength(16)
    expect(keys).toContain('ordersCount')
    expect(keys).toContain('saleGross')
    expect(keys).toContain('wbCommissionsTotal')
    expect(keys).toContain('payoutTotal')
    expect(keys).toContain('grossProfit')
    expect(keys).toContain('marginPct')
  })
})

// =============================================================================
// FinanceSummaryData Type Tests
// =============================================================================

describe('FinanceSummaryData Type Safety', () => {
  it('accepts null for optional numeric fields', () => {
    const data: FinanceSummaryData = {
      revenue: null,
      logistics_cost: null,
      storage_cost: null,
      sale_gross_total: null,
    }
    expect(data.revenue).toBeNull()
  })

  it('accepts number values', () => {
    const data: FinanceSummaryData = {
      revenue: 1000000,
      logistics_cost: 50000,
      storage_cost: 20000,
      sale_gross_total: 800000,
    }
    expect(data.revenue).toBe(1000000)
  })
})

// =============================================================================
// DashboardMetricsGridProps Type Tests
// =============================================================================

describe('DashboardMetricsGridProps Type Safety', () => {
  it('requires isLoading boolean', () => {
    const props: Pick<DashboardMetricsGridProps, 'isLoading'> = { isLoading: false }
    expect(props.isLoading).toBe(false)
  })

  it('requires error to be Error or null', () => {
    const propsNull: Pick<DashboardMetricsGridProps, 'error'> = { error: null }
    expect(propsNull.error).toBeNull()

    const propsErr: Pick<DashboardMetricsGridProps, 'error'> = { error: new Error('Test') }
    expect(propsErr.error).toBeInstanceOf(Error)
  })

  it('requires productsWithCogs and totalProducts as numbers', () => {
    const props: Pick<DashboardMetricsGridProps, 'productsWithCogs' | 'totalProducts'> = {
      productsWithCogs: 100,
      totalProducts: 500,
    }
    expect(props.productsWithCogs).toBe(100)
  })

  it('accepts undefined for previousPeriodData', () => {
    const props: Pick<DashboardMetricsGridProps, 'previousPeriodData'> = {
      previousPeriodData: undefined,
    }
    expect(props.previousPeriodData).toBeUndefined()
  })

  it('accepts PreviousPeriodData with all null values', () => {
    const props: Pick<DashboardMetricsGridProps, 'previousPeriodData'> = {
      previousPeriodData: { ...ALL_NULL_PREV },
    }
    expect(props.previousPeriodData?.ordersAmount).toBeNull()
  })
})

// =============================================================================
// MetricCard Props Type Tests
// =============================================================================

describe('ExpenseMetricCardProps Type Safety', () => {
  it('accepts null for value and previousValue', () => {
    const props: Pick<ExpenseMetricCardProps, 'value' | 'previousValue'> = {
      value: null,
      previousValue: null,
    }
    expect(props.value).toBeNull()
  })
})

describe('LogisticsMetricCardProps Type Safety', () => {
  it('accepts null for logisticsCost and previousLogisticsCost', () => {
    const props: Pick<LogisticsMetricCardProps, 'logisticsCost' | 'previousLogisticsCost'> = {
      logisticsCost: null,
      previousLogisticsCost: null,
    }
    expect(props.logisticsCost).toBeNull()
  })
})

// =============================================================================
// Compile-Time Type Assertions
// =============================================================================

describe('compile-time type assertions', () => {
  it('PreviousPeriodData fields are number | null', () => {
    const d: PreviousPeriodData = { ...ALL_NULL_PREV }
    assertType<number | null>(d.ordersAmount)
    assertType<number | null>(d.ordersCount)
    assertType<number | null>(d.saleGross)
    assertType<number | null>(d.wbCommissionsTotal)
    assertType<number | null>(d.grossProfit)
    assertType<number | null>(d.marginPct)
    expect(true).toBe(true)
  })
})
