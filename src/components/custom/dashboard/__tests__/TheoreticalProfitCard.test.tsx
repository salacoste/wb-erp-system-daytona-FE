/**
 * Tests for TheoreticalProfitCard
 * Story 62.4-FE: Theoretical Profit Card with Breakdown
 *
 * BUG FIX COVERAGE: When isComplete=false, value should display "—" not calculated value
 * @see docs/request-backend/134-DASHBOARD-W05-VALIDATION-BUGS.md
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TheoreticalProfitCard } from '../TheoreticalProfitCard'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { TheoreticalProfitResult } from '@/lib/theoretical-profit'

function renderCard(props: Parameters<typeof TheoreticalProfitCard>[0]) {
  return render(
    <TooltipProvider>
      <TheoreticalProfitCard {...props} />
    </TooltipProvider>
  )
}

describe('TheoreticalProfitCard', () => {
  describe('loading state', () => {
    it('renders skeleton when loading', () => {
      const { container } = renderCard({ profit: null, previousProfit: null, isLoading: true })
      // Skeleton has aria-busy="true" but no role="article"
      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('renders error when provided', () => {
      const mockRetry = vi.fn()
      renderCard({
        profit: null,
        previousProfit: null,
        error: new Error('Test error'),
        onRetry: mockRetry,
      })
      // Error component has role="alert"
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('complete data display', () => {
    const completeProfit: TheoreticalProfitResult = {
      value: 25241,
      isComplete: true,
      missingFields: [],
      breakdown: {
        sales: 84377,
        cogs: 35818,
        advertising: 3728,
        logistics: 17566,
        storage: 2024,
      },
    }

    it('displays formatted value when isComplete=true', () => {
      renderCard({ profit: completeProfit, previousProfit: null })
      // formatCurrency uses Russian locale, may produce "25 241 ₽"
      expect(screen.getByText(/25\s?241/)).toBeInTheDocument()
    })

    it('displays comparison badge when previous value exists', () => {
      renderCard({ profit: completeProfit, previousProfit: 20000 })
      expect(screen.getByText(/vs/)).toBeInTheDocument()
    })

    it('has correct aria-label with value', () => {
      renderCard({ profit: completeProfit, previousProfit: null })
      const ariaLabel = screen.getByRole('article').getAttribute('aria-label')
      expect(ariaLabel).toMatch(/25\s?241/)
    })
  })

  describe('BUG FIX: incomplete data display (W05 scenario)', () => {
    /**
     * BUG-001: When week data is incomplete (e.g., W05 in progress),
     * only advertising spend might be available from real-time API.
     * Formula calculates: 0 - 0 - 2102.66 - 0 - 0 = -2102.66
     * This is MISLEADING and should show "—" instead.
     *
     * @see docs/request-backend/134-DASHBOARD-W05-VALIDATION-BUGS.md
     */
    const incompleteProfit: TheoreticalProfitResult = {
      value: -2102.66,
      isComplete: false,
      missingFields: ['salesAmount', 'cogs', 'logisticsCost', 'storageCost'],
      breakdown: {
        sales: 0,
        cogs: 0,
        advertising: 2102.66,
        logistics: 0,
        storage: 0,
      },
    }

    it('displays "—" when isComplete=false (BUG FIX)', () => {
      renderCard({ profit: incompleteProfit, previousProfit: 25000 })
      expect(screen.getByText('—')).toBeInTheDocument()
      // Should NOT display the misleading value
      expect(screen.queryByText(/-2\s?102/)).not.toBeInTheDocument()
    })

    it('does NOT display comparison badge when isComplete=false', () => {
      renderCard({ profit: incompleteProfit, previousProfit: 25000 })
      expect(screen.queryByText(/vs/)).not.toBeInTheDocument()
    })

    it('displays "Неполные данные" badge', () => {
      renderCard({ profit: incompleteProfit, previousProfit: null })
      expect(screen.getByText('Неполные данные')).toBeInTheDocument()
    })

    it('displays missing fields list', () => {
      renderCard({ profit: incompleteProfit, previousProfit: null })
      expect(screen.getByText(/Не хватает:/)).toBeInTheDocument()
    })

    it('has correct aria-label saying "нет данных"', () => {
      renderCard({ profit: incompleteProfit, previousProfit: null })
      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('нет данных')
      )
    })

    it('uses muted-foreground color for dash', () => {
      renderCard({ profit: incompleteProfit, previousProfit: null })
      const dashElement = screen.getByText('—')
      expect(dashElement).toHaveClass('text-muted-foreground')
    })
  })

  describe('null profit', () => {
    it('displays "—" when profit is null', () => {
      renderCard({ profit: null, previousProfit: null })
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('displays "—" when profit is undefined', () => {
      renderCard({ profit: undefined, previousProfit: null })
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})
