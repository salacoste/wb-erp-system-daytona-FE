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

  it('set-size tier-collapse guard: an EMPTY category never claims "Нет продаж за период"', () => {
    // count=0 (the set is empty) must collapse the no-sales tier even when the
    // backend sentinel avg_turnover_days=999 leaks through for empty buckets —
    // "Нет продаж" is a statement about actual SKUs, and there are none.
    const distribution: LiquidityDistribution = {
      ...makeDistribution(),
      medium: { count: 0, value: 0, pct: 0, avg_turnover_days: 999, no_sales_count: 0 },
    }
    render(
      <LiquidityDistributionCards
        distribution={distribution}
        activeFilter={null}
        onCardClick={() => {}}
      />
    )
    // Only the illiquid card (41 SKUs, avg=999) shows the no-sales headline.
    expect(screen.getAllByText('Нет продаж за период')).toHaveLength(1)
  })
})

describe('LiquidityDistributionCards — 169.10 theme-aware color tokens', () => {
  // Card category key → chart-role token (same roles as the trend chart stack)
  const EXPECTED_TOKENS: Record<string, string> = {
    Высоколиквидный: 'var(--color-chart-1)',
    'Средняя ликвидность': 'var(--color-chart-2)',
    'Низкая ликвидность': 'var(--color-chart-3)',
    Неликвид: 'var(--color-chart-4)',
  }

  it('keeps chart-role tokens on fills (border/ring/tint) — never as text color (Story 174.2 C16)', () => {
    const { container } = render(
      <LiquidityDistributionCards
        distribution={makeDistribution()}
        activeFilter="highly_liquid"
        onCardClick={() => {}}
      />
    )
    for (const label of Object.keys(EXPECTED_TOKENS)) {
      const labelEl = screen.getByText(label)
      // Story 174.2 (C16): chart-N tokens are fill/stroke roles only — the text
      // label is muted and carries NO inline text color (chart-3-as-text measured
      // a marginal 4.52:1).
      expect(labelEl.className).toContain('text-muted-foreground')
      expect(labelEl.style.color).toBe('')
    }
    // Headline % (KPI-value canon) uses default foreground, not a chart token
    expect(screen.getByText(/9,0\s*%/).style.color).toBe('')
    // The ACTIVE card keeps its chart-role token on the border (stroke use)
    const activeCard = screen.getByText('Высоколиквидный').closest<HTMLElement>('.cursor-pointer')
    expect(activeCard).not.toBeNull()
    expect(activeCard?.style.borderColor).toBe(EXPECTED_TOKENS['Высоколиквидный'])
    // The targetShare chip keeps the token as a 15% background tint (fill use)
    const chip = container.querySelector<HTMLElement>('.rounded-full')
    expect(chip).not.toBeNull()
    expect(chip?.style.backgroundColor).toContain('color-mix')
    expect(chip?.style.backgroundColor).toContain('var(--color-chart-1)')
  })

  it('negative: no inline color anywhere on the cards matches a raw hex value', () => {
    const { container } = render(
      <LiquidityDistributionCards
        distribution={makeDistribution()}
        activeFilter={null}
        onCardClick={() => {}}
      />
    )
    const hexRe = /#[0-9A-Fa-f]{3,8}/
    const all = container.querySelectorAll<HTMLElement>('*')
    const offenders: string[] = []
    all.forEach(el => {
      const { color, borderColor, backgroundColor } = el.style
      for (const v of [color, borderColor, backgroundColor]) {
        if (v && hexRe.test(v)) offenders.push(`${el.tagName}:${v}`)
      }
    })
    expect(offenders).toEqual([])
  })
})
