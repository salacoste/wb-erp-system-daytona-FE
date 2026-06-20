/**
 * Dashboard boundary regression for WB deductions naming cleanup.
 * Locks that WB services stay outside the commission card total on the dashboard path.
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { DashboardMetricsGrid } from '@/components/custom/dashboard/DashboardMetricsGrid'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function createW24LikeProps() {
  return {
    totalOrders: 0,
    ordersRevenue: 0,
    ordersRevenueDiscounted: 0,
    salesCount: 0,
    returnsCount: 0,
    saleGross: 723_537.55,
    wbSalesGross: 0,
    wbReturnsGross: 0,
    commissionSales: 73_196.83,
    acquiringFee: 18_182.01,
    loyaltyFee: 0,
    penaltiesTotal: 226.6,
    wbCommissionAdj: 0,
    wbJamCost: 0,
    wbOtherServicesCost: 456,
    wbPromotionCost: 46_764,
    logisticsCost: 0,
    payoutTotal: 0,
    storageCost: 0,
    paidAcceptanceCost: 0,
    cogsTotal: 0,
    cogsCoverage: 0,
    productsWithCogs: 0,
    totalProducts: 0,
    advertisingSpend: 0,
    advertisingRoas: null,
    grossProfit: 0,
    marginPct: 0,
    previousPeriodData: undefined,
    isLoading: false,
    error: null,
  }
}

describe('Dashboard WB deductions boundary', () => {
  it('keeps WB services outside the commission card total while rendering services separately', () => {
    const { container } = renderWithProviders(<DashboardMetricsGrid {...createW24LikeProps()} />)

    expect(screen.getByText('Комиссия WB (из оборота)')).toBeInTheDocument()
    expect(screen.getByText('Прочие удержания (WB сервисы)')).toBeInTheDocument()

    const text = container.textContent ?? ''
    expect(text).toMatch(/91\s*605,44/) // 73 196,83 + 18 182,01 + 226,60
    expect(text).toMatch(/456/) // WB other services card remains separate from commission card
    expect(text).not.toMatch(/138\s*825,44/) // guards against accidental services double-counting
  })
})
