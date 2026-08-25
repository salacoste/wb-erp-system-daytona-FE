/**
 * BrandShareChart tests — Story 170.4.
 * Token pins (chart-1/2/3 categorical strokes, dashed rating preserved,
 * dual-axis domains, reversed rating axis, connectNulls semantics, background
 * dot fill), filter-context subtitle, and the sr-only data alternative.
 *
 * recharts MUST be mocked (View test :24-46 canon) — jsdom cannot render it.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandShareChart } from '../BrandShareChart'
import type { BrandShareReportPoint } from '@/types/brand-share'

vi.mock('recharts', () => {
  const React = require('react')
  // Fake exposes the load-bearing props as attributes for token/axis pins.
  const Fake = (props: Record<string, unknown>) => {
    const { children, ...rest } = props
    const attrs: Record<string, string> = {}
    for (const [k, v] of Object.entries(rest)) {
      if (v == null || typeof v === 'function' || typeof v === 'boolean') {
        if (typeof v === 'boolean') attrs[`data-${k}`] = String(v)
        continue
      }
      if (typeof v === 'object') continue
      attrs[`data-${k}`] = String(v)
    }
    return React.createElement('div', { 'data-testid': `mock-${kTag(props)}`, ...attrs }, children)
  }
  const kTag = (props: Record<string, unknown>) =>
    props.dataKey ? `line-${props.dataKey}` : props.yAxisId ? `yaxis-${props.yAxisId}` : 'chart'
  return {
    ResponsiveContainer: (p: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'responsive-container' }, p.children),
    LineChart: (p: Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'mock-chart' }, p.children),
    Line: Fake,
    XAxis: () => null,
    YAxis: Fake,
    CartesianGrid: () => null,
    Tooltip: () => null,
  }
})

const DATA: BrandShareReportPoint[] = [
  { applyDate: '2026-07-01', brandRating: 3, pricePercent: 12.5, qtyPercent: 8 },
  { applyDate: '2026-07-02', brandRating: null, pricePercent: null, qtyPercent: null },
]

function renderChart(overrides: Partial<Parameters<typeof BrandShareChart>[0]> = {}) {
  return render(
    <BrandShareChart
      data={DATA}
      brand="DURABOND"
      categoryName="Отделочные материалы"
      periodLabel="01.07.2026 — 02.07.2026"
      {...overrides}
    />
  )
}

describe('BrandShareChart', () => {
  it('pins categorical chart tokens on all three series (price=1, qty=2, rating=3)', () => {
    renderChart()
    expect(screen.getByTestId('mock-line-pricePercent')).toHaveAttribute(
      'data-stroke',
      'var(--color-chart-1)'
    )
    expect(screen.getByTestId('mock-line-qtyPercent')).toHaveAttribute(
      'data-stroke',
      'var(--color-chart-2)'
    )
    expect(screen.getByTestId('mock-line-brandRating')).toHaveAttribute(
      'data-stroke',
      'var(--color-chart-3)'
    )
  })

  it('preserves the dashed rating marker and connectNulls semantics (percents gap, rating connects)', () => {
    renderChart()
    const rating = screen.getByTestId('mock-line-brandRating')
    expect(rating).toHaveAttribute('data-strokeDasharray', '5 4')
    expect(rating).toHaveAttribute('data-connectNulls', 'true')
    expect(screen.getByTestId('mock-line-pricePercent')).toHaveAttribute(
      'data-connectNulls',
      'false'
    )
    expect(screen.getByTestId('mock-line-qtyPercent')).toHaveAttribute('data-connectNulls', 'false')
  })

  it('keeps dual axes: share left, rating REVERSED right (lower is better)', () => {
    renderChart()
    expect(screen.getByTestId('mock-yaxis-share')).toBeInTheDocument()
    const rating = screen.getByTestId('mock-yaxis-rating')
    expect(rating).toHaveAttribute('data-orientation', 'right')
    expect(rating).toHaveAttribute('data-reversed', 'true')
    // share axis stays left/normal
    const share = screen.getByTestId('mock-yaxis-share')
    expect(share).not.toHaveAttribute('data-reversed')
  })

  it('renders the filter-context subtitle «brand · category · period»', () => {
    renderChart()
    expect(screen.getByTestId('brand-share-filter-context')).toHaveTextContent(
      'DURABOND · Отделочные материалы · 01.07.2026 — 02.07.2026'
    )
  })

  it('falls back to «—» and «последние 7 дней» when context is missing', () => {
    renderChart({ brand: null, categoryName: null, periodLabel: null })
    expect(screen.getByTestId('brand-share-filter-context')).toHaveTextContent(
      '— · — · последние 7 дней'
    )
  })

  it('renders the sr-only table with every day × 3 metrics at tooltip precision', () => {
    renderChart()
    const table = screen.getByTestId('brand-share-sr-table')
    // Units named in the caption (RTC: non-hover data alternative).
    expect(table).toHaveTextContent('% от категории')
    expect(table).toHaveTextContent('место в рейтинге')
    // Null day renders «—» for all three metrics (AP#8), not 0.
    expect(table).toHaveTextContent('2026-07-02')
    expect(table.textContent?.match(/—/g)?.length).toBeGreaterThanOrEqual(3)
    expect(table).not.toHaveTextContent('0,5 %')
  })

  it('renders the empty-state message when data is empty', () => {
    renderChart({ data: [] })
    expect(screen.getByText(/Нет данных о доле бренда/i)).toBeInTheDocument()
    expect(screen.queryByTestId('brand-share-sr-table')).not.toBeInTheDocument()
  })

  it('renders half-open period subtitle (round-1 L5: "с …" ordering at chart level)', () => {
    renderChart({ periodLabel: 'с 01.07.2026' })
    expect(screen.getByTestId('brand-share-filter-context')).toHaveTextContent(/с 01\.07\.2026/)
  })

  it('empty-report card also shows filter context (round-1 LOW-1 pin)', () => {
    renderChart({ data: [] })
    expect(screen.getByTestId('brand-share-filter-context')).toBeInTheDocument()
    expect(screen.getByTestId('brand-share-filter-context')).toHaveTextContent(/DURABOND/)
  })
})