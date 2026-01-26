/**
 * Unit tests for PercentageCostsBreakdown component
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Tests that commission percentage is displayed correctly
 * for different category commission rates (15%, 29.5%, 33%)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PercentageCostsBreakdown } from '../PercentageCostsBreakdown'
import type { TwoLevelPercentageCosts } from '@/types/price-calculator'

describe('PercentageCostsBreakdown', () => {
  const createMockCosts = (commissionPct: number): TwoLevelPercentageCosts => ({
    commissionWb: { pct: commissionPct, rub: 1000 * (commissionPct / 100) },
    acquiring: { pct: 1.8, rub: 18 },
    taxIncome: { pct: 6, rub: 60 },
    total: { pct: commissionPct + 1.8 + 6, rub: 1000 * (commissionPct / 100) + 18 + 60 },
  })

  describe('Commission Percentage Display', () => {
    it('should display 15% commission correctly', () => {
      const costs = createMockCosts(15)
      render(<PercentageCostsBreakdown costs={costs} />)

      expect(screen.getByText(/Комиссия WB \(15%\)/)).toBeInTheDocument()
    })

    it('should display 29.5% commission correctly (typical FBO for some categories)', () => {
      const costs = createMockCosts(29.5)
      render(<PercentageCostsBreakdown costs={costs} />)

      expect(screen.getByText(/Комиссия WB \(29\.5%\)/)).toBeInTheDocument()
    })

    it('should display 33% commission correctly (typical FBS for some categories)', () => {
      const costs = createMockCosts(33)
      render(<PercentageCostsBreakdown costs={costs} />)

      expect(screen.getByText(/Комиссия WB \(33%\)/)).toBeInTheDocument()
    })

    it('should display acquiring percentage correctly', () => {
      const costs = createMockCosts(15)
      render(<PercentageCostsBreakdown costs={costs} />)

      expect(screen.getByText(/Эквайринг \(1\.8%\)/)).toBeInTheDocument()
    })

    it('should display tax percentage correctly for income tax', () => {
      const costs = createMockCosts(15)
      render(<PercentageCostsBreakdown costs={costs} />)

      expect(screen.getByText(/Налог с выручки \(6%\)/)).toBeInTheDocument()
    })
  })

  describe('Section Header', () => {
    it('should render section header', () => {
      const costs = createMockCosts(15)
      render(<PercentageCostsBreakdown costs={costs} />)

      expect(screen.getByText('ПРОЦЕНТНЫЕ ЗАТРАТЫ')).toBeInTheDocument()
    })

    it('should show total percentage in footer', () => {
      const costs = createMockCosts(15)
      render(<PercentageCostsBreakdown costs={costs} />)

      // 15 + 1.8 + 6 = 22.8%
      expect(screen.getByText(/Итого процентные \(22\.8%\)/)).toBeInTheDocument()
    })
  })

  describe('No Income Tax Case', () => {
    it('should not show tax line when taxIncome is null', () => {
      const costs: TwoLevelPercentageCosts = {
        commissionWb: { pct: 15, rub: 150 },
        acquiring: { pct: 1.8, rub: 18 },
        taxIncome: null,
        total: { pct: 16.8, rub: 168 },
      }
      render(<PercentageCostsBreakdown costs={costs} />)

      expect(screen.queryByText(/Налог с выручки/)).not.toBeInTheDocument()
    })
  })
})
