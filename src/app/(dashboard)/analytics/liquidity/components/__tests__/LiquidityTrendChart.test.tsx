/**
 * LiquidityTrendChart + section tests
 * Story 165.4-FE: Liquidity Trends (Динамика ликвидности)
 *
 * Covers: populated (90-day), gaps (mixed zero + non-zero days), empty
 * (trends:[]), malformed (normalizer boundary), AC2 (no synthesized points),
 * and the sr-only a11y summary. Recharts is mocked (jsdom doesn't size SVGs).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LiquidityTrendChart } from '../LiquidityTrendChart'
import { LiquidityTrendTooltip } from '../LiquidityTrendTooltip'
import { LiquidityTrendsSection } from '../LiquidityTrendsSection'
import { LIQUIDITY_TREND_COLORS } from '../liquidity-trend-config'
import { normalizeLiquidityTrendsResponse } from '@/lib/api/liquidity-normalizer'
import { useLiquidityTrends } from '@/hooks/useLiquidity'
import type { TrendDataPoint, LiquidityTrendsResponse } from '@/types/liquidity'

// Mock window.matchMedia for JSDOM (prefers-reduced-motion guard).
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

// Mock recharts to avoid canvas/SVG sizing in JSDOM.
vi.mock('recharts', () => {
  const React = require('react')
  const Stub = ({ name }: { name: string }) => React.createElement('div', { 'data-testid': name })
  return {
    ComposedChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'composed-chart' }, children),
    AreaChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'area-chart' }, children),
    Area: () => React.createElement(Stub, { name: 'area' }),
    Line: () => React.createElement(Stub, { name: 'line' }),
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
  }
})

// ============================================================================
// Fixtures
// ============================================================================

function makePoint(date: string, overrides: Partial<TrendDataPoint> = {}): TrendDataPoint {
  return {
    date,
    distribution: { highly_liquid_pct: 60, medium_pct: 25, low_pct: 10, illiquid_pct: 5 },
    frozen_capital: 500_000,
    avg_turnover_days: 40,
    ...overrides,
  }
}

/** 90 points: 86 non-zero + 4 leading zero days (mirrors live cabinet shape). */
function make90DaySeries(): TrendDataPoint[] {
  const points: TrendDataPoint[] = []
  // 4 zero days at the start (2026-05-10..05-13)
  for (let i = 0; i < 4; i++) {
    const d = new Date(2026, 4, 10 + i)
    points.push(
      makePoint(d.toISOString().split('T')[0], {
        frozen_capital: 0,
        avg_turnover_days: 0,
        distribution: { highly_liquid_pct: 0, medium_pct: 0, low_pct: 0, illiquid_pct: 0 },
      })
    )
  }
  // 86 non-zero days (2026-05-14..2026-08-07)
  for (let i = 0; i < 86; i++) {
    const d = new Date(2026, 4, 14 + i)
    points.push(makePoint(d.toISOString().split('T')[0]))
  }
  return points
}

// ============================================================================
// Chart component tests
// ============================================================================

