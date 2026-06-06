/**
 * Integration tests for Price Calculator
 * Story 44.6-FE: Testing & Documentation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'

/** Minimal prop shape shared across mock shadcn/ui components */
interface MockUIProps {
  children?: React.ReactNode
  [key: string]: unknown
}

// Mock console.info
vi.spyOn(console, 'info').mockImplementation(() => {})

// Mock shadcn/ui components BEFORE importing page
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }: MockUIProps) => <button {...rest}>{children}</button>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: MockUIProps) => <div>{children}</div>,
  SelectTrigger: ({ children }: MockUIProps) => <button>{children}</button>,
  SelectValue: ({ placeholder }: MockUIProps) => <span>{placeholder}</span>,
  SelectContent: ({ children }: MockUIProps) => <div>{children}</div>,
  SelectItem: ({ children, value }: MockUIProps) => (
    <option value={String(value)}>{children}</option>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: MockUIProps) => (
    <div style={{ display: open ? 'block' : 'none' }}>{children}</div>
  ),
  DialogContent: ({ children }: MockUIProps) => <div>{children}</div>,
  DialogHeader: ({ children }: MockUIProps) => <div>{children}</div>,
  DialogTitle: ({ children }: MockUIProps) => <h2>{children}</h2>,
  DialogDescription: ({ children }: MockUIProps) => <p>{children}</p>,
  DialogFooter: ({ children }: MockUIProps) => <div>{children}</div>,
}))

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, open }: MockUIProps) => (
    <div data-collapsible-open={open}>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: MockUIProps) => children,
  CollapsibleContent: ({ children }: MockUIProps) => <div>{children}</div>,
}))

vi.mock('@/components/ui/slider', () => ({
  Slider: ({ onValueChange, ...props }: MockUIProps) => (
    <input
      type="range"
      onChange={e => {
        if (typeof onValueChange === 'function') {
          onValueChange([parseFloat(e.target.value)])
        }
      }}
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
      // Responsive layout renders results twice (desktop + mobile), use getAllByTestId
      expect(screen.getAllByTestId('price-calculator-results')[0]).toBeInTheDocument()
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
