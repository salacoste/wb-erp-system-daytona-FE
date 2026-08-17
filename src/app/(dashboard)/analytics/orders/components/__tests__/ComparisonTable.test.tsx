/**
 * Regression tests for ComparisonTable DeltaIndicator (Orders Analytics → Comparison tab).
 *
 * Guards the 2026-06-04 fix: the backend emits `Infinity` for a change-percent when the previous
 * period had a zero baseline (e.g. a new seller — historical-analytics.controller.ts:455). The FE
 * normalizer preserves it (`Number(x ?? 0)` only catches null), and DeltaIndicator did
 * `value.toFixed(1)` → the literal JS string "Infinity", rendering a nonsense "+Infinity%" cell.
 * Now non-finite renders "∞".
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComparisonTable } from '../ComparisonTable'
import type { CompareResponse } from '@/types/fbs-analytics'

function makeData(overrides: Partial<CompareResponse['comparison']> = {}): CompareResponse {
  const period = {
    from: '2025-01-01',
    to: '2025-01-31',
    ordersCount: 100,
    revenue: 500000,
    avgOrderValue: 5000,
    cancellationRate: 3.2,
  }
  return {
    period1: period,
    period2: { ...period, ordersCount: 0, revenue: 0, avgOrderValue: 0 },
    comparison: {
      ordersChangePercent: Infinity,
      revenueChangePercent: Infinity,
      avgOrderValueChangePercent: Infinity,
      cancellationRateChange: 1.5,
      ...overrides,
    },
  } as unknown as CompareResponse
}

describe('ComparisonTable — Infinity delta (zero-baseline period)', () => {
  it('renders "∞", never the raw JS "Infinity" string', () => {
    render(<ComparisonTable data={makeData()} />)
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument()
    // The ∞ glyph appears for the infinite change percents (orders/revenue/avg).
    expect(screen.getAllByText(/∞/).length).toBeGreaterThan(0)
  })

  it('renders a finite change percent in Russian locale (+25,0 %, comma + space — not dot-locale)', () => {
    render(<ComparisonTable data={makeData({ revenueChangePercent: 25 })} />)
    // "+25,0 %" — comma decimal + NBSP before %. \s requires the space; the dot form "+25.0%" must NOT appear.
    expect(screen.getByText(/\+25,0\s+%/)).toBeInTheDocument()
    expect(screen.queryByText(/25\.0%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument()
  })

  it('renders a negative delta with a leading minus and comma decimal', () => {
    render(<ComparisonTable data={makeData({ revenueChangePercent: -12.4 })} />)
    expect(screen.getByText(/−12,4\s+%/)).toBeInTheDocument() // U+2212 minus, comma decimal
  })
})

// Story 168.5: delta sign must use semantic financial tokens, not the legacy palette
// (matches 168.4 deltaColorClass precedent).
describe('ComparisonTable — semantic token pins (Story 168.5)', () => {
  it('positive delta renders the exact text-financial-positive class', () => {
    const { container } = render(<ComparisonTable data={makeData({ revenueChangePercent: 25 })} />)
    const positive = container.querySelectorAll('.text-financial-positive')
    expect(positive.length).toBeGreaterThan(0)
    expect(container.querySelector('.text-financial-negative')).toBeNull()
  })

  it('negative delta renders the exact text-financial-negative class', () => {
    // Make ALL deltas negative — other rows default to Infinity (positive) which
    // would legitimately render the positive token.
    const { container } = render(
      <ComparisonTable
        data={makeData({
          ordersChangePercent: -5,
          revenueChangePercent: -12.4,
          avgOrderValueChangePercent: -3,
          cancellationRateChange: -0.7,
        })}
      />
    )
    const negative = container.querySelectorAll('.text-financial-negative')
    expect(negative.length).toBeGreaterThan(0)
    expect(container.querySelector('.text-financial-positive')).toBeNull()
  })

  it('renders no legacy palette classes (DOM guard)', () => {
    const { container } = render(
      <ComparisonTable data={makeData({ revenueChangePercent: -12.4 })} />
    )
    // Widened legacy-palette regex — must stay zero after the 168.5 token migration.
    expect(
      container.innerHTML.match(
        /(bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?/
      )
    ).toBeNull()
  })
})
