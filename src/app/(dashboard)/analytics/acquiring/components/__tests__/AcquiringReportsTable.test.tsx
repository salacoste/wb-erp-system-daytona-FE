/**
 * Tests for AcquiringReportsTable
 * Story 90.2-FE: Acquiring Reports List Page
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { AcquiringReportsTable, sortItems } from '../AcquiringReportsTable'
import type { AcquiringReportListItem } from '@/types/acquiring-analytics'

const baseItem: AcquiringReportListItem = {
  reportId: 100,
  sellerFinanceName: 'Test Seller',
  dateFrom: '2026-04-01',
  dateTo: '2026-04-07',
  createDate: '2026-04-08',
  currency: 'RUB',
  acquiringFeeSum: 1000,
  acquiringFeeVatSum: 200,
}

const item2: AcquiringReportListItem = {
  ...baseItem,
  reportId: 200,
  dateFrom: '2026-03-01',
  dateTo: '2026-03-07',
  createDate: '2026-03-08',
  acquiringFeeSum: 500,
  acquiringFeeVatSum: 100,
}

const item3: AcquiringReportListItem = {
  ...baseItem,
  reportId: 300,
  dateFrom: '2026-02-01',
  dateTo: '2026-02-07',
  createDate: '2026-02-08',
  acquiringFeeSum: 2000,
  acquiringFeeVatSum: 400,
}

describe('AcquiringReportsTable', () => {
  it('renders all 6 column headers', () => {
    renderWithProviders(<AcquiringReportsTable items={[baseItem]} />)
    expect(screen.getByText('ID отчёта')).toBeInTheDocument()
    expect(screen.getByText('Период')).toBeInTheDocument()
    expect(screen.getByText('Создан')).toBeInTheDocument()
    expect(screen.getByText('Комиссия')).toBeInTheDocument()
    expect(screen.getByText('НДС')).toBeInTheDocument()
    expect(screen.getByText('Подробнее')).toBeInTheDocument()
  })

  it('default sort is createDate descending — newest row first', () => {
    renderWithProviders(<AcquiringReportsTable items={[item2, item3, baseItem]} />)
    const rows = screen.getAllByRole('row')
    // Header is row[0]; data rows start at row[1]
    expect(rows[1]).toHaveTextContent('100') // createDate 2026-04-08 — newest
    expect(rows[2]).toHaveTextContent('200') // createDate 2026-03-08
    expect(rows[3]).toHaveTextContent('300') // createDate 2026-02-08 — oldest
  })

  it('clicking Комиссия header sorts by acquiringFeeSum ascending then descending', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AcquiringReportsTable items={[item2, item3, baseItem]} />)

    // Click once → ascending by fee (500, 1000, 2000)
    await user.click(screen.getByText('Комиссия'))
    let rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('200') // 500
    expect(rows[2]).toHaveTextContent('100') // 1000
    expect(rows[3]).toHaveTextContent('300') // 2000

    // Click again → descending (2000, 1000, 500)
    await user.click(screen.getByText('Комиссия'))
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('300') // 2000
    expect(rows[2]).toHaveTextContent('100') // 1000
    expect(rows[3]).toHaveTextContent('200') // 500
  })

  it('null acquiringFeeSum renders as — in table cell', () => {
    const nullFeeItem: AcquiringReportListItem = { ...baseItem, acquiringFeeSum: null }
    renderWithProviders(<AcquiringReportsTable items={[nullFeeItem]} />)
    // The em-dash should appear in the fee cell
    const cells = screen.getAllByRole('cell')
    // Cell index 3 is Комиссия (0=ID, 1=Период, 2=Создан, 3=Комиссия, 4=НДС, 5=Подробнее)
    expect(cells[3]).toHaveTextContent('—')
  })

  it('anomaly indicator visible when acquiringFeeVatSum > acquiringFeeSum', () => {
    const anomalyItem: AcquiringReportListItem = {
      ...baseItem,
      acquiringFeeSum: 100,
      acquiringFeeVatSum: 500, // VAT > fee → anomaly
    }
    // renderWithProviders includes TooltipProvider required by the anomaly Tooltip
    renderWithProviders(<AcquiringReportsTable items={[anomalyItem]} />)
    expect(screen.getByLabelText('Аномалия: НДС выше суммы комиссии')).toBeInTheDocument()
  })

  it('no anomaly indicator when acquiringFeeVatSum <= acquiringFeeSum', () => {
    renderWithProviders(<AcquiringReportsTable items={[baseItem]} />)
    // baseItem: fee=1000, vat=200 — no anomaly
    expect(screen.queryByLabelText('Аномалия: НДС выше суммы комиссии')).not.toBeInTheDocument()
  })

  it('empty items renders table shell without data rows', () => {
    renderWithProviders(<AcquiringReportsTable items={[]} />)
    expect(screen.getByText('ID отчёта')).toBeInTheDocument()
    // Only 1 row — the header row
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1)
  })

  it('sorts by reportId ascending correctly (numeric, not lexicographic)', async () => {
    const user = userEvent.setup()
    const items: AcquiringReportListItem[] = [
      { ...baseItem, reportId: 5, createDate: '2026-04-01' },
      { ...baseItem, reportId: 100, createDate: '2026-04-01' },
      { ...baseItem, reportId: 20, createDate: '2026-04-01' },
    ]
    renderWithProviders(<AcquiringReportsTable items={items} />)
    const idHeader = screen.getByText('ID отчёта')
    // Click once → ascending (new field, so first click → asc)
    await user.click(idHeader)
    const rows = screen.getAllByRole('row').slice(1) // skip header
    // Numeric sort: 5, 20, 100 — not lexicographic 100, 20, 5
    expect(rows[0]).toHaveTextContent('5')
    expect(rows[1]).toHaveTextContent('20')
    expect(rows[2]).toHaveTextContent('100')
  })

  it('sorts by dateFrom correctly across year boundary (default createDate desc)', () => {
    const items: AcquiringReportListItem[] = [
      { ...baseItem, reportId: 1, dateFrom: '2026-01-05', createDate: '2026-01-10' },
      { ...baseItem, reportId: 2, dateFrom: '2025-12-28', createDate: '2026-01-05' },
      { ...baseItem, reportId: 3, dateFrom: '2026-02-01', createDate: '2026-02-05' },
    ]
    renderWithProviders(<AcquiringReportsTable items={items} />)
    // Default sort is createDate desc
    const rows = screen.getAllByRole('row').slice(1) // skip header
    expect(rows[0]).toHaveTextContent('3') // createDate 2026-02-05 — newest
    expect(rows[1]).toHaveTextContent('1') // createDate 2026-01-10
    expect(rows[2]).toHaveTextContent('2') // createDate 2026-01-05 — oldest
  })
})

describe('sortItems (pure function)', () => {
  it('sorts nulls last regardless of sort order', () => {
    const nullItem: AcquiringReportListItem = { ...baseItem, reportId: 999, acquiringFeeSum: null }
    const asc = sortItems([nullItem, item2, baseItem], 'acquiringFeeSum', 'asc')
    expect(asc[asc.length - 1].reportId).toBe(999)
    const desc = sortItems([nullItem, item2, baseItem], 'acquiringFeeSum', 'desc')
    expect(desc[desc.length - 1].reportId).toBe(999)
  })
})
