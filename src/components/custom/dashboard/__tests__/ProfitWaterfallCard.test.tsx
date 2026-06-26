/**
 * Component test for ProfitWaterfallCard (TZ-2).
 * Verifies the load-bearing wiring: each of the 6 source fields (revenue, cogs, gross,
 * operating, tax, net) plus commissions/margins lands in the expanded breakdown with the
 * correct value, and that the chain Net row agrees with the NetProfitCard lead. Catches
 * re-wiring regressions that the pure-helper test (which takes values as input) cannot.
 */

import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ProfitWaterfallCard } from '../ProfitWaterfallCard'
import type { DashboardMetricsGridProps } from '../DashboardMetricsGridTypes'
import type { TaxMetrics } from '@/types/finance-summary'

const taxMetrics: TaxMetrics = {
  tax_amount: 7500,
  tax_base: 500000,
  effective_tax_rate: 15,
  tax_system: 'usn15',
  is_minimum_rule: false,
  net_profit_after_tax: 41500,
  vat_payer: false,
  vat_rate: null,
  vat_output: null,
  vat_payable: null,
  revenue_excl_vat: null,
  net_profit_after_all_tax: null,
}

function createProps(
  overrides: Partial<DashboardMetricsGridProps> = {}
): DashboardMetricsGridProps {
  return {
    totalOrders: 100,
    ordersRevenue: 120000,
    ordersRevenueDiscounted: 45600,
    saleGross: 100000,
    wbSalesGross: 90000,
    wbReturnsGross: 10000,
    salesCount: 80,
    returnsCount: 20,
    commissionSales: 10000,
    acquiringFee: 500,
    loyaltyFee: 200,
    penaltiesTotal: 100,
    wbCommissionAdj: 50,
    logisticsCost: 8000,
    payoutTotal: 40000,
    storageCost: 2000,
    paidAcceptanceCost: 500,
    cogsTotal: 30000,
    cogsCoverage: 100,
    productsWithCogs: 20,
    totalProducts: 20,
    advertisingSpend: 5000,
    advertisingRoas: 3.5,
    grossProfit: 65000,
    marginPct: 35,
    grossProfitAnalytical: 70000,
    operatingProfitAnalytical: 49000,
    grossMarginPct: 70,
    operatingMarginPct: 41,
    taxMetrics,
    previousPeriodData: undefined,
    isLoading: false,
    error: null,
    ...overrides,
  }
}

/** Digits-only of a row's text — formatCurrency separators/₽ are stripped for robust matching. */
function rowDigits(container: HTMLElement, label: string): string {
  const row = Array.from(container.querySelectorAll('li')).find(li =>
    li.textContent?.includes(label)
  )
  return (row?.textContent ?? '').replace(/\D/g, '')
}

describe('ProfitWaterfallCard (TZ-2)', () => {
  it('renders the NetProfit lead + a collapsed breakdown by default', () => {
    const { container } = renderWithProviders(<ProfitWaterfallCard {...createProps()} />)
    // Lead NetProfitCard is always visible.
    expect(screen.getByRole('article', { name: /чистая прибыль/i })).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: /структура прибыли/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    // Breakdown region exists but is hidden.
    const detail = container.querySelector('#profit-waterfall-detail')
    expect(detail).toHaveAttribute('hidden')
  })

  it('wires each P&L source field into the expanded breakdown with the correct value', () => {
    const { container } = renderWithProviders(<ProfitWaterfallCard {...createProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /структура прибыли/i }))

    expect(rowDigits(container, 'Выручка')).toBe('100000')
    expect(rowDigits(container, 'Себестоимость')).toBe('30000')
    expect(rowDigits(container, 'Валовая прибыль')).toBe('70000')
    expect(rowDigits(container, 'Логистика')).toBe('8000')
    expect(rowDigits(container, 'Хранение')).toBe('2000')
    // Commissions = 10000 + 500 + 200 + 100 + 50 = 10850
    expect(rowDigits(container, 'Комиссии WB')).toBe('10850')
    expect(rowDigits(container, 'Операционная прибыль')).toBe('49000')
    expect(rowDigits(container, 'Налог')).toBe('7500')
    // Net mirrors getNetProfit → net_profit_after_tax (41500)
    expect(rowDigits(container, 'Чистая прибыль')).toBe('41500')
    // Margin percentages (formatPercentage renders 1 decimal: 70 → "70,0 %" → digits "700")
    expect(rowDigits(container, 'Валовая маржа')).toBe('700')
    expect(rowDigits(container, 'Маржа')).toBe('410')
  })

  it('keeps the chain Net row in agreement with the NetProfit lead', () => {
    const { container } = renderWithProviders(<ProfitWaterfallCard {...createProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /структура прибыли/i }))
    const lead = screen.getByRole('article', { name: /чистая прибыль/i })
    const leadDigits = (lead.textContent ?? '').replace(/\D/g, '')
    // Both the lead headline and the chain 'net' row carry the same 41500.
    expect(leadDigits).toContain('41500')
    expect(rowDigits(container, 'Чистая прибыль')).toBe('41500')
  })

  it('falls back to operating profit for Net when tax is not configured', () => {
    const { container } = renderWithProviders(
      <ProfitWaterfallCard {...createProps({ taxMetrics: null })} />
    )
    fireEvent.click(screen.getByRole('button', { name: /структура прибыли/i }))
    // No tax → getNetProfit returns operating profit (49000) pre-tax.
    expect(rowDigits(container, 'Чистая прибыль')).toBe('49000')
    // Tax row has no value.
    expect(rowDigits(container, 'Налог')).toBe('')
  })
})
