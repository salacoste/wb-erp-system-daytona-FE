/**
 * Tests for MarketingKpiCard — marketing overview KPI card.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { SearchOrdersResponse } from '@/types/search-analytics'

const mockUseSearchOrders = vi.fn()
vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: (...args: unknown[]) => mockUseSearchOrders(...args),
}))

import { MarketingKpiCard } from '../MarketingKpiCard'

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderCard(props: { from?: string; to?: string } = {}) {
  return render(
    <MarketingKpiCard from={props.from ?? '2026-03-01'} to={props.to ?? '2026-03-07'} />,
    { wrapper: createQueryWrapper(queryClient) }
  )
}

function okResponse(
  totalSearchOrders = 1234,
  searchOrderShare: number | null = 45.3,
  items: SearchOrdersResponse['items'] = []
): { data: SearchOrdersResponse; isLoading: false; isError: false } {
  return {
    data: {
      period: { from: '2026-03-01', to: '2026-03-07' },
      groupBy: 'query',
      items,
      summary: { totalSearchOrders, searchOrderShare },
    },
    isLoading: false,
    isError: false,
  }
}

describe('MarketingKpiCard', () => {
  it('renders skeleton when loading', () => {
    mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderCard()
    expect(screen.getByRole('status')).toBeInTheDocument()
    // Single announcement source (sr-only span; aria-label removed) — no duplicate to lock in
    expect(screen.getByText('Загрузка маркетинга')).toBeInTheDocument()
  })

  it('returns null on error (graceful degradation)', () => {
    mockUseSearchOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    })
    renderCard()
    // Assert the contract (card absent), not the test harness's innerHTML
    expect(screen.queryByText('Маркетинг — обзор')).toBeNull()
  })

  it('renders "Нет данных" when no data', () => {
    mockUseSearchOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })
    renderCard()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('renders "Нет данных" when summary is null and items empty', () => {
    mockUseSearchOrders.mockReturnValue(okResponse(0, null, []))
    renderCard()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('renders "Нет данных" for zero orders + zero share (degenerate summary)', () => {
    mockUseSearchOrders.mockReturnValue(okResponse(0, 0, []))
    renderCard()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('renders totalSearchOrders and searchOrderShare with data', () => {
    mockUseSearchOrders.mockReturnValue(
      okResponse(1234, 45.3, [
        { key: 'кроссовки женские', totalOrders: 100 },
        { key: 'сумки', totalOrders: 80 },
        { key: 'платье', totalOrders: 60 },
      ])
    )
    renderCard()

    // Title
    expect(screen.getByText('Маркетинг — обзор')).toBeInTheDocument()
    // Total search orders (Russian locale — NBSP in number)
    expect(screen.getByText('1 234')).toBeInTheDocument()
    // Share rendered with comma + NBSP + % (house locale rule: "45,3 %") — \s matches NBSP
    expect(screen.getByText(/45,3\s*%/)).toBeInTheDocument()
    // Top keyword
    expect(screen.getByText('кроссовки женские')).toBeInTheDocument()
    // 2nd and 3rd
    expect(screen.getByText(/сумки/)).toBeInTheDocument()
    expect(screen.getByText(/платье/)).toBeInTheDocument()
  })

  it('renders "—" when searchOrderShare is null (anti-pattern #8)', () => {
    mockUseSearchOrders.mockReturnValue(okResponse(500, null, [{ key: 'тест', totalOrders: 10 }]))
    renderCard()

    // The share display should be "—" — find it in the "(— от всех)" text
    expect(screen.getByText(/от всех/).textContent).toContain('—')
  })

  it('renders "—" for missing keywords', () => {
    mockUseSearchOrders.mockReturnValue(
      okResponse(100, 20, [{ key: 'единственный', totalOrders: 10 }])
    )
    renderCard()

    // Scope assertions to the specific 2-й / 3-й slots, not a global dash count
    expect(screen.getByText(/2-й:/).textContent).toContain('—')
    expect(screen.getByText(/3-й:/).textContent).toContain('—')
  })

  it('renders numeric key (nmId) via String() not "—"', () => {
    mockUseSearchOrders.mockReturnValue(okResponse(100, 20, [{ key: 12345, totalOrders: 10 }]))
    renderCard()

    expect(screen.getByText('12345')).toBeInTheDocument()
  })

  it('shows Info icon when searchOrderShareInflated is true', () => {
    mockUseSearchOrders.mockReturnValue({
      data: {
        period: { from: '2026-03-01', to: '2026-03-07' },
        groupBy: 'query',
        items: [{ key: 'тест', totalOrders: 10 }],
        summary: {
          totalSearchOrders: 100,
          searchOrderShare: 120,
          searchOrderShareInflated: true,
        },
      },
      isLoading: false,
      isError: false,
    })
    renderCard()

    // Info icon has aria-label with the tooltip text
    expect(screen.getByLabelText('Доля превышает 100% из-за мультиатрибуции')).toBeInTheDocument()
  })

  it('does not show Info icon when share is not inflated', () => {
    mockUseSearchOrders.mockReturnValue(okResponse(100, 45, [{ key: 'тест', totalOrders: 10 }]))
    renderCard()

    expect(screen.queryByLabelText(/мультиатрибуции/)).toBeNull()
  })

  it('truncates long keywords', () => {
    const longQuery = 'очень длинный поисковый запрос который нужно обрезать'
    mockUseSearchOrders.mockReturnValue(okResponse(100, 30, [{ key: longQuery, totalOrders: 10 }]))
    renderCard()

    // Should be truncated (contains ellipsis)
    expect(screen.getByText(/…$/)).toBeInTheDocument()
  })
})
