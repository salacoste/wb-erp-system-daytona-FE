/**
 * Unit tests for ExpenseSummaryBadge.
 *
 * iter-77 (dot-locale percent consolidation): revenueShare + wowChange rendered dot-locale
 * `${x.toFixed(1)}%` → migrated to formatPercentage(x, 1) ("12,5 %", comma + NBSP). The component
 * had ZERO coverage; these tests lock the locale, the wowChange sign (+ only for positive; Intl
 * emits the minus), and the null/absent branches. `\s` matches the NBSP separator.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpenseSummaryBadge } from './expense-chart-badge'

describe('ExpenseSummaryBadge', () => {
  it('renders revenueShare as comma+NBSP percent', () => {
    render(<ExpenseSummaryBadge total={1000} revenueShare={12.5} />)
    expect(screen.getByText(/^12,5\s%$/)).toBeInTheDocument()
  })

  it('renders a positive wowChange with a leading + (no double sign)', () => {
    render(<ExpenseSummaryBadge total={110} previousTotal={100} />) // +10%
    expect(screen.getByText(/^\+10,0\s%$/)).toBeInTheDocument()
  })

  it('renders a negative wowChange with a minus and no +', () => {
    render(<ExpenseSummaryBadge total={90} previousTotal={100} />) // -10%
    expect(screen.getByText(/^-10,0\s%$/)).toBeInTheDocument()
  })

  it('renders a zero wowChange as "0,0 %" with no sign', () => {
    render(<ExpenseSummaryBadge total={100} previousTotal={100} />) // 0%
    expect(screen.getByText(/^0,0\s%$/)).toBeInTheDocument()
  })

  it('omits the revenue-share section when revenueShare is absent', () => {
    render(<ExpenseSummaryBadge total={1000} />)
    expect(screen.queryByText(/% от выручки/)).not.toBeInTheDocument()
  })

  it('never renders the dot-locale form', () => {
    render(<ExpenseSummaryBadge total={1000} revenueShare={12.5} />)
    expect(screen.queryByText(/12\.5%/)).not.toBeInTheDocument()
  })
})
