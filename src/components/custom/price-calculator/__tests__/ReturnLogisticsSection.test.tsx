/**
 * Russian-locale guard for ReturnLogisticsSection's buyback label (iter-106).
 *
 * The effective-return label renders `buyback {buybackPct}%` → formatPercentage(buybackPct, 1).
 * buybackPct is fractional-capable (e.g. 98.5) so it MUST use formatPercentage(_, 1), NOT
 * formatPercentageInt (which would round 98.5→"99 %"). ReturnLogisticsSection has no other test;
 * its buyback JSX form differs from the (tested) ReturnLogisticsCalculator (inline expr vs
 * template literal), so it needs its own guard. `\s` matches the ru-RU NBSP.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReturnLogisticsSection } from '../ReturnLogisticsSection'

describe('ReturnLogisticsSection — buyback locale', () => {
  it('renders integer buyback as "98,0 %" (comma + NBSP)', () => {
    render(
      <ReturnLogisticsSection
        forwardLogistics={72.5}
        buybackPct={98}
        value={72.5}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/buyback 98,0\s%/)).toBeInTheDocument()
  })

  it('renders FRACTIONAL buyback as "98,5 %" (formatPercentage(_,1), not Int which rounds to 99)', () => {
    render(
      <ReturnLogisticsSection
        forwardLogistics={72.5}
        buybackPct={98.5}
        value={72.5}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/buyback 98,5\s%/)).toBeInTheDocument()
  })
})
