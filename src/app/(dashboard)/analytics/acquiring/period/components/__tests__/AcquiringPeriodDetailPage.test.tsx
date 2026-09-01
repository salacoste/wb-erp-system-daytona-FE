/**
 * Tests for AcquiringPeriodDetailPage
 * Epic 90-FE Story 90.4: Acquiring Period Detail View
 *
 * Mocks useAcquiringPeriodDetail directly — avoids auth store setup.
 * Mocks DateRangePickerExtended to isolate orchestrator behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { AcquiringDetailResponse } from '@/types/acquiring-analytics'
import { ApiError } from '@/types/api'

// Mock the hook before importing the component
const mockUseAcquiringPeriodDetail = vi.fn()
vi.mock('@/hooks/use-acquiring-period-detail', () => ({
  useAcquiringPeriodDetail: (...args: unknown[]) => mockUseAcquiringPeriodDetail(...args),
}))

// Mock DateRangePickerExtended to avoid date-fns locale complexity in tests
vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: ({
    onChange,
  }: {
    onChange: (range: { from: Date; to: Date } | undefined) => void
  }) => (
    <button type="button" data-testid="mock-date-picker" onClick={() => onChange(undefined)}>
      Clear period
    </button>
  ),
}))

// Mock next/link to avoid router context requirement
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { AcquiringPeriodDetailPage } from '../AcquiringPeriodDetailPage'

const makeTransaction = (rrdId: number) => ({
  rrdId,
  reportId: 200,
  acqDate: '2026-04-10',
  acquiringBank: 'Sberbank',
  saleDate: '2026-04-08',
  srid: `SR-${rrdId}`,
  docTypeName: 'Продажа',
  nmId: 12345678,
  retailAmount: 5000,
  acquiringFee: 150,
  acquiringFeeVat: 27,
  currency: 'RUB',
})

function mockSuccess(data: AcquiringDetailResponse) {
  mockUseAcquiringPeriodDetail.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
}

function mockLoading() {
  mockUseAcquiringPeriodDetail.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AcquiringPeriodDetailPage', () => {
  it('keeps a cleared or invalid period out of the query and presents a bounded recovery action', async () => {
    mockSuccess({ data: [], cachedAt: '' })

    const user = userEvent.setup()
    renderWithProviders(<AcquiringPeriodDetailPage initialRangeError="Период в ссылке недоступен." />)

    expect(screen.getByText('Период в ссылке недоступен.')).toBeInTheDocument()
    expect(screen.queryByText(/Транзакции за выбранный период не найдены/)).not.toBeInTheDocument()
    expect(mockUseAcquiringPeriodDetail).toHaveBeenCalledWith('', '', false)

    await user.click(screen.getByTestId('mock-date-picker'))

    expect(screen.getByText(/Период не выбран/)).toBeInTheDocument()
    expect(mockUseAcquiringPeriodDetail).toHaveBeenLastCalledWith('', '', false)
  })

  it('renders landmark, header, and back button when data resolves', () => {
    mockSuccess({
      data: [makeTransaction(1), makeTransaction(2)],
      cachedAt: '2026-04-10T12:00:00Z',
    })

    renderWithProviders(<AcquiringPeriodDetailPage />)

    // Root landmark
    expect(screen.getByTestId('acquiring-period-detail')).toBeInTheDocument()

    // Page header
    expect(screen.getByRole('heading', { name: 'Эквайринг за период' })).toBeInTheDocument()
    expect(screen.getByText('Транзакции эквайринга без группировки по отчётам')).toBeInTheDocument()

    // Back button link to acquiring list
    const backLink = screen.getByRole('link', { name: /Назад к отчётам/ })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/analytics/acquiring')

    // Summary cards rendered (transaction count = 2)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows empty state text when data resolves with empty array', () => {
    mockSuccess({ data: [], cachedAt: '' })

    renderWithProviders(<AcquiringPeriodDetailPage />)

    expect(screen.getByTestId('acquiring-period-detail')).toBeInTheDocument()
    expect(screen.getByText(/Транзакции за выбранный период не найдены/)).toBeInTheDocument()
    expect(screen.getByText(/Для не-РФ продавцов данные всегда пустые/)).toBeInTheDocument()
  })

  it('shows skeleton on first load (isLoading, no cached data)', () => {
    mockLoading()

    renderWithProviders(<AcquiringPeriodDetailPage />)

    // Semantic role="status" present (aria-busy="true", screen readers announce loading)
    expect(screen.getByRole('status')).toBeInTheDocument()

    // No transactions table or summary yet
    expect(screen.queryByText(/Транзакции за выбранный период не найдены/)).not.toBeInTheDocument()
  })

  it('replaces long-loading skeleton with an explicit retry state', () => {
    vi.useFakeTimers()
    mockLoading()

    renderWithProviders(<AcquiringPeriodDetailPage />)

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(
      screen.getByText(/Транзакции эквайринга загружаются дольше обычного/)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('h1 uses wave-canonical text-2xl size (169.2 token migration)', () => {
    mockSuccess({ data: [makeTransaction(1)], cachedAt: '' })

    renderWithProviders(<AcquiringPeriodDetailPage />)

    const h1 = screen.getByRole('heading', { name: 'Эквайринг за период' })
    expect(h1).toBeInTheDocument()
    expect(h1.getAttribute('class')).toContain('text-2xl')
  })

  it('inline refetch-error chip uses status-warning matched-pair tokens (no amber)', () => {
    // isError && hasData → stale-data chip rendered alongside cached content
    mockUseAcquiringPeriodDetail.mockReturnValue({
      data: { data: [makeTransaction(1)], cachedAt: '2026-04-10T12:00:00Z' },
      isLoading: false,
      isError: true,
      error: new Error('refetch failed'),
      refetch: vi.fn(),
    })

    renderWithProviders(<AcquiringPeriodDetailPage />)

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

  it('shows rate-limit banner instead of generic full-error when 503 and no cached data', () => {
    mockUseAcquiringPeriodDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError('Rate limited', 503),
      refetch: vi.fn(),
    })

    renderWithProviders(<AcquiringPeriodDetailPage />)

    // Rate-limit banner wins over the destructive generic error alert
    expect(screen.getByTestId('acquiring-rate-limit-banner')).toBeInTheDocument()
    expect(
      screen.queryByText('Не удалось загрузить транзакции. Попробуйте ещё раз.')
    ).not.toBeInTheDocument()
  })
})
