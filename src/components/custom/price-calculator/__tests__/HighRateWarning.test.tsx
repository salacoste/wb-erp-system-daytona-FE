/**
 * Unit tests for HighRateWarning.
 *
 * iter-75 (dot-locale percent consolidation): the alert titles/body rendered dot-locale
 * `${x.toFixed(1)}%` / `${pct.toFixed(0)}%` → migrated to formatPercentage / formatPercentageInt
 * (ru-RU "77,5 %" / "60 %", comma + NBSP). The component previously had ZERO test coverage; these
 * tests lock the threshold branching (null < 75, warning 75–84, critical >= 85) and the locale.
 * (formatPercentage is also a subtle correctness fix vs toFixed's IEEE-754 half-rounding at .x05
 * boundaries, e.g. 75.05.toFixed(1)→"75.0" but Intl→"75,1 %" — not merely a cosmetic locale swap.)
 *
 * Threshold control: the fixture's percentageCosts sum to 22.5 (commission 15 + acquiring 1.5 +
 * tax 6 + vat 0); totalPctRate = 22.5 + drrPct + marginPct, so the two props drive the band.
 * `\s` matches the NBSP separator.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HighRateWarning } from '../HighRateWarning'
import { mockTwoLevelPricingResult } from '@/test/fixtures/price-calculator'

describe('HighRateWarning', () => {
  it('renders nothing below the 75% warning threshold', () => {
    const { container } = render(
      <HighRateWarning result={mockTwoLevelPricingResult} drrPct={5} marginPct={20} /> // 47.5%
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the warning band (75–84%) with comma+NBSP percents', () => {
    render(<HighRateWarning result={mockTwoLevelPricingResult} drrPct={5} marginPct={50} />) // 77.5%
    expect(screen.getByText(/Высокая суммарная ставка: 77,5\s%/)).toBeInTheDocument()
    expect(screen.getByText(/только 22,5\s% от цены/)).toBeInTheDocument()
  })

  it('renders the critical band (>=85%) with whole-percent contributors', () => {
    render(<HighRateWarning result={mockTwoLevelPricingResult} drrPct={10} marginPct={60} />) // 92.5%
    expect(screen.getByText(/Критически высокая ставка: 92,5\s%/)).toBeInTheDocument()
    // contributorsText: top-3 by pct desc, whole percents via formatPercentageInt
    expect(
      screen.getByText(/Маржа 60\s%, Комиссия WB 15\s%, DRR \(реклама\) 10\s%/)
    ).toBeInTheDocument()
  })

  it('never renders the dot-locale form', () => {
    render(<HighRateWarning result={mockTwoLevelPricingResult} drrPct={5} marginPct={50} />)
    expect(screen.queryByText(/77\.5%/)).not.toBeInTheDocument()
  })
})
