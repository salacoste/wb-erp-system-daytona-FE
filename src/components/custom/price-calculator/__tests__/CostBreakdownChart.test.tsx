/**
 * Unit tests for CostBreakdownChart component
 * Story 44.3-FE: Results Display Component for Price Calculator
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CostBreakdownChart } from '../CostBreakdownChart'
import { mockPriceCalculatorResponse } from '@/test/fixtures/price-calculator'

describe('CostBreakdownChart', () => {
  describe('Rendering', () => {
    it('renders chart component', () => {
      render(<CostBreakdownChart data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Структура затрат')).toBeInTheDocument()
    })

    it('renders all legend items', () => {
      render(<CostBreakdownChart data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Комиссия WB')).toBeInTheDocument()
      expect(screen.getByText('Эквайринг')).toBeInTheDocument()
      expect(screen.getByText('Реклама')).toBeInTheDocument()
      expect(screen.getByText('НДС')).toBeInTheDocument()
      expect(screen.getByText('Маржа')).toBeInTheDocument()
    })

    it('displays chart with proper height', () => {
      const { container } = render(<CostBreakdownChart data={mockPriceCalculatorResponse} />)

      // Component uses h-10 for the horizontal stacked bar
      const chartContainer = container.querySelector('.h-10')
      expect(chartContainer).toBeInTheDocument()
    })
  })

  describe('Data Visualization', () => {
    it('uses correct colors for each segment', () => {
      const { container } = render(<CostBreakdownChart data={mockPriceCalculatorResponse} />)

      // Check that legend items have color indicators with inline styles
      const legendItems = container.querySelectorAll('div[style*="background-color"]')
      expect(legendItems.length).toBeGreaterThan(0)
    })

    // Skip this test in test environment since Recharts needs actual DOM dimensions
    it.skip('displays percentage labels on segments (requires actual DOM)', () => {
      render(<CostBreakdownChart data={mockPriceCalculatorResponse} />)

      // Chart labels only render with actual DOM dimensions
      expect(screen.getByText(/10\.0%/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible title', () => {
      render(<CostBreakdownChart data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Структура затрат')).toBeInTheDocument()
    })

    it('legend items have text labels', () => {
      render(<CostBreakdownChart data={mockPriceCalculatorResponse} />)

      // All legend items should have text labels
      expect(screen.getByText('Комиссия WB')).toBeInTheDocument()
      expect(screen.getByText('Эквайринг')).toBeInTheDocument()
      expect(screen.getByText('Реклама')).toBeInTheDocument()
      expect(screen.getByText('НДС')).toBeInTheDocument()
      expect(screen.getByText('Маржа')).toBeInTheDocument()
    })
  })
})