describe('LiquidityTrendChart', () => {
  it('169.10: all six series colors are chart-role var() tokens with zero collisions', () => {
    const values = Object.values(LIQUIDITY_TREND_COLORS)
    // 6 series / 6 distinct tokens.
    expect(values).toHaveLength(6)
    expect(new Set(values).size).toBe(6)
    for (const value of values) {
      expect(value).toMatch(/^var\(--color-chart-[1-6]\)$/)
    }
    // Distribution stack takes roles 1–4 in stack order; metrics take 5–6.
    expect(LIQUIDITY_TREND_COLORS.highly_liquid_pct).toBe('var(--color-chart-1)')
    expect(LIQUIDITY_TREND_COLORS.medium_pct).toBe('var(--color-chart-2)')
    expect(LIQUIDITY_TREND_COLORS.low_pct).toBe('var(--color-chart-3)')
    expect(LIQUIDITY_TREND_COLORS.illiquid_pct).toBe('var(--color-chart-4)')
    expect(LIQUIDITY_TREND_COLORS.frozen_capital).toBe('var(--color-chart-5)')
    expect(LIQUIDITY_TREND_COLORS.avg_turnover_days).toBe('var(--color-chart-6)')
  })

  it('renders the chart shell and both axis series when populated', () => {
    render(<LiquidityTrendChart data={make90DaySeries()} />)
    expect(screen.getByText('Динамика ликвидности')).toBeInTheDocument()
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId('line').length).toBe(2)
  })

  it('renders an sr-only summary table so screen readers get the numbers', () => {
    const data = [makePoint('2026-08-07'), makePoint('2026-08-06')]
    const { container } = render(<LiquidityTrendChart data={data} />)
    const sr = container.querySelector('table.sr-only')
    expect(sr).toBeTruthy()
    expect(sr?.querySelector('caption')?.textContent).toContain('Динамика ликвидности')
    expect(sr?.querySelectorAll('tbody tr').length).toBe(data.length)
    for (const label of [
      'Высоколиквидные',
      'Средняя ликвидность',
      'Низкая ликвидность',
      'Неликвид',
    ]) {
      expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument()
    }
  })

  it('AC2: renders ONLY the BE-provided points — no synthesized days (90 in -> 90 sr rows)', () => {
    const data = make90DaySeries()
    const { container } = render(<LiquidityTrendChart data={data} />)
    const rows = container.querySelectorAll('table.sr-only tbody tr')
    expect(rows.length).toBe(data.length) // exactly 90, no fill/interpolation
  })

  it('AC2: renders real zeros (zero-value days are NOT hidden)', () => {
    const data = [
      makePoint('2026-05-10', { frozen_capital: 0, avg_turnover_days: 0 }),
      makePoint('2026-05-14'),
    ]
    const { container } = render(<LiquidityTrendChart data={data} />)
    expect(container.querySelectorAll('table.sr-only tbody tr').length).toBe(2)
  })

  it('renders the legend labels in Russian', () => {
    render(<LiquidityTrendChart data={make90DaySeries()} />)
    // Labels appear in the legend (also echoed in sr-only headers) — assert presence.
    expect(screen.getAllByText('Замороженный капитал').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Средний оборот, дней').length).toBeGreaterThan(0)
  })

  it('hideHeader suppresses the duplicate Card title when embedded in a section', () => {
    render(<LiquidityTrendChart data={make90DaySeries()} hideHeader />)
    // Title gone, chart body still present
    expect(screen.queryByRole('heading', { name: 'Динамика ликвидности' })).not.toBeInTheDocument()
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })
})

// ============================================================================
// Tooltip (B1) — direct render, no crash on a full TrendDataPoint payload
// ============================================================================

