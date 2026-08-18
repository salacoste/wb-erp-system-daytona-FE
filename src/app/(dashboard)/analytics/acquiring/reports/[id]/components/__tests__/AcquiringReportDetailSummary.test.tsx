/**
 * Tests for AcquiringReportDetailSummary
 * Epic 90-FE Story 90.3: Acquiring Report Detail View
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AcquiringReportDetailSummary } from '../AcquiringReportDetailSummary'
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
  acquiringFee: 200,
  acquiringFeeVat: 36,
  currency: 'RUB',
  ...overrides,
})

describe('AcquiringReportDetailSummary', () => {
  it('sums fees and VAT correctly when all items have non-null money fields', () => {
    const transactions: AcquiringReportDetailItem[] = [
      makeTransaction({ rrdId: 1, acquiringFee: 200, acquiringFeeVat: 40 }),
      makeTransaction({ rrdId: 2, acquiringFee: 300, acquiringFeeVat: 50, srid: 'SR-002' }),
    ]
    render(<AcquiringReportDetailSummary transactions={transactions} />)

    // Expect EXACT formatted totals: fees=500, VAT=90, count=2
    // formatCurrency uses ru-RU locale with non-breaking space separators
    expect(screen.getByText(/500\s*₽/)).toBeInTheDocument()
    expect(screen.getByText(/90\s*₽/)).toBeInTheDocument()
    // Transaction count card shows bare "2"
    expect(screen.getByText('2')).toBeInTheDocument()

    // No footnotes when no nulls
    expect(screen.queryByText(/не включает/)).not.toBeInTheDocument()
  })

  it('excludes null items from sum and shows pluralized footnote', () => {
    const transactions = [
      makeTransaction({ rrdId: 1, acquiringFee: 200, acquiringFeeVat: null }),
      makeTransaction({ rrdId: 2, acquiringFee: null, acquiringFeeVat: 54, srid: 'SR-002' }),
      makeTransaction({ rrdId: 3, acquiringFee: 300, acquiringFeeVat: 36, srid: 'SR-003' }),
    ]
    render(<AcquiringReportDetailSummary transactions={transactions} />)

    // Both fee and VAT each have 1 null → two footnotes with same text (getAllByText required)
    const footnotes = screen.getAllByText(/не включает 1 транзакция с неизвестными/)
    expect(footnotes.length).toBe(2)

    // Transaction count still shows total (3)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('handles empty transactions: 0 fees, 0 VAT, 0 count, no footnotes', () => {
    render(<AcquiringReportDetailSummary transactions={[]} />)

    // Count is 0
    expect(screen.getByText('0')).toBeInTheDocument()

    // No footnotes
    expect(screen.queryByText(/не включает/)).not.toBeInTheDocument()
  })

  it('footnote uses "транзакции" for n=2 (few form)', () => {
    const transactions = [
      makeTransaction({ rrdId: 1, acquiringFee: null }),
      makeTransaction({ rrdId: 2, acquiringFee: null, srid: 'SR-002' }),
    ]
    render(<AcquiringReportDetailSummary transactions={transactions} />)
    expect(screen.getByText(/не включает 2 транзакции с неизвестными/)).toBeInTheDocument()
  })

  it('footnote uses "транзакций" for n=5 (many form)', () => {
    const transactions = Array.from({ length: 5 }, (_, i) =>
      makeTransaction({ rrdId: i + 1, acquiringFee: null, srid: `SR-00${i + 1}` })
    )
    render(<AcquiringReportDetailSummary transactions={transactions} />)
    expect(screen.getByText(/не включает 5 транзакций с неизвестными/)).toBeInTheDocument()
  })

  it('renders "—" (not a fabricated "0 ₽") when every transaction has null money — all-null aggregate (anti-pattern #8)', () => {
    const transactions = [
      makeTransaction({ rrdId: 1, acquiringFee: null, acquiringFeeVat: null }),
      makeTransaction({ rrdId: 2, acquiringFee: null, acquiringFeeVat: null, srid: 'SR-002' }),
    ]
    render(<AcquiringReportDetailSummary transactions={transactions} />)
    // Both money headlines (fee + VAT) show "—" (this view has no period-date card).
    expect(screen.getAllByText('—')).toHaveLength(2)
    // Count still shows the total.
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})

describe('AcquiringReportDetailSummary (169.3 token migration)', () => {
  it('money headlines use tabular-nums; transaction counter does NOT', () => {
    const transactions = [
      makeTransaction({ rrdId: 1, acquiringFee: 200, acquiringFeeVat: 40 }),
      makeTransaction({ rrdId: 2, acquiringFee: 300, acquiringFeeVat: 50, srid: 'SR-002' }),
    ]
    render(<AcquiringReportDetailSummary transactions={transactions} />)

    const headlines = screen.getAllByText(/₽/)
    expect(headlines.length).toBe(2)
    for (const h of headlines) {
      expect(h.getAttribute('class')).toContain('tabular-nums')
    }
    // Counter card shows bare number without tabular-nums
    const counter = screen.getByText('2')
    expect(counter.getAttribute('class') ?? '').not.toContain('tabular-nums')
  })

  it('data-quality footnotes use text-status-warning token (no amber)', () => {
    const transactions = [
      makeTransaction({ rrdId: 1, acquiringFee: null, acquiringFeeVat: null }),
      makeTransaction({ rrdId: 2, acquiringFee: null, acquiringFeeVat: null, srid: 'SR-002' }),
    ]
    render(<AcquiringReportDetailSummary transactions={transactions} />)
    const footnotes = screen.getAllByText(/не включает/)
    expect(footnotes.length).toBe(2)
    for (const f of footnotes) {
      const cls = f.getAttribute('class') ?? ''
      expect(cls).toContain('text-status-warning')
      expect(cls).not.toContain('amber')
    }
  })
})
