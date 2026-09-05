/**
 * Tests for CashflowRowPrimitives — 168.9 shadcn token migration pins.
 * Waterfall rows → financial-positive/negative; blue subtotal → status-information.
 * P2 wave-3 pass-1: fg-on-tint re-pin — rows sit on the GRADIENT cashflow card
 * (from-status-information/10 to-status-warning/10), where colored-token-on-tint fails
 * AA at any alpha (fin-neg on /10 row = 4.18 light in-situ; info/15 badge = 3.59), so
 * all row/badge TEXT is pinned to text-foreground; valence = tint bg + border (kept).
 * Exact classList.contains assertions (no [class*=] substring matches).
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { CashflowRow, PctBadge, GrossProfitRow, NetProfitRow } from '../CashflowRowPrimitives'

const pct = (v: number) => ((v / 1000) * 100).toFixed(1)

/** Find the outer row element (justify-between flex container) that owns the given label text. */
function rowOf(label: string): HTMLElement {
  const el = screen.getByText(label).closest('div.flex.items-center.justify-between')
  if (!el) throw new Error(`row not found for label: ${label}`)
  return el as HTMLElement
}

describe('CashflowRow ROW_STYLES (168.9 tokens)', () => {
  it('positive variant: /5 bg + /30 border kept, symbol/value = text-foreground (fg-on-tint)', () => {
    renderWithProviders(<CashflowRow variant="positive" symbol="+" label="Продажи" value="100 ₽" />)
    const row = rowOf('Продажи')
    expect(row.classList.contains('bg-financial-positive/5')).toBe(true)
    expect(row.classList.contains('border-financial-positive/30')).toBe(true)
    expect(screen.getByText('+').classList.contains('text-foreground')).toBe(true)
    expect(screen.getByText('100 ₽').classList.contains('text-foreground')).toBe(true)
  })

  it('positive variant does NOT leak negative tokens (sign isolation)', () => {
    renderWithProviders(<CashflowRow variant="positive" symbol="+" label="Продажи" value="100 ₽" />)
    const row = rowOf('Продажи')
    expect(row.classList.contains('bg-financial-negative/10')).toBe(false)
    expect(screen.getByText('100 ₽').classList.contains('text-financial-negative')).toBe(false)
  })

  it('negative variant: financial-negative bg/border kept, symbol/value = text-foreground (fg-on-tint)', () => {
    renderWithProviders(<CashflowRow variant="negative" symbol="−" label="Возвраты" value="10 ₽" />)
    const row = rowOf('Возвраты')
    expect(row.classList.contains('bg-financial-negative/10')).toBe(true)
    expect(row.classList.contains('border-financial-negative/30')).toBe(true)
    expect(screen.getByText('−').classList.contains('text-foreground')).toBe(true)
    expect(screen.getByText('10 ₽').classList.contains('text-foreground')).toBe(true)
  })

  it('neutral variant: muted bg + border-border, foreground text', () => {
    renderWithProviders(<CashflowRow variant="neutral" symbol="=" label="Чистые" value="90 ₽" />)
    const row = rowOf('Чистые')
    expect(row.classList.contains('bg-muted')).toBe(true)
    expect(row.classList.contains('border-border')).toBe(true)
    expect(screen.getByText('=').classList.contains('text-muted-foreground')).toBe(true)
    expect(screen.getByText('90 ₽').classList.contains('text-foreground')).toBe(true)
  })

  it('badge chip: /5 AA tint kept, text = text-foreground (fg-on-tint)', () => {
    renderWithProviders(
      <CashflowRow variant="positive" symbol="+" label="Продажи" badge="100%" value="100 ₽" />
    )
    const badge = screen.getByText('100%')
    expect(badge.classList.contains('bg-financial-positive/5')).toBe(true)
    expect(badge.classList.contains('text-foreground')).toBe(true)
  })
})

