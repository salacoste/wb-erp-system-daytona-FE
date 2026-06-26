/**
 * Tests for LiquidityDistributionCards — category avg-turnover rendering.
 *
 * Regression: the "Ср. оборот" sub-label rendered raw `{item.avg_turnover_days} дней`, so the
 * illiquid category (backend sentinel avg ≈ 999) showed "999 дней" instead of "Нет продаж",
 * inconsistent with the table/summary. Now routed through formatTurnoverDays.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LiquidityDistribution } from '@/types/liquidity'
import { LiquidityDistributionCards } from '../LiquidityDistributionCards'

function makeDistribution(): LiquidityDistribution {
  const cat = (
    count: number,
    value: number,
    pct: number,
    avg_turnover_days: number,
    no_sales_count = 0
  ) => ({
    count,
    value,
    pct,
    avg_turnover_days,
    no_sales_count,
  })
  return {
    highly_liquid: cat(4, 0, 9, 15),
    medium: cat(0, 0, 0, 0),
    low: cat(0, 0, 0, 0),
    illiquid: cat(41, 1925500, 91, 999),
  }
}

describe('LiquidityDistributionCards — avg turnover', () => {
  it('renders the illiquid category avg turnover (999) as "Нет продаж", not "999 дней"', () => {
    render(
      <LiquidityDistributionCards
        distribution={makeDistribution()}
        activeFilter={null}
        onCardClick={() => {}}
      />
    )
    expect(screen.getByText(/Ср\. оборот: Нет продаж/)).toBeInTheDocument()
    expect(screen.queryByText(/999/)).not.toBeInTheDocument()
  })

  it('renders a liquid category avg turnover with correct grammar (15 → "15 дней")', () => {
    render(
      <LiquidityDistributionCards
        distribution={makeDistribution()}
        activeFilter={null}
        onCardClick={() => {}}
      />
    )
    expect(screen.getByText(/Ср\. оборот: 15 дней/)).toBeInTheDocument()
  })

  it('renders a 0-turnover category as "< 1 дня" (fast mover, not "0 дней")', () => {
    render(
      <LiquidityDistributionCards
        distribution={makeDistribution()}
        activeFilter={null}
        onCardClick={() => {}}
      />
    )
    // medium + low both have avg_turnover_days 0 → "< 1 дня"
    expect(screen.getAllByText(/Ср\. оборот: < 1 дня/)).toHaveLength(2)
  })

  it('shows neutral "Нет продаж за период" headline for zero-sales categories (TZ-12)', () => {
    render(
      <LiquidityDistributionCards
        distribution={makeDistribution()}
        activeFilter={null}
        onCardClick={() => {}}
      />
    )
    // illiquid (avg_turnover_days=999 → all SKUs zero sales) shows neutral framing.
    expect(screen.getByText('Нет продаж за период')).toBeInTheDocument()
  })

  it('shows the percentage headline for selling categories (TZ-12)', () => {
    render(
      <LiquidityDistributionCards
        distribution={makeDistribution()}
        activeFilter={null}
        onCardClick={() => {}}
      />
    )
    // highly_liquid (pct=9, avg_turnover_days=15 → selling) shows its percentage, not "Нет продаж".
    expect(screen.getByText(/9,0\s*%/)).toBeInTheDocument()
  })
})
