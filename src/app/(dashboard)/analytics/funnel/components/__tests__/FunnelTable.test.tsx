import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFunnelResponse, makeFunnelProductItem } from '@/test/fixtures/funnel-empty'
import { FunnelTable } from '../FunnelTable'

const useFunnelDataMock = vi.fn()

const populatedResponse = emptyFunnelResponse({
  items: [
    makeFunnelProductItem({
      openCardCount: 120,
      addToCartCount: 24,
      ordersCount: 12,
      buyoutCount: 8,
      totalConversion: 6.7,
      cancelRate: 3.2,
    }),
  ],
  pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
})

vi.mock('@/hooks/use-funnel-analytics', () => ({
  useFunnelData: (...args: unknown[]) => useFunnelDataMock(...args),
}))

describe('FunnelTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces long-loading skeleton with an explicit retry state', () => {
    vi.useFakeTimers()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.getByText(/Таблица воронки загружается дольше обычного/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toHaveClass('min-h-11')
  })

  it('renders an initial main-query error with a retry action', async () => {
    const refetch = vi.fn()
    const user = userEvent.setup()
    useFunnelDataMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByText('Не удалось загрузить данные воронки')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку таблицы' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('retains table evidence and exposes retry after a background main-query error', () => {
    useFunnelDataMock.mockReturnValue({
      data: populatedResponse,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByText(/Показаны ранее загруженные данные таблицы/)).toBeVisible()
    expect(screen.getByRole('table', { name: /Воронка продаж по товарам/ })).toBeVisible()
  })

  it('distinguishes a failed comparison request from missing previous rows and retries it', async () => {
    const refetchPrevious = vi.fn()
    const user = userEvent.setup()
    useFunnelDataMock
      .mockReturnValueOnce({
        data: populatedResponse,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: refetchPrevious,
      })

    renderWithProviders(
      <FunnelTable
        from="2025-01-01"
        to="2025-01-07"
        compareEnabled
        compareFrom="2024-12-25"
        compareTo="2024-12-31"
      />
    )

    expect(screen.getByText(/Не удалось загрузить сравнение таблицы/)).toBeVisible()
    expect(screen.getAllByText('Сравнение недоступно')).toHaveLength(6)
    await user.click(screen.getByRole('button', { name: 'Повторить сравнение таблицы' }))
    expect(refetchPrevious).toHaveBeenCalledOnce()
  })

  it('distinguishes a filtered-empty result from a global empty period', () => {
    useFunnelDataMock.mockReturnValue({
      data: emptyFunnelResponse(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" nmIds={[123, 456]} />)

    expect(screen.getByText(/Нет данных по выбранным товарам/)).toBeVisible()
  })

  it('keeps the unfiltered empty-period message when no product filter is active', () => {
    useFunnelDataMock.mockReturnValue({
      data: emptyFunnelResponse(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    expect(screen.getByText('Нет данных за выбранный период')).toBeVisible()
  })

  it('renders a real table caption naming the Funnel product evidence', () => {
    useFunnelDataMock.mockReturnValue({
      data: populatedResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    const caption = document.querySelector('caption')
    expect(caption).toBeInTheDocument()
    expect(caption).toHaveTextContent('Воронка продаж по товарам')
  })

  it('includes the active period in the table caption', () => {
    useFunnelDataMock.mockReturnValue({
      data: populatedResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    expect(document.querySelector('caption')).toHaveTextContent('за период 01.01.2025 — 07.01.2025')
  })

  it('provides one named keyboard-focusable horizontal scroll owner', async () => {
    useFunnelDataMock.mockReturnValue({
      data: populatedResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    const user = userEvent.setup()

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    const scrollRegion = screen.getByRole('region', {
      name: 'Таблица воронки продаж по товарам',
    })
    expect(scrollRegion).toHaveClass('overflow-auto')
    expect(scrollRegion.parentElement).not.toHaveClass('overflow-x-auto')
    await user.tab()
    expect(scrollRegion).toHaveFocus()
  })

  it('requests the initial product evidence with the canonical default sort and page window', () => {
    useFunnelDataMock.mockReturnValue({
      data: populatedResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    expect(useFunnelDataMock).toHaveBeenNthCalledWith(1, '2025-01-01', '2025-01-07', {
      sort: 'openCardCount',
      order: 'desc',
      limit: 50,
      offset: 0,
      nmIds: undefined,
    })
  })

  it('updates the active Просмотры header aria-sort from descending to ascending', async () => {
    useFunnelDataMock.mockReturnValue({
      data: populatedResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    const user = userEvent.setup()

    renderWithProviders(<FunnelTable from="2025-01-01" to="2025-01-07" />)

    const viewsHeader = screen.getByRole('columnheader', { name: /Просмотры/ })
    expect(viewsHeader).toHaveAttribute('aria-sort', 'descending')

    await user.click(screen.getByRole('button', { name: /Просмотры/ }))

    expect(viewsHeader).toHaveAttribute('aria-sort', 'ascending')
  })
})
