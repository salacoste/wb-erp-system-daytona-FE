/**
 * Tests for TopKeywordsByOrdersCard
 * Story 117.4-FE: Top Keywords by Orders widget — pure helper + component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { SearchOrderItem, SearchOrdersResponse } from '@/types/search-analytics'

const mockUseSearchOrders = vi.fn()
vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: (...args: unknown[]) => mockUseSearchOrders(...args),
}))

import { pickTopByOrders, TopKeywordsByOrdersCard } from '../components/TopKeywordsByOrdersCard'

const item = (
  key: SearchOrderItem['key'],
  totalOrders: number,
  uniqueProducts?: number
): SearchOrderItem => ({
  key,
  totalOrders,
  ...(uniqueProducts != null ? { uniqueProducts } : {}),
})

const sample: SearchOrderItem[] = [
  item('платье', 50, 10),
  item('куртка', 120, 14),
  item('джинсы', 75, 8),
  item('шапка', 30, 4),
]

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderWidget(props: { from?: string; to?: string; n?: number } = {}) {
  return render(
    <TopKeywordsByOrdersCard
      from={props.from ?? '2026-03-01'}
      to={props.to ?? '2026-03-03'}
      n={props.n}
    />,
    { wrapper: createQueryWrapper(queryClient) }
  )
}

describe('pickTopByOrders (pure)', () => {
  it('returns [] for undefined input', () => {
    expect(pickTopByOrders(undefined)).toEqual([])
  })

  it('returns [] when n <= 0', () => {
    expect(pickTopByOrders(sample, 0)).toEqual([])
    expect(pickTopByOrders(sample, -3)).toEqual([])
  })

  it('default n=10 — returns all items when fewer than 10', () => {
    expect(pickTopByOrders(sample).map(i => i.key)).toEqual(['куртка', 'джинсы', 'платье', 'шапка'])
  })

  it('takes the top N by totalOrders desc', () => {
    expect(pickTopByOrders(sample, 2).map(i => i.key)).toEqual(['куртка', 'джинсы'])
  })

  it('filters items whose key is not a string (defensive — distinct from chart-style coerce)', () => {
    const mixed: SearchOrderItem[] = [
      item('купить', 90, 5),
      item(123 as unknown as string, 200, 3), // numeric key — backend drift, should be dropped
      item(null as unknown as string, 999, 1), // null key — dropped
      item('skirt', 40),
    ]
    expect(pickTopByOrders(mixed).map(i => i.key)).toEqual(['купить', 'skirt'])
  })

  it('stable sort: ties preserve encounter order', () => {
    const tied: SearchOrderItem[] = [item('a', 50), item('b', 100), item('c', 50), item('d', 100)]
    expect(pickTopByOrders(tied).map(i => i.key)).toEqual(['b', 'd', 'a', 'c'])
  })
})

describe('TopKeywordsByOrdersCard (component)', () => {
  const ok = (
    items: SearchOrderItem[]
  ): { data: SearchOrdersResponse; isLoading: false; isError: false } => ({
    data: {
      period: { from: '2026-03-01', to: '2026-03-03' },
      groupBy: 'query',
      items,
      summary: { totalSearchOrders: 0, searchOrderShare: 0 },
    },
    isLoading: false,
    isError: false,
  })

  it('renders skeleton with role=status + sr-only loading text when isLoading', () => {
    mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const { container } = renderWidget()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Загрузка топ-запросов')).toBeInTheDocument()
    expect(
      container.querySelectorAll('[data-slot="skeleton"], .animate-pulse').length
    ).toBeGreaterThan(0)
  })

  it('renders an error message inside the card chrome on error (Story 117.4-FE Pass-1 H-1)', () => {
    // Defensive Frontend Principle "indicate, don't hide": consistent with sibling
    // Chart/Overview which render their error inside their card chrome.
    mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderWidget()
    expect(screen.getByText('Топ-запросы по заказам')).toBeInTheDocument()
    expect(screen.getByText('Не удалось загрузить топ-запросы')).toBeInTheDocument()
  })

  it('renders empty message when no items', () => {
    mockUseSearchOrders.mockReturnValue(ok([]))
    renderWidget()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    // Title still shown — empty inside the same card chrome
    expect(screen.getByText('Топ-запросы по заказам')).toBeInTheDocument()
  })

  it('renders empty message when all items are filtered (non-string keys)', () => {
    mockUseSearchOrders.mockReturnValue(
      ok([item(1 as unknown as string, 99), item(null as unknown as string, 50)])
    )
    renderWidget()
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('renders top-N ranked queries with formatted counts + optional uniqueProducts', () => {
    mockUseSearchOrders.mockReturnValue(ok(sample))
    renderWidget({ n: 3 })
    // Card chrome
    expect(screen.getByText('Топ-запросы по заказам')).toBeInTheDocument()
    // <ol> with the top 3 by totalOrders desc: куртка(120), джинсы(75), платье(50)
    const list = screen.getByRole('list')
    const queries = Array.from(list.querySelectorAll('li > span:first-child')).map(
      el => el.textContent
    )
    expect(queries).toEqual(['куртка', 'джинсы', 'платье'])
    // Russian-formatted counts (toLocaleString uses NBSP; assert via regex)
    expect(screen.getByText(/^120$/)).toBeInTheDocument()
    expect(screen.getByText(/^75$/)).toBeInTheDocument()
    expect(screen.getByText(/^50$/)).toBeInTheDocument()
    // uniqueProducts visible when present
    expect(screen.getByText(/14 товаров/)).toBeInTheDocument()
    expect(screen.getByText(/8 товаров/)).toBeInTheDocument()
    expect(screen.getByText(/10 товаров/)).toBeInTheDocument()
    // шапка(30) excluded — n=3
    expect(screen.queryByText('шапка')).toBeNull()
  })

  it('hides uniqueProducts when absent', () => {
    mockUseSearchOrders.mockReturnValue(ok([item('test', 5)]))
    renderWidget()
    expect(screen.queryByText(/товаров/)).toBeNull()
  })

  it('pluralizes "товар" correctly by Russian count rules (Story 117.4-FE Pass-1 M-1)', () => {
    // count=1  → singular "товар"
    // count=3  → few "товара"
    // count=14 → many "товаров" (11-14 = teen exception)
    // count=22 → few "товара"
    mockUseSearchOrders.mockReturnValue(
      ok([item('a', 100, 1), item('b', 90, 3), item('c', 80, 14), item('d', 70, 22)])
    )
    renderWidget()
    expect(screen.getByText(/^1 товар$/)).toBeInTheDocument()
    expect(screen.getByText(/^3 товара$/)).toBeInTheDocument()
    expect(screen.getByText(/^14 товаров$/)).toBeInTheDocument()
    expect(screen.getByText(/^22 товара$/)).toBeInTheDocument()
  })
})
