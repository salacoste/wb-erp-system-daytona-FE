/**
 * Story 170.7 Task 3 Pattern-1 tests (hook level, validator E3):
 * a usePositionTrends failure must NOT blank the PositionHistoryChart — the
 * chart self-fetches via its OWN usePositionHistory hook. Mocking the two
 * hooks independently proves the fetch separation (a whole-tab destructive
 * error would unmount the chart; per-section chrome keeps it mounted).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/hooks/use-search-position-trends', () => ({
  usePositionTrends: vi.fn(),
  usePositionHistory: vi.fn(),
}))

import { usePositionTrends, usePositionHistory } from '@/hooks/use-search-position-trends'
import { SearchPositionTrendsTab } from '../SearchPositionTrendsTab'

const mockedTrends = vi.mocked(usePositionTrends)
const mockedHistory = vi.mocked(usePositionHistory)

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
  mockedHistory.mockReturnValue({
    data: {
      nmId: 111,
      history: [
        { date: '2026-08-01', avgPosition: 12.5, impressions: 100, clicks: 10 },
        { date: '2026-08-02', avgPosition: 11, impressions: 90, clicks: 9 },
      ],
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof usePositionHistory>)
})

describe('SearchPositionTrendsTab Pattern-1 (Story 170.7)', () => {
  it('movers error ≠ history blank: shared-fetch failure renders per-section error chrome while the OWN-fetch history chart still renders', () => {
    mockedTrends.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof usePositionTrends>)

    render(<SearchPositionTrendsTab />, { wrapper: createQueryWrapper(queryClient) })

    // Per-section error chrome (3 shared sections each show their own message)
    expect(screen.getByText('Не удалось загрузить сводку по позициям')).toBeInTheDocument()
    expect(screen.getByText('Не удалось загрузить изменения позиций')).toBeInTheDocument()
    expect(
      screen.getByText('Не удалось загрузить SKU рядом с первой страницей')
    ).toBeInTheDocument()
    // The OWN-fetch history chart is NOT blanked — its no-selection placeholder
    // (not an error) renders because it fetches independently.
    expect(screen.getByText('История позиций')).toBeInTheDocument()
    expect(screen.queryByText(/Не удалось загрузить данные по позициям/)).toBeNull()
  })

  it('shared-fetch success renders summary + movers + opportunities + chart together', () => {
    mockedTrends.mockReturnValue({
      data: {
        summary: {
          improvingCount: 3,
          decliningCount: 2,
          stableCount: 1,
          closeToPageOneCount: 4,
          totalSkusAnalyzed: 10,
          currentWeekStart: '2026-08-17',
          previousWeekStart: '2026-08-10',
        },
        movers: [
          {
            nmId: 111,
            currentAvgPosition: 10,
            previousAvgPosition: 20,
            positionChange: 10,
            trend: 'improving',
            totalQueries: 3,
            totalImpressions: 100,
            topQuery: 'кепка',
          },
        ],
        closeToPageOne: [],
      },
      isLoading: false,
      isError: false,
      // Anti-pattern #4 canonical bridge: partial UseQueryResult mock cast via
      // unknown (single `as` cannot overlap with the full observer union).
    } as unknown as ReturnType<typeof usePositionTrends>)

    render(<SearchPositionTrendsTab />, { wrapper: createQueryWrapper(queryClient) })

    expect(screen.getByText('Изменения позиций')).toBeInTheDocument()
    expect(screen.getByText('Растут')).toBeInTheDocument()
    expect(screen.getByText('История позиций')).toBeInTheDocument()
    // Movers nmId cross-links carry the deep-link params (live links, 170.7)
    expect(screen.getByRole('link', { name: '111' })).toHaveAttribute(
      'href',
      expect.stringContaining('tab=by-product&nmId=111')
    )
  })

  it('loading shared fetch renders per-section skeletons, history chart still mounted', () => {
    mockedTrends.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof usePositionTrends>)

    const { container } = render(<SearchPositionTrendsTab />, {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(
      container.querySelectorAll('[data-slot="skeleton"], .animate-pulse').length
    ).toBeGreaterThan(0)
    expect(screen.getByText('История позиций')).toBeInTheDocument()
  })
})
