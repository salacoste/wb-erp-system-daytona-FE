/**
 * Story 169.10 chip-token pins: table category badge + benchmarks status chip.
 *
 * Both chips migrated from lib runtime hex (config.bgColor/config.color,
 * statusConfig.color/statusConfig.textClass) to the route chip pattern:
 * color-mix(token 15%) bg + color-mix(token 30%) border + text-foreground
 * (chart/status hex as chip TEXT on a tint fails AA in light).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LiquidityItem, LiquidityBenchmarks } from '@/types/liquidity'
import { LiquidityTableRowCells } from '../LiquidityTableRowCells'
import { LiquidityBenchmarks as LiquidityBenchmarksSection } from '../LiquidityBenchmarks'

function makeItem(overrides: Partial<LiquidityItem> = {}): LiquidityItem {
  return {
    sku_id: '12345',
    product_name: 'Тестовый товар',
    category: 'Категория',
    brand: 'Бренд',
    current_stock_qty: 10,
    avg_stock_qty_30d: 12,
    stock_value: 5000,
    units_sold_30d: 30,
    velocity_per_day: 1,
    turnover_days: 20,
    liquidity_category: 'highly_liquid',
    current_price: 900,
    cogs_per_unit: 500,
    recommendation: 'Держать цену',
    action_type: 'MAINTAIN',
    liquidation_scenarios: null,
    ...overrides,
  }
}

describe('LiquidityTableRowCells — 169.10 category badge chip', () => {
  it('renders the badge with a color-mix token background and no raw hex', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <LiquidityTableRowCells item={makeItem()} isExpanded={false} onPlannerOpen={() => {}} />
          </tr>
        </tbody>
      </table>
    )
    expect(screen.getByText(/Ликвид\./)).toBeInTheDocument()
    const badge = Array.from(container.querySelectorAll<HTMLElement>('*')).find(el =>
      el.style.backgroundColor.includes('color-mix(in srgb, var(--color-chart-1) 15%')
    )
    expect(badge).toBeDefined()
    expect(badge!.style.color).toBe('var(--color-foreground)')
    expect(badge!.style.borderColor).toContain('color-mix(in srgb, var(--color-chart-1) 30%')

    const hexRe = /#[0-9A-Fa-f]{3,8}/
    container.querySelectorAll<HTMLElement>('*').forEach(el => {
      for (const v of [el.style.color, el.style.backgroundColor, el.style.borderColor]) {
        expect(v, el.tagName).not.toMatch(hexRe)
      }
    })
  })
})

function makeBenchmarks(overrides: Partial<LiquidityBenchmarks> = {}): LiquidityBenchmarks {
  return {
    your_avg_turnover: 25,
    target_avg_turnover: 30,
    industry_avg_turnover: 40,
    highly_liquid_pct: 55,
    target_highly_liquid_pct: 50,
    illiquid_pct: 3,
    target_illiquid_pct: 5,
    overall_status: 'excellent',
    ...overrides,
  }
}

describe('LiquidityBenchmarks — 169.10 status chip', () => {
  it('names every benchmark progress indicator', () => {
    render(<LiquidityBenchmarksSection benchmarks={makeBenchmarks()} />)

    expect(
      screen.getByRole('progressbar', { name: 'Выполнение цели по среднему обороту' })
    ).toBeVisible()
    expect(
      screen.getByRole('progressbar', {
        name: 'Выполнение цели по доле высоколиквидных товаров',
      })
    ).toBeVisible()
    expect(
      screen.getByRole('progressbar', { name: 'Выполнение цели по доле неликвидных товаров' })
    ).toBeVisible()
  })

  it('renders the chip with a color-mix status-token tint and no legacy text classes', () => {
    const { container } = render(<LiquidityBenchmarksSection benchmarks={makeBenchmarks()} />)
    expect(screen.getByText('Отлично')).toBeInTheDocument()
    const chip = Array.from(container.querySelectorAll<HTMLElement>('*')).find(el =>
      el.style.backgroundColor.includes('color-mix(in srgb, var(--color-status-success) 15%')
    )
    expect(chip).toBeDefined()
    expect(chip!.style.color).toBe('var(--color-foreground)')
    expect(chip!.className).not.toMatch(/text-(?:lime|orange|red|green)-\d{2,3}/)
    expect(chip!.className).not.toMatch(/text-status-/)
    // No raw hex anywhere inline
    const hexRe = /#[0-9A-Fa-f]{3,8}/
    container.querySelectorAll<HTMLElement>('*').forEach(el => {
      for (const v of [el.style.color, el.style.backgroundColor, el.style.borderColor]) {
        expect(v, el.tagName).not.toMatch(hexRe)
      }
    })
  })
})
