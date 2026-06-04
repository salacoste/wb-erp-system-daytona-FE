/**
 * TDD RED Phase — Story 66.5-FE: TaxCard Refactor (Backend Tax Data)
 *
 * Tests the NEW TaxCardProps interface (TaxMetrics-based).
 * These tests WILL FAIL until TaxCard is refactored to accept the new props.
 *
 * @see docs/epics/epic-66-fe-tax-accounting.md
 * @see src/types/finance-summary.ts — TaxMetrics interface
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TaxCard } from '../TaxCard'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { TaxMetrics } from '@/types/finance-summary'

/** Factory: default TaxMetrics with sensible values, overridable */
function createTaxMetrics(overrides?: Partial<TaxMetrics>): TaxMetrics {
  return {
    tax_amount: 50000,
    tax_base: 833333,
    effective_tax_rate: 6,
    tax_system: 'usn6',
    is_minimum_rule: false,
    net_profit_after_tax: 783333,
    vat_payer: false,
    vat_rate: null,
    vat_output: null,
    vat_payable: null,
    revenue_excl_vat: null,
    net_profit_after_all_tax: null,
    ...overrides,
  }
}

/** New props interface expected after refactor */
interface NewTaxCardProps {
  taxMetrics: TaxMetrics | null
  previousTaxMetrics: TaxMetrics | null
  isLoading: boolean
  className?: string
}

function renderTaxCard(props: NewTaxCardProps) {
  return render(
    <TooltipProvider>
      {/* Cast: tests the NEW interface; will fail until component is refactored */}
      <TaxCard {...(props as unknown as Parameters<typeof TaxCard>[0])} />
    </TooltipProvider>
  )
}

describe('TaxCard (Story 66.5-FE — Backend Data)', () => {
  it('1: renders tax amount when taxMetrics provided', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ tax_amount: 50000 }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    // formatCurrency(50000) → "50 000 ₽" (Russian locale)
    expect(screen.getByText(/50\s?000/)).toBeInTheDocument()
  })

  it('2: shows tax system label (УСН 6%, УСН 15%)', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ tax_system: 'usn6' }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.getByText('УСН 6%')).toBeInTheDocument()
  })

  it('3: shows effective tax rate as percentage', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ effective_tax_rate: 6 }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.getByText(/6[,.]?0?\s*%/)).toBeInTheDocument()
  })

  it('4: shows minimum rule badge when is_minimum_rule is true', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ is_minimum_rule: true, tax_system: 'usn15' }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.getByText(/Мин\.\s*1\s*%/)).toBeInTheDocument()
  })

  it('5: hides minimum rule badge when is_minimum_rule is false', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ is_minimum_rule: false }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.queryByText(/Мин\.\s*1\s*%/)).not.toBeInTheDocument()
  })

  it('6: shows НДС badge with rate when vat_payer is true', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ vat_payer: true, vat_rate: 20 }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.getByText(/НДС\s*20\s*%/)).toBeInTheDocument()
  })

  it('6b: vat_rate=0 renders the badge (== null guard, not falsy — 0 is a valid rate)', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ vat_payer: true, vat_rate: 0 }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.getByText(/НДС\s*0\s*%/)).toBeInTheDocument()
  })

  it('7: hides НДС badge when vat_payer is false', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ vat_payer: false }),
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.queryByText(/НДС\s*\d+\s*%/)).not.toBeInTheDocument()
  })

  it('8: shows "Настройте систему" when taxMetrics is null', () => {
    renderTaxCard({
      taxMetrics: null,
      previousTaxMetrics: null,
      isLoading: false,
    })
    expect(screen.getByText('Настройте систему')).toBeInTheDocument()
  })

  it('9: shows period comparison badge (inverted — higher tax = red)', () => {
    renderTaxCard({
      taxMetrics: createTaxMetrics({ tax_amount: 60000 }),
      previousTaxMetrics: createTaxMetrics({ tax_amount: 50000 }),
      isLoading: false,
    })
    // Inverted comparison: 60k > 50k → negative direction (red)
    // ComparisonBadge renders formatted difference with "vs" text
    expect(screen.getByText(/vs/)).toBeInTheDocument()
  })

  it('10: renders loading skeleton when isLoading is true', () => {
    const { container } = renderTaxCard({
      taxMetrics: null,
      previousTaxMetrics: null,
      isLoading: true,
    })
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })
})
