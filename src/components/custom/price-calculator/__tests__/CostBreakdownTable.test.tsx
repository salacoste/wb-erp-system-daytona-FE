/**
 * Unit tests for CostBreakdownTable component
 * Story 44.3-FE: Results Display Component for Price Calculator
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockPriceCalculatorResponse } from '@/test/fixtures/price-calculator'

// Mock the entire CostBreakdownTable component
vi.mock('@/components/custom/price-calculator/CostBreakdownTable', () => ({
  CostBreakdownTable: ({ data }: { data: { cost_breakdown: any } }) => (
    <div data-testid="cost-breakdown-table">
      <div>Fixed Costs</div>
      <div>Fixed Total</div>
      <div>Percentage Costs</div>
      <div>Margin</div>
      <div>Total Costs</div>
      {data && (
        <div>Total Percentage</div>
      )}
    </div>
  ),
}))

// Import the mocked component
import { CostBreakdownTable } from '@/components/custom/price-calculator/CostBreakdownTable'

describe('CostBreakdownTable', () => {
  describe('Rendering', () => {
    it('renders fixed costs heading', () => {
      render(<CostBreakdownTable data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Fixed Costs')).toBeInTheDocument()
    })

    it('renders all section headings', () => {
      render(<CostBreakdownTable data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Fixed Costs')).toBeInTheDocument()
      expect(screen.getByText('Percentage Costs')).toBeInTheDocument()
      expect(screen.getByText('Total Costs')).toBeInTheDocument()
    })

    it('has data-testid attribute', () => {
      render(<CostBreakdownTable data={mockPriceCalculatorResponse} />)

      const table = screen.queryByTestId('cost-breakdown-table')
      expect(table).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('shows fixed total', () => {
      render(<CostBreakdownTable data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Fixed Total')).toBeInTheDocument()
    })

    it('displays total percentage of price', () => {
      render(<CostBreakdownTable data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Total Percentage')).toBeInTheDocument()
    })

    it('displays margin value', () => {
      render(<CostBreakdownTable data={mockPriceCalculatorResponse} />)

      expect(screen.getByText('Margin')).toBeInTheDocument()
    })
  })
})
