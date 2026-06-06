/**
 * Unit tests for TrendGraph component
 * Story 3.4: Trend Graphs for Key Metrics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TrendGraph } from './TrendGraph'
import * as useTrendsModule from '@/hooks/useTrends'

// Mock useTrends hook
vi.mock('@/hooks/useTrends')

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

type TrendsReturn = ReturnType<typeof useTrendsModule.useTrends>

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

/** Build a typed partial mock of useTrends return value */
function mockTrends(
  data: useTrendsModule.TrendData | undefined,
  isLoading = false,
  error: Error | null = null
): TrendsReturn {
  return {
    data,
    isLoading,
    error,
    refetch: vi.fn(),
    isPending: isLoading,
    isSuccess: !isLoading && !error,
    isFetching: false,
    isFetched: true,
    isPlaceholderData: false,
    isRefetching: false,
    isLoadingError: !!error && !isLoading,
    isRefetchError: false,
    failureCount: 0,
    failureReason: error,
    errorUpdateCount: error ? 1 : 0,
    isFetchedAfterMount: true,
    isInitialLoading: isLoading,
    isError: !!error,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: error ? Date.now() : 0,
    status: error ? 'error' : isLoading ? 'pending' : 'success',
    fetchStatus: 'idle',
  } as unknown as TrendsReturn
}

describe('TrendGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue(mockTrends(undefined, true))

    render(<TrendGraph />, { wrapper: createWrapper() })

    expect(screen.getByText('Тренды ключевых метрик')).toBeInTheDocument()
    expect(screen.getByText('Изменение метрик по неделям')).toBeInTheDocument()
  })

  it('renders error state correctly', () => {
    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue(
      mockTrends(undefined, false, new Error('Failed to fetch'))
    )

    render(<TrendGraph />, { wrapper: createWrapper() })

    expect(screen.getByText(/Не удалось загрузить данные трендов/)).toBeInTheDocument()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue(
      mockTrends({ trends: [], period: 'weeks' })
    )

    render(<TrendGraph />, { wrapper: createWrapper() })

    expect(screen.getByText('Нет данных за этот период')).toBeInTheDocument()
    expect(
      screen.getByText('Данные о трендах появятся после загрузки отчетов за несколько недель')
    ).toBeInTheDocument()
  })

  it('renders chart with trend data', async () => {
    const mockTrendData = {
      trends: [
        {
          week: '2025-W46',
          date: '2025-11-09',
          revenue: 100000,
          totalPayable: 50000,
        },
        {
          week: '2025-W45',
          date: '2025-11-02',
          revenue: 120000,
          totalPayable: 60000,
        },
      ],
      period: 'weeks' as const,
    }

    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue(mockTrends(mockTrendData))

    render(<TrendGraph />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Тренды ключевых метрик')).toBeInTheDocument()
      expect(screen.getByText('Подробная аналитика')).toBeInTheDocument()
    })
  })

  it('renders link to detailed analytics', () => {
    const mockTrendData = {
      trends: [
        {
          week: '2025-W46',
          date: '2025-11-09',
          revenue: 100000,
          totalPayable: 50000,
        },
      ],
      period: 'weeks' as const,
    }

    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue(mockTrends(mockTrendData))

    render(<TrendGraph />, { wrapper: createWrapper() })

    const link = screen.getByText('Подробная аналитика').closest('a')
    expect(link).toHaveAttribute('href', '/analytics/time-period')
  })
})
