import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { FunnelOverlayChart } from '../FunnelOverlayChart'
import type { MergedChartDay } from '../funnel-overlay-config'

let prefersReducedMotion = false

expect.extend(toHaveNoViolations)

// Mock window.matchMedia for JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion,
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
  Bar: ({
    dataKey,
    animationDuration,
    fillOpacity,
    strokeDasharray,
  }: {
    dataKey: string
    animationDuration: number
    fillOpacity?: number
    strokeDasharray?: string
  }) => (
    <div
      data-testid={`bar-${dataKey}`}
      data-data-key={dataKey}
      data-animation-duration={animationDuration}
      data-fill-opacity={fillOpacity}
      data-stroke-dasharray={strokeDasharray}
    />
  ),
  Line: ({ dataKey, animationDuration }: { dataKey: string; animationDuration: number }) => (
    <div
      data-testid={`line-${dataKey}`}
      data-data-key={dataKey}
      data-animation-duration={animationDuration}
    />
  ),
  XAxis: ({ tick, axisLine, tickLine }: AxisProps) => (
    <div
      data-testid="x-axis"
      data-tick-fill={tick?.fill}
      data-axis-stroke={axisLine?.stroke}
      data-tick-stroke={tickLine?.stroke}
    />
  ),
  YAxis: ({ yAxisId, tick, axisLine }: AxisProps & { yAxisId: string }) => (
    <div
      data-testid={`y-axis-${yAxisId}`}
      data-tick-fill={tick?.fill}
      data-axis-stroke={axisLine?.stroke}
    />
  ),
  CartesianGrid: ({ stroke }: { stroke: string }) => (
    <div data-testid="cartesian-grid" data-stroke={stroke} />
  ),
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

