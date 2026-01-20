/**
 * Integration tests for Price Calculator page
 * Story 44.4-FE: Page Layout & Navigation Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as React from 'react'

// Mock shadcn/ui components first
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button type="button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, _onOpenChange }: any) => (
    <div style={{ display: open ? 'block' : 'none' }}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, open, _onOpenChange }: any) => (
    <div data-collapsible-open={open}>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock the form components
vi.mock('@/components/custom/price-calculator/PriceCalculatorForm', () => ({
  PriceCalculatorForm: ({ onSubmit, loading, hasResults }: { onSubmit: () => void; loading?: boolean; hasResults?: boolean }) => (
    <div data-testid="price-calculator-form">
      <button onClick={onSubmit} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
      {hasResults && <div data-testid="has-results-indicator">Results exist</div>}
    </div>
  ),
}))

vi.mock('@/components/custom/price-calculator/PriceCalculatorResults', () => ({
  PriceCalculatorResults: ({ data, _loading, _error }: { data: unknown; _loading: boolean; _error: Error | null }) => (
    <div data-testid="price-calculator-results">
      <span>Results Component</span>
      {data !== null && data !== undefined && <div data-testid="results-data">Data present</div>}
    </div>
  ),
}))

vi.mock('@/components/custom/price-calculator/ErrorMessage', () => ({
  ErrorMessage: ({ _error, _onRetry }: { _error: Error; _onRetry: () => void }) => (
    <div data-testid="error-message">Error Display</div>
  ),
}))

vi.mock('@/hooks/usePriceCalculator', () => ({
  usePriceCalculator: () => ({
    mutate: vi.fn(),
    isPending: false,
    data: null,
    error: null,
  }),
}))

// Import the page after mocks
import PriceCalculatorPage from '@/app/(dashboard)/cogs/price-calculator/page'

describe('PriceCalculator Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Layout', () => {
    it('renders page component', () => {
      render(<PriceCalculatorPage />)

      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
      expect(screen.getByTestId('price-calculator-results')).toBeInTheDocument()
    })

    it('renders h1 heading with title', () => {
      render(<PriceCalculatorPage />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading.textContent).toContain('Price Calculator')
    })

    it('renders breadcrumb navigation', () => {
      render(<PriceCalculatorPage />)

      // Check breadcrumb specifically (nav element with text-sm class)
      const breadcrumb = screen.getByRole('navigation')
      expect(breadcrumb).toHaveTextContent('COGS Management')
      expect(breadcrumb).toHaveTextContent('Price Calculator')
      // Note: COGS Management also appears in Sidebar (that's correct UX)
    })
  })

  describe('Responsive Layout', () => {
    it('uses two-column grid on desktop', () => {
      const { container } = render(<PriceCalculatorPage />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<PriceCalculatorPage />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })
})
