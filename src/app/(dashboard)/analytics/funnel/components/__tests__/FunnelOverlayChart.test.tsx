import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FunnelOverlayChart } from '../FunnelOverlayChart'
import type { MergedChartDay } from '../funnel-overlay-config'

// Mock window.matchMedia for JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock recharts to avoid canvas/SVG rendering issues in JSDOM
vi.mock('recharts', () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

function makeDay(overrides: Partial<MergedChartDay> = {}): MergedChartDay {
  return {
    date: '2026-03-01',
    openCardCount: 100,
    ordersCount: 20,
    buyoutCount: 15,
    totalConversion: 15,
    adSpend: null,
    ...overrides,
  }
}

describe('FunnelOverlayChart', () => {
  it('renders loading skeleton when isLoading', () => {
    render(<FunnelOverlayChart data={[]} isLoading={true} showAdOverlay={false} />)
    const skeleton = document.querySelector('.h-64')
    expect(skeleton).toBeTruthy()
  })

  it('renders error alert when isError', () => {
    render(<FunnelOverlayChart data={[]} isLoading={false} isError={true} showAdOverlay={false} />)
    expect(screen.getByText('Не удалось загрузить график')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(<FunnelOverlayChart data={[]} isLoading={false} showAdOverlay={false} />)
    expect(screen.getByText('Нет данных для графика за выбранный период')).toBeInTheDocument()
  })

  it('renders chart with title when data provided', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    expect(screen.getByText('Динамика воронки по дням')).toBeInTheDocument()
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('renders funnel legend items', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    expect(screen.getByText('Просмотры')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Выкупы')).toBeInTheDocument()
  })

  it('shows ad spend legend when overlay is active', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ adSpend: 5000 })]}
        isLoading={false}
        showAdOverlay={true}
      />
    )
    expect(screen.getByText('Расходы на рекламу')).toBeInTheDocument()
  })

  it('hides ad spend legend when overlay is off', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    expect(screen.queryByText('Расходы на рекламу')).not.toBeInTheDocument()
  })

  it('has accessible chart container', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    const chartContainer = screen.getByRole('img')
    expect(chartContainer).toHaveAttribute(
      'aria-label',
      'График воронки с наложением рекламных расходов'
    )
  })

  it('renders legend toggle buttons with aria-pressed', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-pressed')
    })
  })
})
