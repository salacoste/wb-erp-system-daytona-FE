/**
 * Integration tests for Price Calculator
 * Story 44.6-FE: Testing & Documentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'

// Mock console.info
vi.spyOn(console, 'info').mockImplementation(() => {})

// Mock shadcn/ui components BEFORE importing page
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (
    <div style={{ display: open ? 'block' : 'none' }}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, open }: any) => (
    <div data-collapsible-open={open}>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: any) => children,
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/slider', () => ({
  Slider: ({ onValueChange, ...props }: any) => (
    <input
      type="range"
      onChange={(e) => onValueChange([parseFloat(e.target.value)])}
      {...props}
    />
  ),
}))

// Mock components used by the page
vi.mock('@/components/custom/price-calculator/PriceCalculatorForm', () => ({
  PriceCalculatorForm: () => (
    <div data-testid="price-calculator-form">
      <button type="button">Calculate</button>
    </div>
  ),
}))

vi.mock('@/components/custom/price-calculator/PriceCalculatorResults', () => ({
  PriceCalculatorResults: () => (
    <div data-testid="price-calculator-results">
      <span>Results Component</span>
    </div>
  ),
}))

vi.mock('@/components/custom/price-calculator/ErrorMessage', () => ({
  ErrorMessage: () => <div data-testid="error-message">Error Display</div>,
}))

// Mock the hook
vi.mock('@/hooks/usePriceCalculator', () => ({
  usePriceCalculator: () => ({
    mutate: vi.fn(),
    isPending: false,
    data: null,
    error: null,
  }),
}))

// Import the page AFTER all mocks are set up
import PriceCalculatorPage from '@/app/(dashboard)/cogs/price-calculator/page'

describe('Price Calculator Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Rendering', () => {
    it('renders page components', () => {
      render(<PriceCalculatorPage />)

      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
      expect(screen.getByTestId('price-calculator-results')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<PriceCalculatorPage />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('has accessible buttons', () => {
      render(<PriceCalculatorPage />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})
