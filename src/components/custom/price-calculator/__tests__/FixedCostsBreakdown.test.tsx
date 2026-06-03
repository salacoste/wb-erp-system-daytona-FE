/**
 * Tests for FixedCostsBreakdown — Russian-locale cost percentages.
 *
 * Regression: each cost line rendered dot-locale `${pct.toFixed(1)}%` ("20.0%"); now via
 * formatPercentage (comma + NBSP). Percentages = calculateCostPercentage(cost, price) = 0-100.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FixedCostsBreakdown } from '../FixedCostsBreakdown'
import type { TwoLevelFixedCosts } from '@/types/price-calculator'

const costs: TwoLevelFixedCosts = {
  cogs: 200, // 20% of 1000
  logisticsForward: 50,
  logisticsReverseEffective: 30,
  storage: 20,
  acceptance: 10,
  packaging: 0,
  logisticsToMp: 0,
  total: 310, // 31% of 1000
}

describe('FixedCostsBreakdown — Russian locale', () => {
  it('renders the COGS and total percentages in comma+NBSP locale, not dot-locale', () => {
    render(<FixedCostsBreakdown costs={costs} fulfillmentType="FBO" recommendedPrice={1000} />)
    expect(screen.getByText(/20,0\s+%/)).toBeInTheDocument() // cogs
    expect(screen.getByText(/31,0\s+%/)).toBeInTheDocument() // total
    expect(screen.queryByText('20.0%')).not.toBeInTheDocument()
    expect(screen.queryByText('31.0%')).not.toBeInTheDocument()
  })
})
