/**
 * Tests for AcquiringReportDetailPage
 * Epic 90-FE Story 90.3 + 169.3-FE token migration (shadcn).
 *
 * Mocks useAcquiringReportDetail directly — avoids auth store setup.
 * Mocks next/link to avoid router context requirement (169.2 idiom).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

const mockUseAcquiringReportDetail = vi.fn()
vi.mock('@/hooks/use-acquiring-report-detail', () => ({
  useAcquiringReportDetail: (...args: unknown[]) => mockUseAcquiringReportDetail(...args),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { AcquiringReportDetailPage } from '../AcquiringReportDetailPage'
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

function mockSuccess(data: AcquiringReportDetailItem[]) {
  mockUseAcquiringReportDetail.mockReturnValue({
    data: { data, cachedAt: '2026-04-10T12:00:00Z' },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AcquiringReportDetailPage (169.3 token migration)', () => {
  it('h1 uses wave-canonical text-2xl size and names the report', () => {
    mockSuccess([makeTransaction({ rrdId: 1 })])

    renderWithProviders(<AcquiringReportDetailPage reportId={100} />)

    const h1 = screen.getByRole('heading', { name: 'Отчёт #100' })
    expect(h1.getAttribute('class')).toContain('text-2xl')
    expect(h1.getAttribute('class')).not.toContain('text-3xl')
  })

  it('passes report identity to the transactions table caption (RTC)', () => {
    mockSuccess([makeTransaction({ rrdId: 1 })])

    renderWithProviders(<AcquiringReportDetailPage reportId={100} />)

    expect(screen.getByText('Транзакции отчёта #100')).toBeInTheDocument()
  })

  it('inline refetch-error chip uses status-warning matched-pair tokens (no amber)', () => {
    // isError && hasData → stale-data chip rendered alongside cached content
    mockUseAcquiringReportDetail.mockReturnValue({
      data: { data: [makeTransaction({ rrdId: 1 })], cachedAt: '2026-04-10T12:00:00Z' },
      isLoading: false,
      isError: true,
      error: new Error('refetch failed'),
      refetch: vi.fn(),
    })

    renderWithProviders(<AcquiringReportDetailPage reportId={100} />)

    const chip = screen
      .getByText(/Не удалось обновить.*Показаны кэшированные данные/)
      .closest('div')
    expect(chip).not.toBeNull()
    const cls = chip!.getAttribute('class') ?? ''
    expect(cls).toContain('bg-status-warning/15')
    expect(cls).toContain('text-status-warning')
    expect(cls).toContain('border-status-warning/30')
    expect(cls).not.toContain('amber')
  })
})
