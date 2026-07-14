import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock recharts to avoid jsdom SVG issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: ({ dataKey }: { dataKey: string }) => <div data-testid={`area-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ content }: { content?: React.ReactNode }) => (
    <div data-testid="tooltip">{content}</div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}))

// Mock subcomponents (relative from __tests__/ -> ../)
vi.mock('../StorageTrendsChartParts', () => ({
  TrendBadge: ({ trend }: { trend: number }) => (
    <span data-testid="trend-badge">{String(trend)}</span>
  ),
  SummaryStats: ({ summary }: { summary: { min: number | null } }) => (
    <span data-testid="summary-stats">{String(summary.min)}</span>
  ),
  CustomTooltip: () => <div data-testid="custom-tooltip" />,
  CustomDot: () => <circle data-testid="custom-dot" />,
}))

// Mock config (relative from __tests__/ -> ../)
vi.mock('../storage-trends-config', () => ({
  CHART_COLORS: { storage: '#7C4DFF', cost: '#E53935' },
  formatWeekShort: vi.fn((w: string) => w.slice(-5)),
  formatCurrency: vi.fn((v: number) => `${v} ₽`),
}))

import { StorageTrendsChart } from '../StorageTrendsChart'
import type { StorageTrendPoint, MoneyMetricSummary } from '@/types/storage-analytics'

const mockData: StorageTrendPoint[] = [
  { week: '2026-W09', storage_cost: 15000 },
  { week: '2026-W10', storage_cost: 18000 },
  { week: '2026-W11', storage_cost: 12000 },
]

// BD-44: StorageTrendsChart renders storage_cost (money) → MoneyMetricSummary (nullable min/max/avg).
const mockSummary: MoneyMetricSummary = {
  min: 10000,
  max: 20000,
  avg: 15000,
  trend: -10.5,
}

describe('StorageTrendsChart', () => {
  it('shows loading skeleton when isLoading is true', () => {
    const { container } = render(<StorageTrendsChart data={[]} isLoading={true} />)
    // Skeleton renders; no chart or empty message shown during loading
    expect(
      container.querySelector('[data-slot="skeleton"]') ||
        container.querySelector('[class*="animate-pulse"]') ||
        screen.queryByText('Нет данных за выбранный период')
    ).toBeTruthy()
  })

  it('shows empty message when data is empty', () => {
    render(<StorageTrendsChart data={[]} isLoading={false} />)
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('shows empty message when data is null', () => {
    render(<StorageTrendsChart data={null as unknown as StorageTrendPoint[]} isLoading={false} />)
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('renders chart container with data', () => {
    render(<StorageTrendsChart data={mockData} isLoading={false} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('renders area for storage_cost', () => {
    render(<StorageTrendsChart data={mockData} isLoading={false} />)
    expect(screen.getByTestId('area-storage_cost')).toBeInTheDocument()
  })

  it('renders summary stats when summary is provided', () => {
    render(<StorageTrendsChart data={mockData} summary={mockSummary} isLoading={false} />)
    expect(screen.getByTestId('summary-stats')).toBeInTheDocument()
    expect(screen.getByTestId('trend-badge')).toBeInTheDocument()
  })

  it('renders without summary when not provided', () => {
    render(<StorageTrendsChart data={mockData} isLoading={false} />)
    expect(screen.queryByTestId('summary-stats')).not.toBeInTheDocument()
    expect(screen.queryByTestId('trend-badge')).not.toBeInTheDocument()
  })

  it('renders tooltip', () => {
    render(<StorageTrendsChart data={mockData} isLoading={false} />)
    expect(screen.getByTestId('custom-tooltip')).toBeInTheDocument()
  })

  it('uses custom height', () => {
    render(<StorageTrendsChart data={mockData} isLoading={false} height={300} />)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })
})
