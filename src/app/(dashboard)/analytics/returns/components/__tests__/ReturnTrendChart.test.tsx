/**
 * ReturnTrendChart tests — Story 169.11-FE (shadcn migration)
 *
 * C4 state locks: initial loading skeleton, recoverable error DISTINCT from
 * valid empty, background refresh retaining prior content, and the sr-only
 * non-hover data alternative (exact period, units, every day + every series
 * value at tooltip precision, non-color series labels).
 * Recharts is mocked (jsdom doesn't size SVGs — liquidity 169.10 precedent).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

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

vi.mock('recharts', () => {
  const React = require('react')
  return {
    ComposedChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'composed-chart' }, children),
    Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
    Line: () => React.createElement('div', { 'data-testid': 'line' }),
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
    Legend: () => null,
  }
})

vi.mock('@/hooks/use-returns-daily', () => ({
  useReturnsDailyTrends: vi.fn(),
}))

import { useReturnsDailyTrends } from '@/hooks/use-returns-daily'
import { ReturnTrendChart } from '../ReturnTrendChart'
import type { ReturnsDailyResponse } from '@/types/returns-daily'

const mockUseReturnsDailyTrends = vi.mocked(useReturnsDailyTrends)

function hookReturn(overrides: Record<string, unknown> = {}) {
  return { data: undefined, isLoading: false, isError: false, ...overrides } as ReturnType<
    typeof useReturnsDailyTrends
  >
}

const daily = [
  {
    date: '2026-05-01',
    totalReturns: 6,
    returnRate: 3.25,
    cancellations: 3,
    refusals: 2,
    defects: 1,
  },
  {
    date: '2026-05-02',
    totalReturns: 4,
    returnRate: 2.0,
    cancellations: 1,
    refusals: 2,
    defects: 1,
  },
]

const responseData: ReturnsDailyResponse = {
  daily,
  period: { from: '2026-05-01', to: '2026-05-02' },
  summary: {
    totalReturns: 10,
    avgReturnRate: 2.6,
    totalCancellations: 4,
    totalRefusals: 4,
    totalDefects: 2,
  },
}

describe('ReturnTrendChart (Story 169.11 state locks)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial structural loading renders a skeleton inside the card', () => {
    mockUseReturnsDailyTrends.mockReturnValue(hookReturn({ isLoading: true }))
    const { container } = render(<ReturnTrendChart from="2026-05-01" to="2026-05-02" />)
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
    expect(screen.getByText('Возвраты по дням')).toBeInTheDocument()
  })

  it('recoverable error (destructive alert) is distinct from valid empty', () => {
    mockUseReturnsDailyTrends.mockReturnValue(hookReturn({ isError: true }))
    const { rerender } = render(<ReturnTrendChart from="a" to="b" />)
    expect(screen.getByText(/Не удалось загрузить данные о возвратах по дням/)).toBeInTheDocument()
    expect(screen.queryByText(/Нет данных о возвратах за выбранный период/)).not.toBeInTheDocument()

    mockUseReturnsDailyTrends.mockReturnValue(hookReturn({ data: undefined }))
    rerender(<ReturnTrendChart from="a" to="b" />)
    expect(screen.getByText(/Нет данных о возвратах за выбранный период/)).toBeInTheDocument()
    expect(
      screen.queryByText(/Не удалось загрузить данные о возвратах по дням/)
    ).not.toBeInTheDocument()
  })

  it('background refresh (isFetching with data) retains the prior content', () => {
    mockUseReturnsDailyTrends.mockReturnValue(hookReturn({ data: responseData, isFetching: true }))
    const { container } = render(<ReturnTrendChart from="2026-05-01" to="2026-05-02" />)
    // Prior data stays rendered: chart shell + sr-only rows are still present.
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    const rows = screen
      .getAllByRole('row')
      .filter(r => r.closest('table')?.className.includes('sr-only'))
    expect(rows.length).toBe(2 + 1) // header row + 2 data rows
    // No skeleton flash while usable content is retained (round-1 review F2).
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeInTheDocument()
  })

  it('keeps a partial backend day series visible without synthesizing missing dates', () => {
    const partialResponse: ReturnsDailyResponse = {
      ...responseData,
      period: { from: '2026-05-01', to: '2026-05-03' },
    }
    mockUseReturnsDailyTrends.mockReturnValue(hookReturn({ data: partialResponse }))

    const { container } = render(<ReturnTrendChart from="2026-05-01" to="2026-05-03" />)

    const rows = container.querySelectorAll('table.sr-only tbody tr')
    const body = container.querySelector('table.sr-only tbody')
    expect(rows).toHaveLength(2)
    expect(body).toHaveTextContent('2026-05-01')
    expect(body).toHaveTextContent('2026-05-02')
    expect(body).not.toHaveTextContent('2026-05-03')
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
  })

  it('background refresh swaps to refetched v2 content without skeleton flash (round-1 review F2)', () => {
    const { rerender, container } = render(<ReturnTrendChart from="2026-05-01" to="2026-05-02" />)
    mockUseReturnsDailyTrends.mockReturnValue(hookReturn({ data: responseData }))
    rerender(<ReturnTrendChart from="2026-05-01" to="2026-05-02" />)

    // v2: one changed day value (05-02 rate 2.0→2.5) + one extra day (05-03).
    const responseDataV2: ReturnsDailyResponse = {
      daily: [
        daily[0],
        {
          date: '2026-05-02',
          totalReturns: 5,
          returnRate: 2.5,
          cancellations: 2,
          refusals: 2,
          defects: 1,
        },
        {
          date: '2026-05-03',
          totalReturns: 7,
          returnRate: 3.75,
          cancellations: 3,
          refusals: 3,
          defects: 1,
        },
      ],
      period: { from: '2026-05-01', to: '2026-05-03' },
      summary: {
        totalReturns: 12,
        avgReturnRate: 3.2,
        totalCancellations: 5,
        totalRefusals: 5,
        totalDefects: 2,
      },
    }
    mockUseReturnsDailyTrends.mockReturnValue(
      hookReturn({ data: responseDataV2, isLoading: false, isFetching: true })
    )
    rerender(<ReturnTrendChart from="2026-05-01" to="2026-05-02" />)

    // v2 content rendered via the sr-only table…
    const table = container.querySelector('table.sr-only')
    expect(table).toBeInTheDocument()
    expect(table?.textContent).toContain('2026-05-03')
    expect(table?.textContent).toMatch(/2,5\s%/) // changed 05-02 rate
    // …with no skeleton appearing during the background refetch.
    expect(container.querySelector('[class*="animate-pulse"]')).not.toBeInTheDocument()
    expect(screen.queryByTestId('composed-chart')).toBeInTheDocument()
  })

  describe('sr-only data alternative (AC3 — no hover required)', () => {
    it('exposes exact period, units, every day and every series value at tooltip precision', () => {
      mockUseReturnsDailyTrends.mockReturnValue(hookReturn({ data: responseData }))
      const { container } = render(<ReturnTrendChart from="2026-05-01" to="2026-05-02" />)
      const table = container.querySelector('table.sr-only')
      expect(table).toBeInTheDocument()

      // Exact period in the caption
      const caption = table?.querySelector('caption')?.textContent ?? ''
      expect(caption).toContain('с 2026-05-01 по 2026-05-02')

      // Units declared: шт (counts) and % (rate)
      expect(caption).toContain('штуки')
      expect(caption).toContain('проценты')
      expect(table?.textContent).toContain('Доля возвратов, %')

      // Non-color series labels present
      for (const label of ['Отмены', 'Отказы', 'Брак', 'Итого возвратов']) {
        expect(table?.textContent).toContain(label)
      }

      // Every day + every series value, at tooltip precision
      // (formatReturnCount for counts — compact, .toFixed(0) below 1K;
      // formatPercentage for the rate — "3,3 %" / "2 %" with NBSP)
      const rows = table?.querySelectorAll('tbody tr') ?? []
      expect(rows.length).toBe(2)
      expect(rows[0].textContent).toContain('2026-05-01')
      expect(rows[0].textContent).toContain('3') // cancellations
      expect(rows[0].textContent).toMatch(/3,25\s%/) // returnRate 3.25 → "3,25 %" (tooltip precision)
      expect(rows[1].textContent).toContain('2026-05-02')
      expect(rows[1].textContent).toMatch(/2,0\s%/) // returnRate 2.0 → "2,0 %" (tooltip precision)
    })
  })
})
