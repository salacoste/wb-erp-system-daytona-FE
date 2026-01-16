/**
 * Tests for HistoricalMarginContext component
 * Story 4.9: Historical Margin Discovery
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HistoricalMarginContext } from './HistoricalMarginContext'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('HistoricalMarginContext', () => {
  const defaultProps = {
    nmId: '173589742',
    currentPeriod: '2025-W47',
    lastSalesWeek: '2025-W44',
    lastSalesMarginPct: 92.32,
    lastSalesQty: 5,
    weeksSinceLastSale: 3,
    enableMarginDisplay: true,
  }

  describe('State 1: No Sales + Historical Data Available', () => {
    it('renders status line with current period', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      expect(screen.getByText(/Нет продаж за W47/)).toBeInTheDocument()
    })

    it('renders historical badge with week', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      expect(screen.getByText('W44')).toBeInTheDocument()
    })

    it('renders margin percentage with positive value in green', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      const marginText = screen.getByText('92.32%')
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-green-600')
    })

    it('renders quantity', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      expect(screen.getByText(/5 шт/)).toBeInTheDocument()
    })

    it('renders weeks ago', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      expect(screen.getByText(/3 нед\. назад/)).toBeInTheDocument()
    })

    it('renders history link', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      const link = screen.getByRole('link', { name: /История продаж/i })
      expect(link).toHaveAttribute('href', '/analytics/sku?nm_id=173589742')
    })
  })

  describe('State 2: No Sales + No Historical Data', () => {
    const noHistoryProps = {
      ...defaultProps,
      lastSalesWeek: null,
      lastSalesMarginPct: null,
      lastSalesQty: null,
      weeksSinceLastSale: null,
    }

    it('renders status line', () => {
      render(<HistoricalMarginContext {...noHistoryProps} />)
      expect(screen.getByText(/Нет продаж за W47/)).toBeInTheDocument()
    })

    it('renders no history message', () => {
      render(<HistoricalMarginContext {...noHistoryProps} />)
      expect(screen.getByText('Нет продаж за последние 12 недель')).toBeInTheDocument()
    })

    it('still renders history link', () => {
      render(<HistoricalMarginContext {...noHistoryProps} />)
      expect(screen.getByRole('link', { name: /История продаж/i })).toBeInTheDocument()
    })
  })

  describe('State 3: No Sales + Negative Historical Margin', () => {
    const negativeMarginProps = {
      ...defaultProps,
      lastSalesMarginPct: -5.23,
    }

    it('renders margin percentage with negative value in red', () => {
      render(<HistoricalMarginContext {...negativeMarginProps} />)
      const marginText = screen.getByText('-5.23%')
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-red-600')
    })
  })

  describe('State 4: Zero Margin', () => {
    const zeroMarginProps = {
      ...defaultProps,
      lastSalesMarginPct: 0,
    }

    it('renders margin percentage with zero value in gray', () => {
      render(<HistoricalMarginContext {...zeroMarginProps} />)
      const marginText = screen.getByText('0.00%')
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-gray-500')
    })
  })

  describe('State 5: Margin Display Disabled', () => {
    const disabledMarginProps = {
      ...defaultProps,
      enableMarginDisplay: false,
    }

    it('renders week and quantity but not margin', () => {
      render(<HistoricalMarginContext {...disabledMarginProps} />)
      expect(screen.getByText('W44')).toBeInTheDocument()
      expect(screen.getByText(/5 шт/)).toBeInTheDocument()
      expect(screen.queryByText('92.32%')).not.toBeInTheDocument()
    })

    it('still renders history link', () => {
      render(<HistoricalMarginContext {...disabledMarginProps} />)
      expect(screen.getByRole('link', { name: /История продаж/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has correct role for region', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      expect(screen.getByRole('region', { name: /Историческая маржа/i })).toBeInTheDocument()
    })

    it('has correct role for status', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has correct aria-label for history link', () => {
      render(<HistoricalMarginContext {...defaultProps} />)
      // The link is accessible with its text content "История продаж"
      expect(screen.getByRole('link', { name: /История продаж/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles null currentPeriod gracefully', () => {
      render(<HistoricalMarginContext {...defaultProps} currentPeriod={null} />)
      expect(screen.getByText(/Нет продаж за текущую неделю/)).toBeInTheDocument()
    })

    it('handles null lastSalesQty by showing 0', () => {
      render(<HistoricalMarginContext {...defaultProps} lastSalesQty={null} />)
      expect(screen.getByText(/0 шт/)).toBeInTheDocument()
    })
  })
})
