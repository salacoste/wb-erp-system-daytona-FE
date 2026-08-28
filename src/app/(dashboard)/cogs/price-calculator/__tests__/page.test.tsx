/**
 * Integration tests for Price Calculator page
 * Story 44.4-FE: Page Layout & Navigation Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import * as React from 'react'

/** Minimal prop shape shared across mock shadcn/ui components */
interface MockUIProps {
  children?: React.ReactNode
  [key: string]: unknown
}

const calculatorHookMock = vi.hoisted(() => ({
  mutate: vi.fn(),
  options: undefined as
    | {
        onSuccess?: () => void
        onError?: () => void
      }
    | undefined,
}))

// Mock shadcn/ui components first
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: MockUIProps) => (
    <button
      type="button"
      onClick={onClick as React.MouseEventHandler}
      disabled={disabled as boolean}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: MockUIProps) => <div {...props}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SelectValue: ({ placeholder }: MockUIProps) => <span>{String(placeholder ?? '')}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: MockUIProps) => (
    <option value={String(value)}>{children}</option>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: MockUIProps) => (
    <div style={{ display: open ? 'block' : 'none' }}>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, open }: MockUIProps) => (
    <div data-collapsible-open={open}>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock the form components
vi.mock('@/components/custom/price-calculator/PriceCalculatorForm', () => ({
  PriceCalculatorForm: ({
    onSubmit,
    loading,
    hasResults,
  }: {
    onSubmit: () => void
    loading?: boolean
    hasResults?: boolean
  }) => (
    <div data-testid="price-calculator-form">
      <button onClick={onSubmit} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate'}
      </button>
      {hasResults && <div data-testid="has-results-indicator">Results exist</div>}
    </div>
  ),
}))

vi.mock('@/components/custom/price-calculator/PriceCalculatorResults', () => ({
  PriceCalculatorResults: ({
    data,
    _loading,
    _error,
  }: {
    data: unknown
    _loading: boolean
    _error: Error | null
  }) => (
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
  usePriceCalculator: (options: { onSuccess?: () => void; onError?: () => void }) => {
    calculatorHookMock.options = options
    return {
      mutate: calculatorHookMock.mutate,
      isPending: false,
      data: null,
      error: null,
    }
  },
}))

// Import the page after mocks
import PriceCalculatorPage from '@/app/(dashboard)/cogs/price-calculator/page'

describe('PriceCalculator Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    calculatorHookMock.options = undefined
  })

  describe('Page Layout', () => {
    it('renders exactly one results tree for the responsive page', () => {
      render(<PriceCalculatorPage />)

      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
      expect(screen.getAllByTestId('price-calculator-results')).toHaveLength(1)
    })

    it('renders route identity through the shared PageHeader composition', () => {
      const { container } = render(<PriceCalculatorPage />)

      expect(container.querySelector('[data-slot="page-header"]')).toBeInTheDocument()
    })

    it('renders h1 heading with title', () => {
      render(<PriceCalculatorPage />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      // Russian locale: "Калькулятор цены"
      expect(heading.textContent).toContain('Калькулятор цены')
    })

    it('renders breadcrumb navigation', () => {
      render(<PriceCalculatorPage />)

      // Check breadcrumb specifically (nav element with text-sm class)
      const breadcrumb = screen.getByRole('navigation')
      // Russian locale: "Управление себестоимостью" / "Калькулятор цены"
      expect(breadcrumb).toHaveTextContent('Управление себестоимостью')
      expect(breadcrumb).toHaveTextContent('Калькулятор цены')
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

    it('uses instant result scrolling when reduced motion is preferred', () => {
      vi.useFakeTimers()
      const originalMatchMedia = window.matchMedia
      const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
      const scrollIntoView = vi.fn()

      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: scrollIntoView,
      })

      try {
        render(<PriceCalculatorPage />)

        act(() => {
          calculatorHookMock.options?.onSuccess?.()
          vi.advanceTimersByTime(100)
        })

        expect(scrollIntoView).toHaveBeenCalledWith({
          behavior: 'auto',
          block: 'nearest',
        })
      } finally {
        Object.defineProperty(window, 'matchMedia', {
          configurable: true,
          value: originalMatchMedia,
        })
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
          configurable: true,
          value: originalScrollIntoView,
        })
        vi.useRealTimers()
      }
    })
  })
})
