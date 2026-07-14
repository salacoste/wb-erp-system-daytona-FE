/**
 * Unit tests for TrendBadge (StorageTrendsChartParts).
 *
 * iter-74 (dot-locale percent consolidation): TrendBadge rendered `${trend.toFixed(1)}%` (dot-locale
 * "5.0%") → migrated to `{isPositive ? '+' : ''}{formatPercentage(trend, 1)}` (ru-RU "5,0 %", comma
 * + NBSP). These tests lock the sign contract (+ only for positives; Intl emits the minus itself;
 * no sign for 0) and the comma/NBSP locale. `\s` matches the NBSP; `[-−]` tolerates U+002D / U+2212.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendBadge, SummaryStats } from '../StorageTrendsChartParts'
import type { MoneyMetricSummary } from '@/types/storage-analytics'

// Count ruble markers (₽) in rendered output. RTL has no getAllTextContent; inspect container.
function countRubles(container: HTMLElement): number {
  return (container.textContent?.match(/₽/g) || []).length
}

describe('TrendBadge (StorageTrendsChartParts)', () => {
  it('renders a positive trend with a leading + and comma+NBSP percent (no double sign)', () => {
    render(<TrendBadge trend={12.5} />)
    expect(screen.getByText(/^\+12,5\s%$/)).toBeInTheDocument()
  })

  it('renders a negative trend with a minus and no +', () => {
    render(<TrendBadge trend={-8.5} />)
    expect(screen.getByText(/^[-−]8,5\s%$/)).toBeInTheDocument()
  })

  it('renders a zero trend with no sign at all', () => {
    render(<TrendBadge trend={0} />)
    expect(screen.getByText(/^0,0\s%$/)).toBeInTheDocument()
  })

  it('never renders the dot-locale form', () => {
    render(<TrendBadge trend={12.5} />)
    expect(screen.queryByText(/12\.5%/)).not.toBeInTheDocument()
  })
})

// BD-44/AP#8: SummaryStats renders storage_cost (money) — null min/max/avg → '—', never «0 ₽».
describe('SummaryStats (StorageTrendsChartParts) — BD-44 null money', () => {
  it('renders numeric min/max/avg as currency', () => {
    const summary: MoneyMetricSummary = { min: 1000, max: 2000, avg: 1500, trend: 5 }
    const { container } = render(<SummaryStats summary={summary} />)
    // Three currency-formatted values render (one ₽ per slot).
    expect(countRubles(container)).toBe(3)
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('renders "—" for null min/max/avg (never «0 ₽»)', () => {
    const summary: MoneyMetricSummary = { min: null, max: null, avg: null, trend: 0 }
    const { container } = render(<SummaryStats summary={summary} />)
    // Three em-dashes for the three null money slots.
    expect(screen.getAllByText('—')).toHaveLength(3)
    // No currency rendered at all (all null).
    expect(countRubles(container)).toBe(0)
    // AP#8: no fabricated «0 ₽» lie.
    expect(container.textContent).not.toMatch(/0\s*₽/)
  })

  it('renders a partial-null mix (min numeric, max/avg null) honestly', () => {
    const summary: MoneyMetricSummary = { min: 500, max: null, avg: null, trend: -2 }
    const { container } = render(<SummaryStats summary={summary} />)
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(countRubles(container)).toBe(1)
  })
})
