/**
 * Unit Tests for CogsCoverageMetricCard Component
 * Story 60.5-FE: Remove Data Duplication
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CogsCoverageMetricCard, type CogsCoverageMetricCardProps } from '../CogsCoverageMetricCard'

// Helper to render with TooltipProvider
const renderCard = (props: CogsCoverageMetricCardProps) =>
  render(
    <TooltipProvider>
      <CogsCoverageMetricCard {...props} />
    </TooltipProvider>
  )

describe('CogsCoverageMetricCard', () => {
  describe('value display - AC5: "X из Y" format', () => {
    it('should display "X из Y" format', () => {
      renderCard({ productsWithCogs: 45, totalProducts: 50, coverage: 90 })

      expect(screen.getByText('45 из 50')).toBeInTheDocument()
    })

    it('should format large numbers with locale', () => {
      renderCard({ productsWithCogs: 1234, totalProducts: 5678, coverage: 21.7 })

      // Russian locale: 1 234 из 5 678
      expect(screen.getByText('1 234 из 5 678')).toBeInTheDocument()
    })

    it('should display 0 из 0 for zero values', () => {
      renderCard({ productsWithCogs: 0, totalProducts: 0, coverage: 0 })

      expect(screen.getByText('0 из 0')).toBeInTheDocument()
    })

    it('should display dash for null values', () => {
      renderCard({ productsWithCogs: null, totalProducts: null, coverage: null })

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should display dash for undefined values', () => {
      renderCard({
        productsWithCogs: undefined,
        totalProducts: undefined,
        coverage: undefined,
      })

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('coverage badge', () => {
    it('should display percentage in badge', () => {
      renderCard({ productsWithCogs: 90, totalProducts: 100, coverage: 90 })

      expect(screen.getByText('90%')).toBeInTheDocument()
    })

    it('should round percentage to integer', () => {
      renderCard({ productsWithCogs: 33, totalProducts: 100, coverage: 33.333 })

      expect(screen.getByText('33%')).toBeInTheDocument()
    })

    it('should display "Полное покрытие" at 100%', () => {
      renderCard({ productsWithCogs: 100, totalProducts: 100, coverage: 100 })

      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('Полное покрытие')).toBeInTheDocument()
    })

    it('should display "товаров с COGS" when coverage < 100%', () => {
      renderCard({ productsWithCogs: 50, totalProducts: 100, coverage: 50 })

      expect(screen.getByText('товаров с COGS')).toBeInTheDocument()
    })
  })

  describe('badge color variants', () => {
    it('should use green badge for 100% coverage', () => {
      renderCard({ productsWithCogs: 100, totalProducts: 100, coverage: 100 })

      const badge = screen.getByText('100%')
      expect(badge).toHaveClass('bg-green-100')
    })

    it('should use yellow badge for 50-99% coverage', () => {
      renderCard({ productsWithCogs: 75, totalProducts: 100, coverage: 75 })

      const badge = screen.getByText('75%')
      expect(badge).toHaveClass('bg-yellow-100')
    })

    it('should use red badge for < 50% coverage', () => {
      renderCard({ productsWithCogs: 25, totalProducts: 100, coverage: 25 })

      const badge = screen.getByText('25%')
      expect(badge).toHaveClass('bg-red-100')
    })
  })

  describe('title and icon', () => {
    it('should display "COGS покрытие" title', () => {
      renderCard({ productsWithCogs: 50, totalProducts: 100, coverage: 50 })

      expect(screen.getByText('COGS покрытие')).toBeInTheDocument()
    })

    it('should display PieChart icon', () => {
      renderCard({ productsWithCogs: 50, totalProducts: 100, coverage: 50 })

      expect(screen.getByTestId('metric-icon')).toBeInTheDocument()
    })

    it('should display info icon for tooltip', () => {
      renderCard({ productsWithCogs: 50, totalProducts: 100, coverage: 50 })

      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should display skeleton when loading', () => {
      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        isLoading: true,
      })

      expect(screen.getByTestId('cogs-coverage-skeleton')).toBeInTheDocument()
    })

    it('should not display value when loading', () => {
      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        isLoading: true,
      })

      expect(screen.queryByText('50 из 100')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should display error message', () => {
      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        error: 'Ошибка загрузки',
      })

      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
    })

    it('should not display badge when error', () => {
      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        error: 'Ошибка загрузки',
      })

      expect(screen.queryByText('50%')).not.toBeInTheDocument()
    })
  })

  describe('click handling', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        onClick: handleClick,
      })

      await user.click(screen.getByTestId('cogs-coverage-metric-card'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should call onClick on Enter key press', () => {
      const handleClick = vi.fn()

      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        onClick: handleClick,
      })

      const card = screen.getByTestId('cogs-coverage-metric-card')
      fireEvent.keyDown(card, { key: 'Enter' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should call onClick on Space key press', () => {
      const handleClick = vi.fn()

      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        onClick: handleClick,
      })

      const card = screen.getByTestId('cogs-coverage-metric-card')
      fireEvent.keyDown(card, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be focusable when clickable', () => {
      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        onClick: () => {},
      })

      const card = screen.getByTestId('cogs-coverage-metric-card')
      expect(card).toHaveAttribute('tabindex', '0')
    })

    it('should not be focusable when not clickable', () => {
      renderCard({ productsWithCogs: 50, totalProducts: 100, coverage: 50 })

      const card = screen.getByTestId('cogs-coverage-metric-card')
      expect(card).not.toHaveAttribute('tabindex')
    })
  })

  describe('accessibility', () => {
    it('should have role="article"', () => {
      renderCard({ productsWithCogs: 50, totalProducts: 100, coverage: 50 })

      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should have aria-busy when loading', () => {
      renderCard({
        productsWithCogs: 50,
        totalProducts: 100,
        coverage: 50,
        isLoading: true,
      })

      expect(screen.getByTestId('cogs-coverage-skeleton')).toHaveAttribute('aria-busy', 'true')
    })
  })
})
