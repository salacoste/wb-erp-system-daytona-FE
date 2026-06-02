/**
 * Unit Tests for LiquidationScenarioCard
 * Epic 7 - Liquidity Analysis (Ликвидность товаров) — Story 7.3 Liquidation Planner
 *
 * Pins the Defensive Frontend Principle for the REAL backend scenario shape:
 * backend-omitted fields (new_price/expected_profit/is_profitable/velocity) render
 * "—" / no badge — never a fabricated 0 ₽ or false "Убыток". Also pins the ∞ sentinel
 * (target_days >= 999) and the profit color class (green ≥0 / red <0).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LiquidationScenario } from '@/types/liquidity'
import { LiquidationScenarioCard } from '../LiquidationScenarioCard'

/** Base scenario mirroring the live backend (omitted fields = null). */
function makeScenario(overrides: Partial<LiquidationScenario> = {}): LiquidationScenario {
  return {
    target_days: 999,
    required_velocity: null,
    velocity_multiplier: null,
    suggested_discount_pct: 50,
    new_price: null,
    expected_revenue: 156000,
    expected_profit: null,
    is_profitable: null,
    ...overrides,
  }
}

/** Find the value <p> rendered next to a labelled cell (label <p> + value <p>). */
function valueForLabel(label: string): HTMLElement {
  const labelEl = screen.getByText(label)
  const valueEl = labelEl.parentElement?.querySelector('p:last-of-type')
  if (!(valueEl instanceof HTMLElement)) {
    throw new Error(`No value element found for label "${label}"`)
  }
  return valueEl
}

describe('LiquidationScenarioCard', () => {
  describe('all-null backend fields (Defensive Frontend Principle)', () => {
    it('renders revenue, "—" for omitted fields, no profit badge, and ∞ sentinel', () => {
      render(<LiquidationScenarioCard scenario={makeScenario()} isRecommended={false} />)

      // Выручка: recovery → expected_revenue (156000). Locale uses NBSP grouping.
      const revenue = valueForLabel('Выручка')
      expect(revenue.textContent).toMatch(/156\s?000/)
      expect(revenue.textContent).toMatch(/₽/)

      // Новая цена + Прибыль omitted → "—"
      expect(valueForLabel('Новая цена').textContent).toBe('—')
      expect(valueForLabel('Прибыль').textContent).toBe('—')

      // is_profitable null → NO badge (neither "Убыток" nor "Прибыльно")
      expect(screen.queryByText('Убыток')).not.toBeInTheDocument()
      expect(screen.queryByText('Прибыльно')).not.toBeInTheDocument()

      // velocity omitted → "Требуемая скорость: —"
      expect(screen.getByText(/Требуемая скорость:\s*—/)).toBeInTheDocument()

      // target_days 999 → ∞ sentinel
      expect(screen.getByText('Продать за ∞ дней')).toBeInTheDocument()
    })
  })

  describe('is_profitable badge', () => {
    it('renders green "Прибыльно" badge when is_profitable is true', () => {
      render(
        <LiquidationScenarioCard
          scenario={makeScenario({ is_profitable: true })}
          isRecommended={false}
        />
      )

      const badge = screen.getByText('Прибыльно')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('div')?.className).toMatch(/text-green-700/)
      expect(screen.queryByText('Убыток')).not.toBeInTheDocument()
    })

    it('renders red "Убыток" badge when is_profitable is false', () => {
      render(
        <LiquidationScenarioCard
          scenario={makeScenario({ is_profitable: false })}
          isRecommended={false}
        />
      )

      const badge = screen.getByText('Убыток')
      expect(badge).toBeInTheDocument()
      expect(badge.closest('div')?.className).toMatch(/text-red-700/)
      expect(screen.queryByText('Прибыльно')).not.toBeInTheDocument()
    })
  })

  describe('profit color class', () => {
    it('renders negative profit with the red color class', () => {
      render(
        <LiquidationScenarioCard
          scenario={makeScenario({ expected_profit: -5000, is_profitable: false })}
          isRecommended={false}
        />
      )

      const profit = valueForLabel('Прибыль')
      expect(profit.textContent).toMatch(/5\s?000/)
      expect(profit.className).toMatch(/text-red-600/)
    })
  })
})
