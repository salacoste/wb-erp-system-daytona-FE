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