describe('LiquidityTrendTooltip (B1 direct-render)', () => {
  it('renders date + frozen_capital + avg_turnover_days + 4 pct without throwing', () => {
    const point: TrendDataPoint = makePoint('2026-08-07')
    // Hand-built recharts payload shape: array of { payload: <datum> }.
    const tooltipPayload = [{ payload: point }]
    // Direct render — bypasses the global recharts Tooltip mock so the tooltip
    // component itself is validated. The distribution AreaChart now feeds
    // full TrendDataPoint rows (no flatten), so this is the exact shape it sees.
    expect(() => render(<LiquidityTrendTooltip active payload={tooltipPayload} />)).not.toThrow()

    // Tooltip header (RU full date) is present.
    expect(screen.getByText(/августа 2026/)).toBeInTheDocument()
    // Both metric labels + all 4 distribution labels render (proves
    // point.distribution[key] did not crash on undefined).
    expect(screen.getAllByText('Замороженный капитал').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Средний оборот, дней').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Высоколиквидные').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Средняя ликвидность').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Низкая ликвидность').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Неликвид').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Normalizer boundary (malformed-shape branch input)
// ============================================================================

describe('LiquidityTrendChart - malformed boundary (normalizer)', () => {
  it('normalizer coerces a missing-trends body to trends:[] (defensive, not synthesized)', () => {
    const normalized = normalizeLiquidityTrendsResponse({ meta: { cabinet_id: 'x' } })
    expect(normalized.trends).toEqual([])
    expect(normalized.insights).toEqual([])
  })

  it('normalizer preserves concrete BE numbers (null -> 0 via toCount, not masked by FE)', () => {
    const normalized = normalizeLiquidityTrendsResponse({
      meta: { cabinet_id: 'c', period_days: 90, generated_at: '2026-08-07T00:00:00Z' },
      trends: [
        {
          date: '2026-08-07',
          distribution: { highly_liquid_pct: 60, medium_pct: 25, low_pct: 10, illiquid_pct: 5 },
          frozen_capital: 123456,
          avg_turnover_days: 37,
        },
      ],
      insights: [{ type: 'info', message: 'Стабильно' }],
    })
    expect(normalized.trends[0].frozen_capital).toBe(123456)
    expect(normalized.trends[0].avg_turnover_days).toBe(37)
    expect(normalized.insights[0].type).toBe('info')
  })
})

// ============================================================================
// Section independent states (AC4)
// ============================================================================

vi.mock('@/hooks/useLiquidity', () => ({
  useLiquidityTrends: vi.fn(),
}))

// Cast the mocked hook to vitest's Mock for .mockReturnValue/.mockClear access.
const useLiquidityTrendsMock = useLiquidityTrends as unknown as ReturnType<typeof vi.fn>

function mockTrendsResult(
  result: Partial<{
    data: LiquidityTrendsResponse | undefined
    isLoading: boolean
    isError: boolean
    error: Error | null
    refetch: ReturnType<typeof vi.fn>
  }>
) {
  useLiquidityTrendsMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...result,
  })
}

describe('LiquidityTrendsSection - independent states (AC4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a scoped skeleton while loading (period selector still mounted)', () => {
    mockTrendsResult({ isLoading: true })
    const { container } = render(<LiquidityTrendsSection />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Период динамики' })).toBeInTheDocument()
  })

  it('renders the deferred empty message when trends:[] (no synthesized points)', () => {
    mockTrendsResult({
      data: {
        meta: { cabinet_id: 'c', period_days: 90, generated_at: '2026-08-07T00:00:00Z' },
        trends: [],
        insights: [{ type: 'info', message: 'Недостаточно данных' }],
      },
    })
    render(<LiquidityTrendsSection />)
    expect(screen.getByText('Исторические снимки ликвидности пока не собраны')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU)', () => {
    mockTrendsResult({ isError: true, error: new Error('boom') })
    render(<LiquidityTrendsSection />)
    expect(
      screen.getByText('Не удалось загрузить динамику ликвидности. Попробуйте ещё раз.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('M3: malformed response throws in getLiquidityTrends -> isError -> canonical error + retry (not empty)', () => {
    // B2: a malformed response (no meta/trends) now THROWS at the API boundary,
    // surfacing as TanStack `isError` with the canonical message. The dead
    // `malformed` prop/branch is gone; this test pins the new contract.
    mockTrendsResult({
      isError: true,
      error: new Error('Malformed liquidity trends response'),
      isLoading: false,
    })
    render(<LiquidityTrendsSection />)
    expect(
      screen.getByText('Не удалось загрузить динамику ликвидности. Попробуйте ещё раз.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
    // The deferred empty message must NOT appear on the error branch.
    expect(
      screen.queryByText('Исторические снимки ликвидности пока не собраны')
    ).not.toBeInTheDocument()
  })

  it('renders the chart when populated and hides error/empty states', () => {
    mockTrendsResult({
      data: {
        meta: { cabinet_id: 'c', period_days: 90, generated_at: '2026-08-07T00:00:00Z' },
        trends: make90DaySeries(),
        insights: [],
      },
    })
    render(<LiquidityTrendsSection />)
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Повторить/ })).not.toBeInTheDocument()
    expect(
      screen.queryByText('Исторические снимки ликвидности пока не собраны')
    ).not.toBeInTheDocument()
  })

  it('default period 90 is passed to the hook', () => {
    mockTrendsResult({ isLoading: true })
    render(<LiquidityTrendsSection />)
    expect(useLiquidityTrendsMock).toHaveBeenCalledWith(
      expect.objectContaining({ period: 90 }),
      expect.anything()
    )
  })

  it('retry button invokes refetch', () => {
    const refetch = vi.fn()
    mockTrendsResult({ isError: true, error: new Error('boom'), refetch })
    render(<LiquidityTrendsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('changing the period selector changes the hook param', () => {
    mockTrendsResult({ isLoading: true })
    render(<LiquidityTrendsSection />)
    useLiquidityTrendsMock.mockClear()
    mockTrendsResult({ isLoading: true })
    fireEvent.click(screen.getByRole('button', { name: '30 дн.' }))
    expect(useLiquidityTrendsMock).toHaveBeenCalledWith(
      expect.objectContaining({ period: 30 }),
      expect.anything()
    )
  })
})
