/**
 * LiquiditySummaryBar tests — Story 169.10 presentation migration.
 *
 * Pins: solid semantic icon-chip pairs (169.9 canon) and the LOCAL frozen-capital
 * danger tier. The tier reuses the lib-documented thresholds
 * (liquidity-utils isFrozenCapitalHealthy <5; formatFrozenCapitalWarning >5/>10)
 * but no longer applies the lib's legacy getFrozenCapitalStatusClass text classes.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LiquiditySummary } from '@/types/liquidity'
import { LiquiditySummaryBar } from '../LiquiditySummaryBar'

function makeSummary(overrides: Partial<LiquiditySummary> = {}): LiquiditySummary {
  return {
    total_inventory_value: 2_500_000,
    total_sku_count: 42,
    avg_turnover_days: 22,
    frozen_capital: 300_000,
    frozen_capital_pct: 12,
    ...overrides,
  } as LiquiditySummary
}

function valueForLabel(label: string): HTMLElement {
  const labelEl = screen.getByText(label)
  // The metric value is the large <p>; the frozen block also renders a small
  // warning <p> below it, so p:last-of-type would miss the value.
  const valueEl = labelEl.parentElement?.querySelector('p.text-lg')
  if (!(valueEl instanceof HTMLElement)) {
    throw new Error(`No value element found for label "${label}"`)
  }
  return valueEl
}

describe('LiquiditySummaryBar — semantic icon chips (169.10)', () => {
  it('renders the four solid semantic chip pairs', () => {
    const { container } = render(<LiquiditySummaryBar summary={makeSummary()} />)
    const chips = Array.from(container.querySelectorAll('.rounded-lg'))
    const chipClasses = chips.map(chip => chip.className)

    // Всего на складе + Средний оборот → information pair; Артикулов → muted;
    // Замороженный капитал → error pair (chip owns the foreground).
    expect(chipClasses.filter(c => /bg-status-information /.test(c))).toHaveLength(2)
    expect(chipClasses.filter(c => /bg-muted /.test(c))).toHaveLength(1)
    expect(chipClasses.filter(c => /bg-status-error /.test(c))).toHaveLength(1)
  })

  it('renders numeric values with tabular-nums', () => {
    render(<LiquiditySummaryBar summary={makeSummary()} />)
    for (const label of [
      'Всего на складе',
      'Артикулов',
      'Средний оборот',
      'Замороженный капитал',
    ]) {
      expect(valueForLabel(label).className).toMatch(/tabular-nums/)
    }
  })
})

describe('LiquiditySummaryBar — frozen-capital danger tier (local mapping)', () => {
  it('pct > 10 (critical): value + warning render text-status-error', () => {
    render(<LiquiditySummaryBar summary={makeSummary({ frozen_capital_pct: 12 })} />)
    expect(valueForLabel('Замороженный капитал').className).toMatch(/text-status-error/)
    expect(screen.getByText(/Критически высокий уровень/).className).toMatch(/text-status-error/)
  })

  it('pct in (5, 10] (elevated): still the danger tier token', () => {
    render(<LiquiditySummaryBar summary={makeSummary({ frozen_capital_pct: 7 })} />)
    expect(valueForLabel('Замороженный капитал').className).toMatch(/text-status-error/)
    expect(screen.getByText(/Выше нормы/)).toBeInTheDocument()
  })

  it('frozen tier-collapse guard: pct <= 5 renders neutral foreground, no warning', () => {
    const { container } = render(
      <LiquiditySummaryBar summary={makeSummary({ frozen_capital_pct: 3 })} />
    )
    const value = valueForLabel('Замороженный капитал')
    expect(value.className).toMatch(/text-foreground/)
    expect(value.className).not.toMatch(/text-status-error/)
    expect(container.textContent).not.toMatch(/Выше нормы|Критически высокий/)
  })
})
