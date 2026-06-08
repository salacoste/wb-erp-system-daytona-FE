import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PositionHistoryChart } from '../PositionHistoryChart'
import type { PositionHistoryPoint } from '@/types/search-position-trends'

// Polyfill matchMedia for jsdom (used by prefers-reduced-motion check)
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  })
})

// Mock recharts — jsdom doesn't render SVG dimensions
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive">{children}</div>
  ),
}))

// Mock the hook
const mockHistoryData = {
  nmId: 123456,
  history: [
    { date: '2026-06-01', avgPosition: 15.2, impressions: 100, clicks: 10, ctr: 0.1 },
    { date: '2026-06-02', avgPosition: 12.8, impressions: 120, clicks: 15, ctr: 0.125 },
    { date: '2026-06-03', avgPosition: 10.1, impressions: 90, clicks: 8, ctr: 0.089 },
  ],
  days: 30,
}

let mockHookReturn: {
  data: { nmId: number; history: PositionHistoryPoint[]; days: number } | null
  isLoading: boolean
} = { data: null, isLoading: false }

vi.mock('@/hooks/use-search-position-trends', () => ({
  usePositionHistory: () => mockHookReturn,
}))

describe('PositionHistoryChart', () => {
  it('shows "select SKU" prompt when nmId is null', () => {
    mockHookReturn = { data: null, isLoading: false }
    render(<PositionHistoryChart nmId={null} />)
    expect(screen.getByText('Выберите SKU из таблицы для просмотра истории')).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    mockHookReturn = { data: null, isLoading: true }
    render(<PositionHistoryChart nmId={123456} />)
    expect(screen.getByText('История позиций — 123456')).toBeInTheDocument()
  })

  it('shows empty state when history is empty', () => {
    mockHookReturn = {
      data: { nmId: 123456, history: [], days: 30 },
      isLoading: false,
    }
    render(<PositionHistoryChart nmId={123456} />)
    expect(screen.getByText('Нет данных по позициям для данного SKU')).toBeInTheDocument()
  })

  it('renders chart when data is available', () => {
    mockHookReturn = { data: mockHistoryData, isLoading: false }
    render(<PositionHistoryChart nmId={123456} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('line')).toBeInTheDocument()
    expect(screen.getByText('История позиций — 123456')).toBeInTheDocument()
  })

  it('has accessible role and aria-label on chart container', () => {
    mockHookReturn = { data: mockHistoryData, isLoading: false }
    render(<PositionHistoryChart nmId={123456} />)
    const chartImg = screen.getByRole('img')
    expect(chartImg).toHaveAttribute('aria-label')
  })

  it('renders without nmId using default title', () => {
    mockHookReturn = { data: null, isLoading: false }
    render(<PositionHistoryChart nmId={null} />)
    expect(screen.getByText('История позиций')).toBeInTheDocument()
  })
})
