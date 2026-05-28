/**
 * Tests for SearchOrdersTab (orchestrator)
 * Story 117.1-FE: tab now orchestrates two INDEPENDENT state machines (Pattern 1):
 *   - SearchOrdersChart (groupBy='day')
 *   - SearchOrdersOverview (groupBy='query')
 * These tests assert both mount together AND that one source failing does NOT
 * blank the other (graceful degradation). Component-level behavior is covered by
 * SearchOrdersChart.test.tsx + SearchOrdersOverview.test.tsx.
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

import { SearchOrdersTab } from '../components/SearchOrdersTab'

let queryClient: QueryClient

const queryData: SearchOrdersResponse = {
  period: { from: '2026-03-01', to: '2026-03-03' },
  groupBy: 'query',
  items: [{ key: 'платье', totalOrders: 50, uniqueProducts: 10 }],
  summary: { totalSearchOrders: 150, searchOrderShare: 42.5 },
}

const dayData: SearchOrdersResponse = {
  period: { from: '2026-03-01', to: '2026-03-03' },
  groupBy: 'day',
  items: [
    { key: '2026-03-01', totalOrders: 50, uniqueQueries: 20 },
    { key: '2026-03-02', totalOrders: 65, uniqueQueries: 24 },
  ],
  summary: { totalSearchOrders: 115, searchOrderShare: 38.0 },
}

type HookResult = { data: SearchOrdersResponse | undefined; isLoading: boolean; isError: boolean }

/** groupBy-aware mock: chart (day) vs overview (query) resolve independently. */
function mockByGroupBy(day: HookResult, query: HookResult) {
  mockUseSearchOrders.mockImplementation((_from, _to, params?: { groupBy?: string }) =>
    params?.groupBy === 'day' ? day : query
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderTab() {
  return render(<SearchOrdersTab from="2026-03-01" to="2026-03-03" />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('SearchOrdersTab (orchestrator)', () => {
  it('mounts both the chart and the overview when both sources succeed', () => {
    mockByGroupBy(
      { data: dayData, isLoading: false, isError: false },
      { data: queryData, isLoading: false, isError: false }
    )
    const { container } = renderTab()
    // Chart present
    expect(screen.getByText('Динамика поисковых заказов по дням')).toBeInTheDocument()
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
    // Overview present
    expect(screen.getByText('Поисковые заказы')).toBeInTheDocument()
    // Story 117.4-FE: 'платье' now appears in BOTH the overview table AND the
    // TopKeywordsByOrdersCard top-N list (3rd sibling, TanStack dedupes the
    // shared query-cache key). toHaveLength(2) makes the colocation explicit
    // (Pass-1 L-2 cleanup: getAllByText already throws on 0; .length>0 was
    // tautological — exact count documents intent).
    expect(screen.getAllByText('платье')).toHaveLength(2)
    // Story 117.4-FE: top-keywords widget mounted as a 3rd sibling
    expect(screen.getByText('Топ-запросы по заказам')).toBeInTheDocument()
  })

  it('keeps the overview table when the CHART fetch fails (Pattern 1 graceful degradation)', () => {
    mockByGroupBy(
      { data: undefined, isLoading: false, isError: true }, // chart day-fetch fails
      { data: queryData, isLoading: false, isError: false } // overview query-fetch ok
    )
    renderTab()
    // Chart shows its contained error...
    expect(screen.getByText('Не удалось загрузить динамику поисковых заказов')).toBeInTheDocument()
    // ...but the table is NOT blanked. Story 117.4-FE: top-keywords widget
    // also renders here since it shares the same successful query cache,
    // hence 'платье' appears twice (overview + widget).
    expect(screen.getAllByText('платье')).toHaveLength(2)
    expect(screen.getByText('Поисковые заказы')).toBeInTheDocument()
  })

  it('keeps the chart + shows widget error chrome when the OVERVIEW fetch fails (reverse direction)', () => {
    mockByGroupBy(
      { data: dayData, isLoading: false, isError: false }, // chart day-fetch ok
      { data: undefined, isLoading: false, isError: true } // overview query-fetch fails
    )
    const { container } = renderTab()
    // Overview shows its contained error...
    expect(screen.getByText(/Не удалось загрузить данные поисковых заказов/)).toBeInTheDocument()
    // ...but the chart is NOT blanked
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
    expect(screen.getByText('Динамика поисковых заказов по дням')).toBeInTheDocument()
    // Story 117.4-FE Pass-1 M-2 + L-3: widget shares the same failing query
    // cache → renders its OWN error chrome (CardShell + ERROR message) rather
    // than vanishing. Verifies the Pass-1 H-1 fix and prevents a future
    // regression that re-introduces the silent-null behavior.
    expect(screen.getByText('Топ-запросы по заказам')).toBeInTheDocument()
    expect(screen.getByText('Не удалось загрузить топ-запросы')).toBeInTheDocument()
  })
})
