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
import { TrendBadge } from '../StorageTrendsChartParts'

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