interface AxisProps {
  tick?: { fill?: string }
  axisLine?: { stroke?: string }
  tickLine?: { stroke?: string }
}

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
  beforeEach(() => {
    prefersReducedMotion = false
  })

  it('renders loading skeleton when isLoading', () => {
    render(
      <FunnelOverlayChart
        data={[]}
        isLoading={true}
        showAdOverlay={false}
        periodFrom="2026-03-01"
        periodTo="2026-03-07"
      />
    )

    const frame = screen.getByRole('figure', { name: 'Динамика воронки по дням' })
    expect(frame).toHaveAttribute('data-state', 'loading')
    expect(within(frame).getByText(/Период:/).parentElement).toHaveTextContent(
      '01.03.2026 — 07.03.2026'
    )
  })

  it('renders an identified recoverable ChartFrame error state', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <FunnelOverlayChart
        data={[]}
        isLoading={false}
        isError={true}
        showAdOverlay={false}
        onRetry={onRetry}
      />
    )

    expect(screen.getByRole('figure', { name: 'Динамика воронки по дням' })).toHaveAttribute(
      'data-state',
      'error'
    )
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку графика' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('retains cached funnel evidence when a background chart refresh fails', () => {
    render(
      <FunnelOverlayChart data={[makeDay()]} isLoading={false} isError showAdOverlay={false} />
    )

    const frame = screen.getByRole('figure', { name: 'Динамика воронки по дням' })
    expect(frame).toHaveAttribute('data-state', 'partial')
    expect(screen.getByText(/ранее загруженные данные воронки/i)).toBeVisible()
    expect(screen.getByRole('table', { name: 'Данные воронки по дням' })).toBeVisible()
  })

  it('renders empty state when no data', () => {
    render(<FunnelOverlayChart data={[]} isLoading={false} showAdOverlay={false} />)
    expect(screen.getByRole('figure', { name: 'Динамика воронки по дням' })).toHaveAttribute(
      'data-state',
      'empty'
    )
    expect(screen.getByText('Нет данных для графика за выбранный период')).toBeInTheDocument()
  })

  it('renders chart with title when data provided', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    expect(screen.getByText('Динамика воронки по дням')).toBeInTheDocument()
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('uses the shared ChartFrame identity for rendered funnel evidence', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)

    const frame = screen.getByRole('figure', { name: 'Динамика воронки по дням' })
    expect(frame).toHaveAttribute('data-chart-frame')
    expect(frame).toHaveAttribute('data-state', 'rendered')
  })

  it('uses the selected route period and funnel-only units when advertising is off', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ date: '2026-03-02' }), makeDay({ date: '2026-03-05' })]}
        isLoading={false}
        showAdOverlay={false}
        periodFrom="2026-03-01"
        periodTo="2026-03-07"
      />
    )

    const frame = screen.getByRole('figure', { name: 'Динамика воронки по дням' })
    expect(within(frame).getByText(/Период:/).parentElement).toHaveTextContent(
      '01.03.2026 — 07.03.2026'
    )
    expect(within(frame).getByText(/Единицы:/).parentElement).toHaveTextContent('штуки и проценты')
    expect(within(frame).getByText(/Единицы:/).parentElement).not.toHaveTextContent('рубл')
    expect(screen.getByRole('group', { name: 'График этапов воронки' })).toBeVisible()
  })

  it('truthfully names advertising units and overlay when advertising is on', () => {
    render(
      <FunnelOverlayChart data={[makeDay({ adSpend: 5000 })]} isLoading={false} showAdOverlay />
    )

    const frame = screen.getByRole('figure', { name: 'Динамика воронки по дням' })
    expect(within(frame).getByText(/Единицы:/).parentElement).toHaveTextContent(
      'штуки, проценты и рубли'
    )
    expect(
      screen.getByRole('group', { name: 'График этапов воронки с рекламными расходами' })
    ).toBeVisible()
  })

  it('renders funnel legend items', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    expect(screen.getByRole('button', { name: 'Просмотры' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Заказы' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выкупы' })).toBeInTheDocument()
  })

  it('shows ad spend legend when overlay is active', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ adSpend: 5000 })]}
        isLoading={false}
        showAdOverlay={true}
      />
    )
    expect(screen.getByRole('button', { name: 'Расходы на рекламу' })).toBeInTheDocument()
  })

  it('hides ad spend legend when overlay is off', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    expect(screen.queryByText('Расходы на рекламу')).not.toBeInTheDocument()
  })

  it('names the plot through ChartFrame group semantics instead of a generic image', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)

    expect(screen.getByRole('group', { name: 'График этапов воронки' })).toBeVisible()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('provides a keyboard-reachable named data alternative', async () => {
    const user = userEvent.setup()
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)

    const alternative = screen.getByRole('region', {
      name: 'Точные данные графика воронки',
    })
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    expect(alternative).toHaveFocus()
    expect(within(alternative).getByRole('table', { name: 'Данные воронки по дням' })).toBeVisible()
  })

  it('uses the named chart alternative as the only horizontal scroll owner', () => {
    render(
      <FunnelOverlayChart data={[makeDay({ adSpend: 5000 })]} isLoading={false} showAdOverlay />
    )

    const alternative = screen.getByRole('region', { name: 'Точные данные графика воронки' })
    expect(alternative).toHaveClass('overflow-x-auto')
    expect(alternative.querySelectorAll('.overflow-auto, .overflow-x-auto')).toHaveLength(0)
    expect(within(alternative).getByRole('table')).toHaveClass('min-w-[48rem]')
  })

  it('renders one equivalent data row for every plotted day', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ date: '2026-03-01' }), makeDay({ date: '2026-03-02' })]}
        isLoading={false}
        showAdOverlay={true}
      />
    )

    const table = screen.getByRole('table', { name: 'Данные воронки по дням' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
  })

  it('exposes every plotted funnel and advertising value without hover', () => {
    render(
      <FunnelOverlayChart
        data={[
          makeDay({
            date: '2026-03-02',
            openCardCount: 1234,
            ordersCount: 234,
            buyoutCount: 123,
            totalConversion: 9.97,
            adSpend: 4567.89,
          }),
        ]}
        isLoading={false}
        showAdOverlay={true}
      />
    )

    const table = screen.getByRole('table', { name: 'Данные воронки по дням' })
    const row = within(table).getAllByRole('row')[1]
    expect(row).toHaveTextContent('02.03.2026')
    expect(row).toHaveTextContent('1 234')
    expect(row).toHaveTextContent('234')
    expect(row).toHaveTextContent('123')
    expect(row).toHaveTextContent('9,97%')
    expect(row).toHaveTextContent('4 567,89 ₽')
  })

  it('renders missing advertising spend as unavailable instead of a trustworthy zero', () => {
    render(
      <FunnelOverlayChart data={[makeDay({ adSpend: null })]} isLoading={false} showAdOverlay />
    )

    const table = screen.getByRole('table', { name: 'Данные воронки по дням' })
    const adSpendCell = within(table).getAllByRole('row')[1].lastElementChild
    expect(adSpendCell).toHaveTextContent('Недоступно')
    expect(adSpendCell).not.toHaveTextContent('0 ₽')
  })

  it('retains funnel evidence as partial when advertising fails and exposes retry', async () => {
    const onRetryAdvertising = vi.fn()
    const user = userEvent.setup()
    render(
      <FunnelOverlayChart
        data={[makeDay({ adSpend: null })]}
        isLoading={false}
        showAdOverlay
        isAdError
        onRetryAdvertising={onRetryAdvertising}
      />
    )

    const frame = screen.getByRole('figure', { name: 'Динамика воронки по дням' })
    expect(frame).toHaveAttribute('data-state', 'partial')
    expect(screen.getByText(/Рекламные расходы не загрузились/)).toBeVisible()
    expect(screen.getByRole('table', { name: 'Данные воронки по дням' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку рекламы' }))
    expect(onRetryAdvertising).toHaveBeenCalledOnce()
  })

  it('does not call advertising unavailable while the overlay request is still loading', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ adSpend: null })]}
        isLoading={false}
        showAdOverlay
        isAdLoading
      />
    )

    const frame = screen.getByRole('figure', { name: 'Динамика воронки по дням' })
    expect(frame).toHaveAttribute('data-state', 'rendered')
    expect(screen.getByText('Загружаются расходы на рекламу')).toBeVisible()
    expect(screen.queryByText(/Рекламные расходы недоступны/)).not.toBeInTheDocument()
  })

  it('labels retained advertising values after a background advertising refresh error', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ adSpend: 5000 })]}
        isLoading={false}
        showAdOverlay
        isAdError
      />
    )

    expect(screen.getByText(/ранее загруженные рекламные расходы/i)).toBeVisible()
    expect(screen.getByText(/5 000/)).toBeVisible()
  })

  it('reports both failed scopes when funnel and retained advertising refreshes fail together', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ adSpend: 5000 })]}
        isLoading={false}
        isError
        showAdOverlay
        isAdError
      />
    )

    expect(screen.getByText(/ранее загруженные данные воронки/i)).toBeVisible()
    expect(screen.getByText(/ранее загруженные рекламные расходы/i)).toBeVisible()
  })

  it('reports unavailable advertising when both funnel and initial advertising requests fail', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ adSpend: null })]}
        isLoading={false}
        isError
        showAdOverlay
        isAdError
      />
    )

    expect(screen.getByText(/ранее загруженные данные воронки/i)).toBeVisible()
    expect(screen.getByText(/Рекламные расходы не загрузились/i)).toBeVisible()
  })

  it('reports partial advertising days alongside a retained funnel refresh failure', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay({ date: '2026-03-01', adSpend: 5000 }), makeDay({ date: '2026-03-02' })]}
        isLoading={false}
        isError
        showAdOverlay
      />
    )

    expect(screen.getByText(/ранее загруженные данные воронки/i)).toBeVisible()
    expect(screen.getByText(/недоступны для 1 из 2 дней/i)).toBeVisible()
  })

  it('marks an all-null advertising overlay as partial instead of rendered', () => {
    render(
      <FunnelOverlayChart data={[makeDay({ adSpend: null })]} isLoading={false} showAdOverlay />
    )

    expect(screen.getByRole('figure', { name: 'Динамика воронки по дням' })).toHaveAttribute(
      'data-state',
      'partial'
    )
    expect(screen.getByText(/Рекламные расходы недоступны за выбранный период/)).toBeVisible()
  })

  it('discloses that product selection does not filter the global chart query', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay()]}
        isLoading={false}
        showAdOverlay={false}
        selectedProductCount={2}
      />
    )

    expect(
      screen.getByText(/Выбрано товаров: 2.*график показывает общую воронку по кабинету/)
    ).toBeVisible()
  })

  it('uses semantic border and axis tokens for Recharts scaffolding', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay />)

    expect(screen.getByTestId('cartesian-grid')).toHaveAttribute(
      'data-stroke',
      'var(--color-border)'
    )
    expect(screen.getByTestId('x-axis')).toHaveAttribute(
      'data-tick-fill',
      'var(--color-chart-axis)'
    )
    expect(screen.getByTestId('x-axis')).toHaveAttribute('data-axis-stroke', 'var(--color-border)')
    expect(screen.getByTestId('x-axis')).toHaveAttribute('data-tick-stroke', 'var(--color-border)')
    expect(screen.getByTestId('y-axis-left')).toHaveAttribute(
      'data-tick-fill',
      'var(--color-chart-axis)'
    )
    expect(screen.getByTestId('y-axis-right')).toHaveAttribute(
      'data-axis-stroke',
      'var(--color-border)'
    )
  })

  it('gives funnel bars distinct non-color marker treatments', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)

    expect(screen.getByTestId('bar-openCardCount')).toHaveAttribute('data-fill-opacity', '0.9')
    expect(screen.getByTestId('bar-ordersCount')).toHaveAttribute('data-fill-opacity', '0.35')
    expect(screen.getByTestId('bar-buyoutCount')).toHaveAttribute('data-fill-opacity', '0.15')
    expect(screen.getByTestId('bar-buyoutCount')).toHaveAttribute('data-stroke-dasharray', '4 2')
    expect(screen.getByRole('button', { name: 'Просмотры' })).toHaveAccessibleDescription(
      'сплошной столбец'
    )
    expect(screen.getByRole('button', { name: 'Заказы' })).toHaveAccessibleDescription(
      'контурный столбец'
    )
  })

  it('has no automated accessibility violations in the rendered overlay state', async () => {
    const { container } = render(
      <FunnelOverlayChart data={[makeDay({ adSpend: 4567.89 })]} isLoading={false} showAdOverlay />
    )

    expect(await axe(container)).toHaveNoViolations()
  })

  it('describes the effect when a series is hidden', async () => {
    const user = userEvent.setup()
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)

    await user.click(screen.getByRole('button', { name: 'Заказы' }))

    expect(screen.getByText('Скрытые серии: Заказы')).toBeVisible()
    expect(screen.queryByTestId('bar-ordersCount')).not.toBeInTheDocument()
  })

  it('explains when daily granularity is unavailable without rendering a plot', () => {
    render(
      <FunnelOverlayChart
        data={[makeDay()]}
        isLoading={false}
        showAdOverlay={false}
        dailyGranularityAvailable={false}
      />
    )

    expect(
      screen.getByText(/Посуточная разбивка воронки недоступна.*таблице и карточках ниже/)
    ).toBeVisible()
    expect(screen.getByRole('figure', { name: 'Динамика воронки по дням' })).toHaveAttribute(
      'data-state',
      'unavailable'
    )
    expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument()
  })

  it('disables animation for every rendered series when reduced motion is preferred', () => {
    prefersReducedMotion = true

    render(
      <FunnelOverlayChart data={[makeDay({ adSpend: 5000 })]} isLoading={false} showAdOverlay />
    )

    expect(screen.getByTestId('bar-openCardCount')).toHaveAttribute('data-animation-duration', '0')
    expect(screen.getByTestId('bar-ordersCount')).toHaveAttribute('data-animation-duration', '0')
    expect(screen.getByTestId('bar-buyoutCount')).toHaveAttribute('data-animation-duration', '0')
    expect(screen.getByTestId('line-adSpend')).toHaveAttribute('data-animation-duration', '0')
  })

  it('renders legend toggle buttons with aria-pressed', () => {
    render(<FunnelOverlayChart data={[makeDay()]} isLoading={false} showAdOverlay={false} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-pressed')
    })
  })
})