describe('PctBadge (168.9 tokens)', () => {
  it('default (deduction) = financial-negative /5 chip, text-foreground (fg-on-tint)', () => {
    renderWithProviders(<PctBadge value={10} pct={pct} />)
    const badge = screen.getByText(/1\.0%/)
    expect(badge.classList.contains('bg-financial-negative/5')).toBe(true)
    expect(badge.classList.contains('text-foreground')).toBe(true)
  })

  it('isRemaining = muted neutral chip', () => {
    renderWithProviders(<PctBadge value={90} pct={pct} isRemaining />)
    const badge = screen.getByText(/9\.0%/)
    expect(badge.classList.contains('bg-muted')).toBe(true)
    expect(badge.classList.contains('text-muted-foreground')).toBe(true)
  })

  it('custom colorClass passes through verbatim', () => {
    renderWithProviders(<PctBadge value={10} pct={pct} colorClass="bg-status-warning/20" />)
    expect(screen.getByText(/1\.0%/).classList.contains('bg-status-warning/20')).toBe(true)
  })
})

describe('GrossProfitRow (blue = informational subtotal accent)', () => {
  it('isPositive: status-information bg/border kept, value/badge = text-foreground (fg-on-tint)', () => {
    renderWithProviders(<GrossProfitRow grossProfitSku={44000} pct={pct} />)
    const row = rowOf('Валовая прибыль по SKU')
    expect(row.classList.contains('bg-status-information/10')).toBe(true)
    expect(row.classList.contains('border-2')).toBe(true)
    expect(row.classList.contains('border-status-information/30')).toBe(true)
    expect(screen.getByText(/44 000/).classList.contains('text-foreground')).toBe(true)
    expect(screen.getByText(/4400\.0%/).classList.contains('text-foreground')).toBe(true)
  })

  it('negative gross profit: tint identity switches to financial-negative, text stays foreground', () => {
    renderWithProviders(<GrossProfitRow grossProfitSku={-5000} pct={pct} />)
    expect(screen.getByText(/-5 000/).classList.contains('text-foreground')).toBe(true)
    const badge = screen.getByText(/-500\.0%/)
    expect(badge.classList.contains('bg-financial-negative/5')).toBe(true)
    expect(badge.classList.contains('text-foreground')).toBe(true)
  })
})

describe('NetProfitRow (final profit = financial sign)', () => {
  it('positive: /5 bg + /40 border + /5 badge kept, all text = text-foreground (fg-on-tint)', () => {
    renderWithProviders(<NetProfitRow netProfit={35000} pct={pct} />)
    const row = rowOf('ЧИСТАЯ ПРИБЫЛЬ')
    expect(row.classList.contains('bg-financial-positive/5')).toBe(true)
    expect(row.classList.contains('border-financial-positive/40')).toBe(true)
    expect(row.classList.contains('border-2')).toBe(true)
    expect(screen.getByText('=').classList.contains('text-foreground')).toBe(true)
    const badge = screen.getByText(/3500\.0%/)
    expect(badge.classList.contains('bg-financial-positive/5')).toBe(true)
    expect(screen.getByText(/35 000/).classList.contains('text-foreground')).toBe(true)
  })

  it('negative: financial-negative bg/border/badge tint kept, text = text-foreground', () => {
    renderWithProviders(<NetProfitRow netProfit={-2000} pct={pct} />)
    const row = rowOf('ЧИСТАЯ ПРИБЫЛЬ')
    expect(row.classList.contains('bg-financial-negative/10')).toBe(true)
    expect(row.classList.contains('border-financial-negative/40')).toBe(true)
    expect(screen.getByText('=').classList.contains('text-foreground')).toBe(true)
    const badge = screen.getByText(/-200\.0%/)
    expect(badge.classList.contains('bg-financial-negative/5')).toBe(true)
    expect(screen.getByText(/-2 000/).classList.contains('text-foreground')).toBe(true)
  })
})
