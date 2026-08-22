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

  describe('velocity (Russian-locale comma decimal)', () => {
    it('renders non-null velocity + multiplier with comma decimals (formatDecimal)', () => {
      // text is interpolation-split across nodes → assert via container.textContent
      const { container } = render(
        <LiquidationScenarioCard
          scenario={makeScenario({ required_velocity: 12.5, velocity_multiplier: 1.5 })}
          isRecommended={false}
        />
      )
      expect(container.textContent).toContain('Требуемая скорость: 12,5 шт./день')
      expect(container.textContent).toContain('×1,5')
    })

    it('renders velocity WITHOUT the multiplier sub-fragment when velocity_multiplier is null', () => {
      const { container } = render(
        <LiquidationScenarioCard
          scenario={makeScenario({ required_velocity: 5, velocity_multiplier: null })}
          isRecommended={false}
        />
      )
      expect(container.textContent).toContain('Требуемая скорость: 5,0 шт./день')
      expect(container.textContent).not.toContain('от текущей')
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
      // 169.10: /15-chip semantic pair (was bg-green-100 text-green-700).
      expect(badge.closest('div')?.className).toMatch(/text-status-success/)
      expect(badge.closest('div')?.className).toMatch(/bg-status-success\/15/)
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
      // 169.10: /15-chip semantic pair (was bg-red-100 text-red-700).
      expect(badge.closest('div')?.className).toMatch(/text-status-error/)
      expect(badge.closest('div')?.className).toMatch(/bg-status-error\/15/)
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
      // 169.10: financial token (was text-red-600).
      expect(profit.className).toMatch(/text-financial-negative/)
    })

    it('renders positive profit with the financial-positive token class', () => {
      render(
        <LiquidationScenarioCard
          scenario={makeScenario({ expected_profit: 12000, is_profitable: true })}
          isRecommended={false}
        />
      )
      const profit = valueForLabel('Прибыль')
      expect(profit.className).toMatch(/text-financial-positive/)
    })
  })

  describe('169.10 presentation tokens', () => {
    it('colors the urgency Clock icon by the lib LABEL (no hex getScenarioUrgencyColor)', () => {
      // Aggressive (<=30d) → error token
      const { rerender, container } = render(
        <LiquidationScenarioCard
          scenario={makeScenario({ target_days: 30 })}
          isRecommended={false}
        />
      )
      const clock = container.querySelector('svg')
      // SVG className is SVGAnimatedString in jsdom — read the attribute.
      expect(clock?.getAttribute('class')).toMatch(/text-status-error/)
      expect(clock?.getAttribute('style')).toBeNull()

      // Balanced (31..60d) → warning token
      rerender(
        <LiquidationScenarioCard
          scenario={makeScenario({ target_days: 60 })}
          isRecommended={false}
        />
      )
      expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/text-status-warning/)

      // Conservative (>60d) → success token
      rerender(
        <LiquidationScenarioCard
          scenario={makeScenario({ target_days: 90 })}
          isRecommended={false}
        />
      )
      expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/text-status-success/)
    })

    it('renders the recommended card with the theme ring token (ring-ring)', () => {
      const { container, rerender } = render(
        <LiquidationScenarioCard scenario={makeScenario()} isRecommended={true} />
      )
      const recommendedCard = container.querySelector('div[class*="ring-2"]')
      expect(recommendedCard?.className).toMatch(/ring-ring/)
      expect(recommendedCard?.className).toMatch(/shadow-md/)

      rerender(<LiquidationScenarioCard scenario={makeScenario()} isRecommended={false} />)
      expect(container.querySelector('div[class*="ring-2"]')).toBeNull()
    })

    it('renders the discount value with the financial-negative token', () => {
      render(<LiquidationScenarioCard scenario={makeScenario()} isRecommended={false} />)
      expect(valueForLabel('Скидка').className).toMatch(/text-financial-negative/)
    })
  })
})
