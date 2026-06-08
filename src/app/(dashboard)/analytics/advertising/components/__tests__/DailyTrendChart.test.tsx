import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { DailyTrendChart } from '../DailyTrendChart'

// recharts needs matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Mock recharts to avoid jsdom SVG rendering issues
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid={`line-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('DailyTrendChart', () => {
  const mockData = [
    { date: '2026-03-01', spend: 1000, views: 500, clicks: 50, orders: 5, roas: 2.5 },
    { date: '2026-03-02', spend: 1200, views: 600, clicks: 60, orders: 8, roas: 3.0 },
  ]

  it('shows loading skeleton when isLoading is true', () => {
    render(<DailyTrendChart data={[]} isLoading={true} />)
    expect(screen.getByText('Динамика по дням')).toBeInTheDocument()
    // Skeleton renders with role="status" from the container
    const card = screen.getByText('Динамика по дням').closest('[class*="card"]')
    expect(card).toBeTruthy()
  })

  it('shows empty message when data is empty', () => {
    render(<DailyTrendChart data={[]} isLoading={false} />)
    expect(screen.getByText('Нет ежедневных данных за выбранный период')).toBeInTheDocument()
  })

  it('shows empty message when data is null', () => {
    render(<DailyTrendChart data={null as unknown as never[]} isLoading={false} />)
    expect(screen.getByText('Нет ежедневных данных за выбранный период')).toBeInTheDocument()
  })

  it('renders chart title and legend toggles with data', () => {
    render(<DailyTrendChart data={mockData} isLoading={false} />)
    expect(screen.getByText('Динамика по дням')).toBeInTheDocument()
    // Legend toggles for each series
    expect(screen.getByText('Расходы')).toBeInTheDocument()
    expect(screen.getByText('Показы')).toBeInTheDocument()
    expect(screen.getByText('Клики')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('ROAS')).toBeInTheDocument()
  })

  it('renders chart container with data', () => {
    render(<DailyTrendChart data={mockData} isLoading={false} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders visible series lines by default (spend, views, clicks, orders)', () => {
    render(<DailyTrendChart data={mockData} isLoading={false} />)
    expect(screen.getByTestId('line-spend')).toBeInTheDocument()
    expect(screen.getByTestId('line-views')).toBeInTheDocument()
    expect(screen.getByTestId('line-clicks')).toBeInTheDocument()
    expect(screen.getByTestId('line-orders')).toBeInTheDocument()
    // ROAS is NOT in DEFAULT_DAILY_VISIBLE
    expect(screen.queryByTestId('line-roas')).not.toBeInTheDocument()
  })

  it('renders accessibility attributes', () => {
    render(<DailyTrendChart data={mockData} isLoading={false} />)
    expect(screen.getByRole('img', { name: /график ежедневной динамики/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /переключатели метрик/i })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DailyTrendChart data={mockData} isLoading={false} className="custom-class" />
    )
    expect(container.firstChild).toBeTruthy()
    // The Card should have the custom class
    const card = container.querySelector('.custom-class')
    expect(card).toBeTruthy()
  })
})
