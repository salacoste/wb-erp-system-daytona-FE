/**
 * Unit Tests for InitialDataSummary Refactored Component
 * Story 60.5-FE: Remove Data Duplication
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Tests the simplified CTA-only component that replaces the original
 * InitialDataSummary with duplicate financial metrics.
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InitialDataSummary } from '../InitialDataSummary'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

import { useRouter } from 'next/navigation'

describe('InitialDataSummary Refactored - Story 60.5-FE', () => {
  const mockRouterPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockRouterPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // AC1: Financial metrics REMOVED
  // ==========================================================================

  describe('no duplicate financial metrics (AC1)', () => {
    it('should NOT render "К перечислению" metric', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      expect(screen.queryByText(/к перечислению/i)).not.toBeInTheDocument()
    })

    it('should NOT render "Реализовано" metric', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      expect(screen.queryByText(/реализовано/i)).not.toBeInTheDocument()
    })

    it('should NOT render financial metrics card at all', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      expect(screen.queryByTestId('initial-summary-financials')).not.toBeInTheDocument()
      expect(screen.queryByTestId('financial-metrics-card')).not.toBeInTheDocument()
    })

    it('should NOT render currency values', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      // Should not contain currency symbols or formatted amounts
      expect(screen.queryByText(/\d+\s*₽/)).not.toBeInTheDocument()
      expect(screen.queryByText(/\d+\s*руб/i)).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AC2: Product count NOT in this component (moved to grid)
  // ==========================================================================

  describe('no product count display (AC2)', () => {
    it('should NOT render product count card', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      expect(screen.queryByText(/товаров загружено/i)).not.toBeInTheDocument()
      expect(screen.queryByTestId('product-count-card')).not.toBeInTheDocument()
    })

    it('should NOT render totalProducts as standalone count', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={1234} productsWithCogs={617} />)

      // Formatted number 1 234 should not appear as standalone count card
      // It may appear as part of the CTA description
      const standaloneCountCard = screen.queryByTestId('product-count-card')
      expect(standaloneCountCard).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AC3: CTA card conditional rendering
  // ==========================================================================

  describe('conditional CTA rendering (AC3)', () => {
    it('should render CTA card when COGS coverage < 100%', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      expect(screen.getByText(/следующий шаг/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /назначить cogs/i })).toBeInTheDocument()
    })

    it('should render nothing (null) when COGS coverage = 100%', () => {
      const { container } = render(
        <InitialDataSummary cogsCoverage={100} totalProducts={100} productsWithCogs={100} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render CTA when coverage is 0%', () => {
      render(<InitialDataSummary cogsCoverage={0} totalProducts={100} productsWithCogs={0} />)

      expect(screen.getByText(/следующий шаг/i)).toBeInTheDocument()
    })

    it('should render CTA when coverage is 99%', () => {
      render(<InitialDataSummary cogsCoverage={99} totalProducts={100} productsWithCogs={99} />)

      expect(screen.getByText(/следующий шаг/i)).toBeInTheDocument()
    })

    it('should display count of products without COGS in CTA description', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      // Should show "50" for products without COGS
      expect(screen.getByText(/50/)).toBeInTheDocument()
      expect(screen.getByText(/назначьте себестоимость/i)).toBeInTheDocument()
    })

    it('should handle missing props with defaults', () => {
      // Default coverage = 0 means CTA should show (if totalProducts > 0)
      // But default totalProducts = 0, so nothing renders
      const { container } = render(<InitialDataSummary />)

      // With default totalProducts=0, CTA should not show
      expect(container.firstChild).toBeNull()
    })

    it('should render nothing when totalProducts is 0', () => {
      const { container } = render(
        <InitialDataSummary cogsCoverage={0} totalProducts={0} productsWithCogs={0} />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  // ==========================================================================
  // CTA Navigation
  // ==========================================================================

  describe('CTA navigation', () => {
    it('should navigate to /cogs when CTA button clicked', async () => {
      const user = userEvent.setup()

      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      const ctaButton = screen.getByRole('button', { name: /назначить cogs/i })
      await user.click(ctaButton)

      expect(mockRouterPush).toHaveBeenCalledWith('/cogs')
    })
  })

  // ==========================================================================
  // AC4: Toast notification (not inline Alert) - verified by absence
  // ==========================================================================

  describe('no inline notification (AC4)', () => {
    it('should NOT render inline Alert for success', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      // Old inline alert should not exist
      expect(screen.queryByText(/данные успешно загружены/i)).not.toBeInTheDocument()
    })

    it('should NOT have dismiss button', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      expect(screen.queryByLabelText(/закрыть уведомление/i)).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // COGS coverage calculation
  // ==========================================================================

  describe('COGS coverage calculation', () => {
    it('should correctly calculate products without COGS', () => {
      render(<InitialDataSummary cogsCoverage={70} totalProducts={200} productsWithCogs={140} />)

      // 200 - 140 = 60 products without COGS
      expect(screen.getByText(/60/)).toBeInTheDocument()
    })

    it('should handle edge case: 1 product without COGS', () => {
      render(<InitialDataSummary cogsCoverage={99} totalProducts={100} productsWithCogs={99} />)

      expect(screen.getByText(/1/)).toBeInTheDocument()
    })

    it('should format large numbers with locale', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={2000} productsWithCogs={1000} />)

      // Russian locale: 1 000 (may be split across elements due to React rendering)
      expect(screen.getByText(/1\s*000/)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('accessibility', () => {
    it('should have accessible button with clear label', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName(/назначить cogs/i)
    })

    it('should have data-testid for CTA card', () => {
      render(<InitialDataSummary cogsCoverage={50} totalProducts={100} productsWithCogs={50} />)

      expect(screen.getByTestId('initial-data-summary-cta')).toBeInTheDocument()
    })
  })
})
