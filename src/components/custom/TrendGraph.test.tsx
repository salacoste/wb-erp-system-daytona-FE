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

describe('TrendGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<TrendGraph />, { wrapper: createWrapper() })

    expect(screen.getByText('Тренды ключевых метрик')).toBeInTheDocument()
    expect(screen.getByText('Изменение метрик по неделям')).toBeInTheDocument()
  })

  it('renders error state correctly', () => {
    const mockRefetch = vi.fn()
    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any)

    render(<TrendGraph />, { wrapper: createWrapper() })

    expect(screen.getByText(/Не удалось загрузить данные трендов/)).toBeInTheDocument()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue({
      data: { trends: [], period: 'weeks' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

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

    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue({
      data: mockTrendData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

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

    vi.spyOn(useTrendsModule, 'useTrends').mockReturnValue({
      data: mockTrendData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<TrendGraph />, { wrapper: createWrapper() })

    const link = screen.getByText('Подробная аналитика').closest('a')
    expect(link).toHaveAttribute('href', '/analytics/time-period')
  })
})
