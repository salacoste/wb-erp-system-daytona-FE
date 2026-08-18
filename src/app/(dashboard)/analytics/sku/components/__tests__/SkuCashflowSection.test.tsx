/**
 * Tests for SkuCashflowSection — the "Полный Cashflow" card.
 * Focus (DEFECT 4): a no-sales period (sales_gross = 0) must NOT fabricate "% of revenue" badges
 * (the `|| 1` safe-divide would otherwise render absurd values like "Логистика 50000 %" over a
 * 0 ₽ baseline) — it shows an honest empty-state instead.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuCashflowSection } from '../SkuCashflowSection'
import type { CabinetLevelExpenses } from '@/hooks/margin-analytics-query-keys'

function makeExpenses(overrides: Partial<CabinetLevelExpenses> = {}): CabinetLevelExpenses {
  return {
    sales_gross: 100000,
    returns_gross: 0,
    marketplace_commission: 15000,
    acquiring_fee: 1000,
    cogs_total: 40000,
    gross_profit_sku: 44000,
    logistics: 5000,
    storage: 2000,
    storage_weekly_report: 2000,
    storage_difference: 0,
    other_adjustments: 0,
    wb_commission_adj: 0,
    penalties: 0,
    paid_acceptance: 0,
    total: 9000,
    weeks_included: ['2026-W01'],
    ...overrides,
  }
}

describe('SkuCashflowSection', () => {
  it('renders an honest empty-state (no fabricated %) when there are no sales (sales_gross = 0)', () => {
    // Residual expenses exist but no sales — the old code rendered "Логистика 50000 %" etc.
    renderWithProviders(
      <SkuCashflowSection
        cabinetExpenses={makeExpenses({ sales_gross: 0, logistics: 500, total: 500 })}
        isLoading={false}
      />
    )
    expect(screen.getByText(/Нет продаж за период/)).toBeInTheDocument()
    // No fabricated percentage from the || 1 safe-divide (500 / 1 * 100 = 50000).
    expect(screen.queryByText(/50000/)).not.toBeInTheDocument()
    // The waterfall rows are not rendered.
    expect(screen.queryByText('Продажи (gross)')).not.toBeInTheDocument()
  })

  it('renders the full waterfall when there are sales', () => {
    renderWithProviders(
      <SkuCashflowSection
        cabinetExpenses={makeExpenses({ sales_gross: 100000 })}
        isLoading={false}
      />
    )
    expect(screen.getByText('Продажи (gross)')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument() // baseline badge
    expect(screen.queryByText(/Нет продаж за период/)).not.toBeInTheDocument()
  })

  it('BD-11: labels the final row «ПРИБЫЛЬ ДО НАЛОГА» (pre-tax), not «ЧИСТАЯ ПРИБЫЛЬ»', () => {
    // SKU cashflow net = gross_profit_sku − cabinet deductions ≈ payout (PRE-tax). Relabelled
    // so it no longer collides with the dashboard's post-tax «Чистая прибыль» (BD-11).
    renderWithProviders(
      <SkuCashflowSection
        cabinetExpenses={makeExpenses({ sales_gross: 100000 })}
        isLoading={false}
      />
    )
    expect(screen.getByText('ПРИБЫЛЬ ДО НАЛОГА')).toBeInTheDocument()
    expect(screen.queryByText('ЧИСТАЯ ПРИБЫЛЬ')).not.toBeInTheDocument()
  })

  it('shows skeletons while loading', () => {
    const { container } = renderWithProviders(
      <SkuCashflowSection cabinetExpenses={undefined} isLoading />
    )
    // Header still renders; body is skeletons, not a fabricated waterfall.
    expect(screen.getByText('Полный Cashflow')).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  // 168.9 token migration pins — exact classList.contains, no [class*=].
  it('168.9: gradient card uses tokenized two-tone (info→warning /10 stops)', () => {
    const { container } = renderWithProviders(
      <SkuCashflowSection cabinetExpenses={makeExpenses()} isLoading={false} />
    )
    const card = container.querySelector('[data-slot="card"]') ?? container.firstElementChild!
    expect(card.classList.contains('bg-gradient-to-br')).toBe(true)
    expect(card.classList.contains('from-status-information/10')).toBe(true)
    expect(card.classList.contains('to-status-warning/10')).toBe(true)
    expect(card.classList.contains('border-status-information/30')).toBe(true)
  })

  it('168.9: ИТОГО row = status-warning /15 bg with nested /20 badge (visibility on tinted row)', () => {
    renderWithProviders(<SkuCashflowSection cabinetExpenses={makeExpenses()} isLoading={false} />)
    const row = screen
      .getByText('ИТОГО общекабинетные расходы')
      .closest('div.flex.items-center.justify-between')
    expect(row!.classList.contains('bg-status-warning/15')).toBe(true)
    expect(row!.classList.contains('border-status-warning/40')).toBe(true)
    const badge = screen.getByText(/−9\.0%/)
    expect(badge.classList.contains('bg-status-warning/20')).toBe(true)
    expect(badge.classList.contains('text-status-warning')).toBe(true)
  })

  it('168.9: empty-state text uses muted-foreground', () => {
    renderWithProviders(
      <SkuCashflowSection
        cabinetExpenses={makeExpenses({ sales_gross: 0, total: 0 })}
        isLoading={false}
      />
    )
    expect(
      screen.getByText(/Нет продаж за период/).classList.contains('text-muted-foreground')
    ).toBe(true)
  })

  it('168.9 DOM-guard: no raw blue/amber/gray palette classes leak into the cashflow card', () => {
    const { container } = renderWithProviders(
      <SkuCashflowSection cabinetExpenses={makeExpenses()} isLoading={false} />
    )
    const raw = container.innerHTML.match(
      /(?:bg|text|border|from|to)-(?:blue|amber|red|green|gray|yellow)-[0-9]{2,3}/g
    )
    expect(raw).toBeNull()
  })
})
