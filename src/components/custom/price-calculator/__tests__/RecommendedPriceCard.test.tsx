/**
 * Unit tests for RecommendedPriceCard component
 * Story 44.3-FE: Results Display Component for Price Calculator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecommendedPriceCard } from '../RecommendedPriceCard'
import { mockPriceCalculatorResponse } from '@/test/fixtures/price-calculator'

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
}
Object.assign(navigator, { clipboard: mockClipboard })

describe('RecommendedPriceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      render(<RecommendedPriceCard data={null} loading={true} />)

      expect(screen.getByText('Calculating...')).toBeInTheDocument()
    })

    it('shows loading message with pulse animation', () => {
      const { container } = render(<RecommendedPriceCard data={null} loading={true} />)

      const loadingDiv = container.querySelector('.animate-pulse')
      expect(loadingDiv).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when error exists', () => {
      const error = new Error('Calculation failed')
      render(<RecommendedPriceCard data={null} error={error} />)

      expect(screen.getByText('Calculation failed')).toBeInTheDocument()
    })

    it('shows placeholder when no data and no error', () => {
      render(<RecommendedPriceCard data={null} />)

      expect(screen.getByText(/enter parameters and click calculate/i)).toBeInTheDocument()
    })

    it('shows alert icon in error state', () => {
      const { container } = render(<RecommendedPriceCard data={null} error={new Error('Test error')} />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Price Display', () => {
    it('displays recommended price in large font', () => {
      render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      expect(screen.getByText(/2\s*500/)).toBeInTheDocument()
    })

    it('shows green color for positive margin', () => {
      const { container } = render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      const priceElement = container.querySelector('.text-green-600')
      expect(priceElement).toBeInTheDocument()
    })

    it('shows red color for negative margin', () => {
      const negativeMarginData = {
        ...mockPriceCalculatorResponse,
        result: {
          ...mockPriceCalculatorResponse.result,
          actual_margin_pct: -5,
          actual_margin_rub: -200,
        },
      }

      const { container } = render(<RecommendedPriceCard data={negativeMarginData} />)

      const priceElement = container.querySelector('.text-red-600')
      expect(priceElement).toBeInTheDocument()
    })
  })

  describe('Margin Display', () => {
    it('displays target margin percentage', () => {
      render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      expect(screen.getByText(/20%/)).toBeInTheDocument()
    })

    it('displays actual margin amount', () => {
      const { container } = render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      expect(container.textContent).toContain('500')
    })

    it('shows green for margin >= 20%', () => {
      const { container } = render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      const marginElement = container.querySelector('.text-green-600')
      expect(marginElement).toBeInTheDocument()
    })

    it('shows yellow for margin 10-20%', () => {
      const mediumMarginData = {
        ...mockPriceCalculatorResponse,
        result: {
          ...mockPriceCalculatorResponse.result,
          actual_margin_pct: 15,
        },
      }

      const { container } = render(<RecommendedPriceCard data={mediumMarginData} />)

      const marginElement = container.querySelector('.text-yellow-600')
      expect(marginElement).toBeInTheDocument()
    })

    it('shows orange for margin 5-10%', () => {
      const lowMarginData = {
        ...mockPriceCalculatorResponse,
        result: {
          ...mockPriceCalculatorResponse.result,
          actual_margin_pct: 7,
        },
      }

      const { container } = render(<RecommendedPriceCard data={lowMarginData} />)

      const marginElement = container.querySelector('.text-orange-600')
      expect(marginElement).toBeInTheDocument()
    })

    it('shows red for margin < 5%', () => {
      const veryLowMarginData = {
        ...mockPriceCalculatorResponse,
        result: {
          ...mockPriceCalculatorResponse.result,
          actual_margin_pct: 3,
        },
      }

      const { container } = render(<RecommendedPriceCard data={veryLowMarginData} />)

      const marginElement = container.querySelector('.text-red-600')
      expect(marginElement).toBeInTheDocument()
    })
  })

  describe('Copy Button', () => {
    it('has copy button in DOM', () => {
      render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      const copyButton = screen.queryByRole('button', { name: /copy/i })
      expect(copyButton).toBeInTheDocument()
    })

    it('button copies price to clipboard', () => {
      render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      const copyButton = screen.queryByRole('button', { name: /copy/i })
      copyButton?.click?.()

      expect(mockClipboard.writeText).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading for price display', () => {
      render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Recommended Selling Price')).toBeInTheDocument()
    })

    it('has accessible copy button', () => {
      render(<RecommendedPriceCard data={mockPriceCalculatorResponse} />)

      expect(screen.queryByRole('button', { name: /copy/i })).toBeInTheDocument()
    })
  })
})
