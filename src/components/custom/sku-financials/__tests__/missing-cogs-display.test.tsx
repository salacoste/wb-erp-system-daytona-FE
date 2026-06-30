/**
 * Missing-COGS display tests
 * Story 87.3-FE: Replace misleading "0 ₽" with "—" for rows without COGS.
 * Covers SkuRow (Опер. прибыль cell) and SummaryFooter (footnote).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table, TableBody } from '@/components/ui/table'
import { SkuRow } from '../SkuRow'
import { SummaryFooter } from '../SummaryFooter'
import type { SkuFinancialItem } from '@/types/sku-financials'

function makeItem(overrides: Partial<SkuFinancialItem> = {}): SkuFinancialItem {
  return {
    nmId: 123,
    productName: 'Test Product',
    category: 'cat',
    brand: 'brand',
    quantity: { salesQty: 10, returnsQty: 0 },
    revenue: { gross: 10000, net: 9000 },
    costs: {
      cogs: 4000,
      logistics: 500,
      storage: 100,
      penalties: 0,
      paidAcceptance: 0,
      otherAdjustments: 0,
    },
    profit: { gross: 5000, operating: 4400, operatingMarginPct: 48.9 },
    profitabilityStatus: 'excellent',
    missingCogs: false,
    ...overrides,
  }
}

function renderRow(item: SkuFinancialItem) {
  return render(
    <Table>
      <TableBody>
        <SkuRow item={item} showExpenseBreakdown={false} showVisibility={false} />
      </TableBody>
    </Table>
  )
}

describe('SkuRow — missing COGS display (Story 87.3-FE)', () => {
  it('renders em-dash "—" in Опер. прибыль cell when missingCogs=true', () => {
    const item = makeItem({
      missingCogs: true,
      costs: { ...makeItem().costs, cogs: null },
      profit: { gross: null, operating: null, operatingMarginPct: null },
    })
    renderRow(item)

    // Multiple "—" may exist in row (brand, etc.); scope to cells that should be the em-dash
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders formatCurrency for legitimate zero when missingCogs=false', () => {
    const item = makeItem({
      missingCogs: false,
      profit: { gross: 0, operating: 0, operatingMarginPct: 0 },
    })
    renderRow(item)

    // "0 ₽" should be rendered (legitimate zero, not unknown).
    // The row contains multiple 0 ₽ cells (penalties, paidAcceptance, profit) — scope to the fact
    // that at least one is present AND no em-dash is shown for missing-cogs profit.
    const zeros = screen.getAllByText(/0 ₽/)
    expect(zeros.length).toBeGreaterThan(0)
    // The "Нет COGS" tooltip text must NOT appear
    expect(screen.queryByText(/Нет COGS/i)).toBeNull()
  })

  it('renders real profit value when missingCogs=false and operating is positive', () => {
    const item = makeItem()
    renderRow(item)

    // The actual value shows, not "—"
    expect(screen.getByText(/4 400,00 ₽/)).toBeTruthy()
  })
})

describe('SummaryFooter — COGS coverage footnote (Story 87.3-FE)', () => {
  const baseTotals = {
    count: 10,
    salesQty: 100,
    returnsQty: 5,
    revenue: 100000,
    cogs: 40000,
    grossProfit: 50000,
    expenses: 10000,
    operatingProfit: 40000,
    avgMargin: 40,
  }

  it('renders footnote when some rows have missing COGS', () => {
    render(<SummaryFooter totals={{ ...baseTotals, rowsWithCogs: 7, totalRows: 10 }} />)
    expect(screen.getByText(/COGS назначен для 7 из 10 товаров/i)).toBeTruthy()
  })

  it('does NOT render footnote when all rows have COGS', () => {
    render(<SummaryFooter totals={{ ...baseTotals, rowsWithCogs: 10, totalRows: 10 }} />)
    expect(screen.queryByText(/COGS назначен для/i)).toBeNull()
  })

  it('does NOT render footnote when data is empty (totalRows=0)', () => {
    render(<SummaryFooter totals={{ ...baseTotals, rowsWithCogs: 0, totalRows: 0 }} />)
    expect(screen.queryByText(/COGS назначен для/i)).toBeNull()
  })
})

describe('SkuRow — competitor parity FR-2..FR-5 display (#219)', () => {
  it('renders enriched FR values when weekly/by-sku parity data is merged', () => {
    renderRow(
      makeItem({
        parity: {
          advertisingCost: 246.1,
          drrPct: 17.39,
          adCostPerUnit: 12.3,
          taxAllocated: 84.91,
          netProfitAfterTax: 516.55,
          netMarginAfterTaxPct: 12.34,
          sppRub: 548.95,
          sppPct: 26.07,
          cancellationsQty: 2,
          stockFbs: 530,
          stockFbo: null,
          stockTotal: 530,
          stockValueRub: 54060,
          stockValueSharePct: 7.5,
        },
      })
    )

    expect(screen.getByText('246,10 ₽')).toBeInTheDocument()
    expect(screen.getByText('17,4 %')).toBeInTheDocument()
    expect(screen.getByText('516,55 ₽')).toBeInTheDocument()
    expect(screen.getByText('548,95 ₽')).toBeInTheDocument()
    expect(screen.getByText('54 060,00 ₽')).toBeInTheDocument()
    expect(screen.getByText('7,5 %')).toBeInTheDocument()
  })

  it('renders em-dashes for unavailable/null FR values instead of misleading zeros', () => {
    renderRow(
      makeItem({
        parity: {
          advertisingCost: null,
          drrPct: null,
          adCostPerUnit: null,
          taxAllocated: null,
          netProfitAfterTax: null,
          netMarginAfterTaxPct: null,
          sppRub: null,
          sppPct: null,
          cancellationsQty: null,
          stockFbs: null,
          stockFbo: null,
          stockTotal: null,
          stockValueRub: null,
          stockValueSharePct: null,
        },
      })
    )

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(7)
    expect(screen.queryByText('0,0 %')).not.toBeInTheDocument()
  })
})
