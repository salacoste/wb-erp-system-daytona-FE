import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Table, TableBody, TableRow } from '@/components/ui/table'
import type { SkuFinancialItem, SkuFinancialParity } from '@/types/sku-financials'
import { ParityMetricCells } from '../ParityMetricCells'
import { SkuFinancialsTable } from '../SkuFinancialsTable'

const parityBase: SkuFinancialParity = {
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
}

function renderParity(parity: SkuFinancialParity, showHistoricalSpp = true) {
  return render(
    <Table>
      <TableBody>
        <TableRow>
          <ParityMetricCells parity={parity} showHistoricalSpp={showHistoricalSpp} />
        </TableRow>
      </TableBody>
    </Table>
  )
}

function makeItem(parity: SkuFinancialParity): SkuFinancialItem {
  return {
    nmId: 123,
    productName: 'Исторический товар',
    category: 'Категория',
    brand: 'Бренд',
    quantity: { salesQty: 1, returnsQty: 0 },
    revenue: { gross: 1000, net: 900 },
    costs: {
      cogs: 400,
      logistics: 50,
      storage: 10,
      penalties: 0,
      paidAcceptance: 0,
      otherAdjustments: 0,
    },
    profit: { gross: 500, operating: 440, operatingMarginPct: 48.89 },
    profitabilityStatus: 'excellent',
    missingCogs: false,
    parity,
  }
}

describe('historical SPP rendering', () => {
  it('renders explicit zero distinctly from null using historical report copy', () => {
    renderParity({ ...parityBase, sppRub: 0, sppPct: 0 })

    const rubCell = screen.getByTitle(
      'Фактическое историческое СПП по транзакциям финансового отчёта WB, ₽'
    )
    const pctCell = screen.getByTitle(
      'Фактическое историческое СПП по транзакциям финансового отчёта WB, %'
    )
    expect(rubCell).toHaveTextContent(/^0\s*₽$/)
    expect(pctCell).toHaveTextContent(/^0\s*%$/)
  })

  it('renders unavailable enabled values as em dashes', () => {
    renderParity(parityBase)

    expect(
      screen.getByTitle('Фактическое историческое СПП по транзакциям финансового отчёта WB, ₽')
    ).toHaveTextContent('—')
    expect(
      screen.getByTitle('Фактическое историческое СПП по транзакциям финансового отчёта WB, %')
    ).toHaveTextContent('—')
  })

  it('shows two explicit historical columns only while financial data is enabled', () => {
    const { rerender } = render(
      <SkuFinancialsTable
        data={[makeItem({ ...parityBase, sppRub: 120.5, sppPct: 12.05 })]}
        showHistoricalSpp={true}
      />
    )

    expect(screen.getByRole('columnheader', { name: 'Историческое СПП, ₽' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Историческое СПП, %' })).toBeInTheDocument()
    expect(screen.getByText(/120,5\s*₽/)).toBeInTheDocument()
    expect(screen.getByText(/12,05\s*%/)).toBeInTheDocument()

    rerender(
      <SkuFinancialsTable
        data={[makeItem({ ...parityBase, sppRub: 120.5, sppPct: 12.05 })]}
        showHistoricalSpp={false}
      />
    )

    const table = screen.getByRole('table')
    expect(within(table).queryByRole('columnheader', { name: /Историческое СПП/ })).toBeNull()
    expect(within(table).queryByText(/120,5\s*₽/)).toBeNull()
    expect(within(table).queryByText(/12,05\s*%/)).toBeNull()
  })
})
