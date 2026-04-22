/**
 * Tests for AcquiringSummaryCards
 * Story 90.2-FE: Acquiring Reports List Page
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AcquiringSummaryCards, pluralizeReports } from '../AcquiringSummaryCards'
import type { AcquiringReportListItem } from '@/types/acquiring-analytics'

const makeItem = (
  overrides: Partial<AcquiringReportListItem> & { reportId: number }
): AcquiringReportListItem => ({
  sellerFinanceName: 'Seller',
  dateFrom: '2026-04-01',
  dateTo: '2026-04-07',
  createDate: '2026-04-08',
  currency: 'RUB',
  acquiringFeeSum: 1000,
  acquiringFeeVatSum: 200,
  ...overrides,
})

describe('pluralizeReports', () => {
  it('returns "отчёт" for n=1', () => {
    expect(pluralizeReports(1)).toBe('отчёт')
  })

  it('returns "отчёта" for n=2', () => {
    expect(pluralizeReports(2)).toBe('отчёта')
  })

  it('returns "отчёта" for n=3', () => {
    expect(pluralizeReports(3)).toBe('отчёта')
  })

  it('returns "отчёта" for n=4', () => {
    expect(pluralizeReports(4)).toBe('отчёта')
  })

  it('returns "отчётов" for n=5', () => {
    expect(pluralizeReports(5)).toBe('отчётов')
  })

  it('returns "отчётов" for n=11 (teen exception)', () => {
    expect(pluralizeReports(11)).toBe('отчётов')
  })

  it('returns "отчётов" for n=12 (teen exception)', () => {
    expect(pluralizeReports(12)).toBe('отчётов')
  })

  it('returns "отчёт" for n=21', () => {
    expect(pluralizeReports(21)).toBe('отчёт')
  })

  it('returns "отчёта" for n=22', () => {
    expect(pluralizeReports(22)).toBe('отчёта')
  })
})

describe('AcquiringSummaryCards', () => {
  it('sums money totals correctly when all items have non-null fields', () => {
    const items = [
      makeItem({ reportId: 1, acquiringFeeSum: 1000, acquiringFeeVatSum: 200 }),
      makeItem({ reportId: 2, acquiringFeeSum: 500, acquiringFeeVatSum: 100 }),
    ]
    render(<AcquiringSummaryCards items={items} />)

    // Report count
    expect(screen.getByText('2')).toBeInTheDocument()

    // Fee total: 1500 — match Russian number format (may have non-breaking space)
    expect(screen.getByText(/1[\s ]?500/)).toBeInTheDocument()

    // VAT total: 300
    expect(screen.getByText(/\b300\b/)).toBeInTheDocument()

    // No footnotes when no nulls
    expect(screen.queryByText(/не включает/)).not.toBeInTheDocument()
  })

  it('footnote uses singular "отчёт" for n=1', () => {
    const items = [makeItem({ reportId: 1, acquiringFeeSum: null, acquiringFeeVatSum: 200 })]
    render(<AcquiringSummaryCards items={items} />)
    expect(screen.getByText(/не включает 1 отчёт с неизвестными/)).toBeInTheDocument()
  })

  it('footnote uses "отчёта" for n=3', () => {
    const items = [
      makeItem({ reportId: 1, acquiringFeeSum: null }),
      makeItem({ reportId: 2, acquiringFeeSum: null }),
      makeItem({ reportId: 3, acquiringFeeSum: null }),
    ]
    render(<AcquiringSummaryCards items={items} />)
    expect(screen.getByText(/не включает 3 отчёта с неизвестными/)).toBeInTheDocument()
  })

  it('footnote uses "отчётов" for n=5', () => {
    const items = [
      makeItem({ reportId: 1, acquiringFeeSum: null }),
      makeItem({ reportId: 2, acquiringFeeSum: null }),
      makeItem({ reportId: 3, acquiringFeeSum: null }),
      makeItem({ reportId: 4, acquiringFeeSum: null }),
      makeItem({ reportId: 5, acquiringFeeSum: null }),
    ]
    render(<AcquiringSummaryCards items={items} />)
    expect(screen.getByText(/не включает 5 отчётов с неизвестными/)).toBeInTheDocument()
  })

  it('excludes null items from sum and shows footnote for both fee and VAT', () => {
    const items = [
      makeItem({ reportId: 1, acquiringFeeSum: 1000, acquiringFeeVatSum: null }),
      makeItem({ reportId: 2, acquiringFeeSum: null, acquiringFeeVatSum: 100 }),
      makeItem({ reportId: 3, acquiringFeeSum: 500, acquiringFeeVatSum: 200 }),
    ]
    render(<AcquiringSummaryCards items={items} />)
    // Fee footnote: 1 null fee item (item 2) → "отчёт"
    const feeFootnotes = screen.getAllByText(/не включает 1 отчёт с неизвестными/)
    expect(feeFootnotes.length).toBeGreaterThanOrEqual(1)
    // VAT footnote: 1 null vat item (item 1) → "отчёт"
    const vatFootnotes = screen.getAllByText(/не включает 1 отчёт с неизвестными/)
    expect(vatFootnotes.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty array: 0 reports, — period, no footnote', () => {
    render(<AcquiringSummaryCards items={[]} />)

    // Report count — use getAllByText since currency "0 ₽" also renders zeros
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(1)

    // Period renders as "—" when no items
    expect(screen.getByText('—')).toBeInTheDocument()

    // No footnote when no nulls
    expect(screen.queryByText(/не включает/)).not.toBeInTheDocument()
  })

  it('shows formatted dateFrom → dateTo for single item', () => {
    const items = [makeItem({ reportId: 1, dateFrom: '2026-01-01', dateTo: '2026-01-31' })]
    render(<AcquiringSummaryCards items={items} />)
    // formatDate converts ISO → DD.MM.YYYY Russian format
    expect(screen.getByText(/01\.01\.2026.*—.*31\.01\.2026/)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('computes correct period spanning multiple items', () => {
    const items = [
      makeItem({ reportId: 1, dateFrom: '2026-03-01', dateTo: '2026-03-15' }),
      makeItem({ reportId: 2, dateFrom: '2026-01-01', dateTo: '2026-04-30' }),
      makeItem({ reportId: 3, dateFrom: '2026-02-01', dateTo: '2026-02-28' }),
    ]
    render(<AcquiringSummaryCards items={items} />)
    // min dateFrom = 2026-01-01 → 01.01.2026, max dateTo = 2026-04-30 → 30.04.2026
    expect(screen.getByText(/01\.01\.2026.*—.*30\.04\.2026/)).toBeInTheDocument()
  })
})
