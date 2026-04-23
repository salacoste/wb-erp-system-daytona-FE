/**
 * Tests for AcquiringTransactionsTable
 * Epic 90-FE Story 90.3: Acquiring Report Detail View
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { AcquiringTransactionsTable, sortTransactions } from '../AcquiringTransactionsTable'
import type { AcquiringReportDetailItem } from '@/types/acquiring-analytics'

const makeTransaction = (
  overrides: Partial<AcquiringReportDetailItem> & { rrdId: number }
): AcquiringReportDetailItem => ({
  reportId: 100,
  acqDate: '2026-04-10',
  acquiringBank: 'Sberbank',
  saleDate: '2026-04-08',
  srid: 'SR-001',
  docTypeName: 'Продажа',
  nmId: 12345678,
  retailAmount: 5000,
  acquiringFee: 150,
  acquiringFeeVat: 25,
  currency: 'RUB',
  ...overrides,
})

const tx1 = makeTransaction({ rrdId: 1, acqDate: '2026-04-10', acquiringFee: 150 })
const tx2 = makeTransaction({
  rrdId: 2,
  acqDate: '2026-04-08',
  acquiringFee: 50,
  srid: 'SR-002',
})
const tx3 = makeTransaction({
  rrdId: 3,
  acqDate: '2026-04-12',
  acquiringFee: 300,
  srid: 'SR-003',
})

describe('AcquiringTransactionsTable', () => {
  it('renders all 9 column headers', () => {
    renderWithProviders(<AcquiringTransactionsTable transactions={[tx1]} />)
    expect(screen.getByText('Дата комиссии')).toBeInTheDocument()
    expect(screen.getByText('Дата продажи')).toBeInTheDocument()
    expect(screen.getByText('Банк')).toBeInTheDocument()
    expect(screen.getByText('SRID')).toBeInTheDocument()
    expect(screen.getByText('Тип')).toBeInTheDocument()
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText('Сумма')).toBeInTheDocument()
    expect(screen.getByText('Комиссия')).toBeInTheDocument()
    expect(screen.getByText('НДС')).toBeInTheDocument()
  })

  it('default sort is acqDate descending — newest row first', () => {
    renderWithProviders(<AcquiringTransactionsTable transactions={[tx1, tx2, tx3]} />)
    const rows = screen.getAllByRole('row')
    // Header is row[0]; data rows start at row[1]
    expect(rows[1]).toHaveTextContent('SR-003') // acqDate 2026-04-12 — newest
    expect(rows[2]).toHaveTextContent('SR-001') // acqDate 2026-04-10
    expect(rows[3]).toHaveTextContent('SR-002') // acqDate 2026-04-08 — oldest
  })

  it('clicking Комиссия column toggles sort asc/desc', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AcquiringTransactionsTable transactions={[tx1, tx2, tx3]} />)

    // Click once → ascending by fee (new field → asc: 50, 150, 300)
    await user.click(screen.getByText('Комиссия'))
    let rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('SR-002') // fee=50
    expect(rows[2]).toHaveTextContent('SR-001') // fee=150
    expect(rows[3]).toHaveTextContent('SR-003') // fee=300

    // Click again → descending (300, 150, 50)
    await user.click(screen.getByText('Комиссия'))
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('SR-003') // fee=300
    expect(rows[2]).toHaveTextContent('SR-001') // fee=150
    expect(rows[3]).toHaveTextContent('SR-002') // fee=50
  })

  it('null retailAmount renders as — in table cell', () => {
    const nullAmountTx = makeTransaction({ rrdId: 10, retailAmount: null })
    renderWithProviders(<AcquiringTransactionsTable transactions={[nullAmountTx]} />)
    const cells = screen.getAllByRole('cell')
    // Column order: acqDate(0), saleDate(1), bank(2), srid(3), type(4), nmId(5), retailAmount(6)
    expect(cells[6]).toHaveTextContent('—')
  })

  it('anomaly indicator visible when acquiringFeeVat > acquiringFee', () => {
    const anomalyTx = makeTransaction({
      rrdId: 20,
      acquiringFee: 100,
      acquiringFeeVat: 500, // VAT > fee → anomaly
    })
    renderWithProviders(<AcquiringTransactionsTable transactions={[anomalyTx]} />)
    expect(screen.getByLabelText('Аномалия: НДС выше суммы комиссии')).toBeInTheDocument()
  })

  it('no anomaly indicator when acquiringFeeVat <= acquiringFee', () => {
    renderWithProviders(<AcquiringTransactionsTable transactions={[tx1]} />)
    // tx1: fee=150, vat=25 — no anomaly
    expect(screen.queryByLabelText('Аномалия: НДС выше суммы комиссии')).not.toBeInTheDocument()
  })
})

describe('sortTransactions (pure function)', () => {
  it('sorts nulls last regardless of sort direction', () => {
    const nullFeeTx = makeTransaction({ rrdId: 99, acquiringFee: null, srid: 'SR-NULL' })
    const asc = sortTransactions([nullFeeTx, tx2, tx1], 'acquiringFee', 'asc')
    expect(asc[asc.length - 1].srid).toBe('SR-NULL')
    const desc = sortTransactions([nullFeeTx, tx2, tx1], 'acquiringFee', 'desc')
    expect(desc[desc.length - 1].srid).toBe('SR-NULL')
  })
})
