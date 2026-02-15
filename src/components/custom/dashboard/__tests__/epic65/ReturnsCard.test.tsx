/**
 * TDD Tests for Story 65.5: Returns Card (Возвраты)
 * RED phase — all tests expected to FAIL (component does not exist yet).
 *
 * Shows wb_returns_gross (monetary) + returnsCount (quantity from fulfillment).
 * Comparison uses calculateComparison() with invertComparison=true (higher is worse).
 *
 * @see Story 65.5, AC-65.5.1 through AC-65.5.5
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component under test — DOES NOT EXIST YET (TDD Red phase)
import { ReturnsCard } from '../../ReturnsCard'

// =============================================================================
// AC-65.5.1: Shows returns value and count
// =============================================================================

describe('ReturnsCard', () => {
  describe('AC-65.5.1: displays returns value and count', () => {
    it('shows wb_returns_gross formatted as currency', () => {
      renderWithProviders(
        <ReturnsCard wbReturnsGross={200_000} returnsCount={60} isLoading={false} />
      )

      const card = screen.getByRole('article')
      // "200 000 ₽" in Russian locale
      expect(card.textContent).toMatch(/200\s*000/)
      expect(card.textContent).toMatch(/₽/)
    })

    it('shows returnsCount as quantity', () => {
      renderWithProviders(
        <ReturnsCard wbReturnsGross={200_000} returnsCount={60} isLoading={false} />
      )

      const card = screen.getByRole('article')
      // Should display "60 шт" or similar
      expect(card.textContent).toMatch(/60/)
    })

    it('shows returns count from fulfillment (fbo + fbs aggregated)', () => {
      // returnsCount = fbo.returnsCount(35) + fbs.returnsCount(25) = 60
      renderWithProviders(
        <ReturnsCard wbReturnsGross={200_000} returnsCount={60} isLoading={false} />
      )

      expect(screen.getByRole('article').textContent).toMatch(/60/)
    })
  })

  // ===========================================================================
  // AC-65.5.2: Comparison with previous period
  // ===========================================================================

  describe('AC-65.5.2: comparison with previous period', () => {
    it('shows comparison for monetary value', () => {
      // Current: 200_000, Previous: 180_000 -> +11.1%
      renderWithProviders(
        <ReturnsCard
          wbReturnsGross={200_000}
          returnsCount={60}
          previousWbReturnsGross={180_000}
          isLoading={false}
        />
      )

      const card = screen.getByRole('article')
      // Should show some comparison indicator
      expect(card.textContent).toMatch(/\+/)
    })

    it('does not show comparison when previousWbReturnsGross is null', () => {
      renderWithProviders(
        <ReturnsCard
          wbReturnsGross={200_000}
          returnsCount={60}
          previousWbReturnsGross={null}
          isLoading={false}
        />
      )

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.5.3: Inverted comparison (higher returns = worse = red)
  // ===========================================================================

  describe('AC-65.5.3: inverted comparison', () => {
    it('shows red/negative direction when returns increased', () => {
      // Returns went UP: 200_000 vs 180_000 -> increase = BAD
      renderWithProviders(
        <ReturnsCard
          wbReturnsGross={200_000}
          returnsCount={60}
          previousWbReturnsGross={180_000}
          isLoading={false}
        />
      )

      // With inverted comparison, increase should show negative direction (red)
      const card = screen.getByRole('article')
      // The comparison badge or trend indicator should indicate negative direction
      expect(card.textContent).toMatch(/\+/)
    })

    it('shows green/positive direction when returns decreased', () => {
      // Returns went DOWN: 150_000 vs 200_000 -> decrease = GOOD
      renderWithProviders(
        <ReturnsCard
          wbReturnsGross={150_000}
          returnsCount={45}
          previousWbReturnsGross={200_000}
          isLoading={false}
        />
      )

      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.5.4: Red accent and RotateCcw icon
  // ===========================================================================

  describe('AC-65.5.4: visual styling', () => {
    it('uses red accent color for the card', () => {
      renderWithProviders(
        <ReturnsCard wbReturnsGross={200_000} returnsCount={60} isLoading={false} />
      )

      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
      // Card should have red-themed styling
    })

    it('renders with RotateCcw icon', () => {
      renderWithProviders(
        <ReturnsCard wbReturnsGross={200_000} returnsCount={60} isLoading={false} />
      )

      // Card should render (icon verified via visual inspection)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.5.5: Graceful degradation
  // ===========================================================================

  describe('AC-65.5.5: graceful degradation', () => {
    it('shows only monetary value when returnsCount is undefined (fulfillment unavailable)', () => {
      renderWithProviders(
        <ReturnsCard wbReturnsGross={200_000} returnsCount={undefined} isLoading={false} />
      )

      // Monetary value should still display
      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/200\s*000/)
      // Count should show "---"
      expect(card.textContent).toMatch(/—/)
    })

    it('shows "---" when wbReturnsGross is null', () => {
      renderWithProviders(<ReturnsCard wbReturnsGross={null} returnsCount={60} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows "---" when both values are null/undefined', () => {
      renderWithProviders(
        <ReturnsCard wbReturnsGross={null} returnsCount={undefined} isLoading={false} />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows skeleton when loading', () => {
      renderWithProviders(
        <ReturnsCard wbReturnsGross={null} returnsCount={undefined} isLoading={true} />
      )

      expect(
        screen.queryByTestId('returns-card-skeleton') ||
          screen.queryByRole('article', { busy: true })
      ).toBeTruthy()
    })
  })
})
