/**
 * Unit Tests for ProductCountMetricCard Component
 * Story 60.5-FE: Remove Data Duplication
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProductCountMetricCard } from '../ProductCountMetricCard'

// Helper to render with TooltipProvider
const renderCard = (props: Parameters<typeof ProductCountMetricCard>[0]) =>
  render(
    <TooltipProvider>
      <ProductCountMetricCard {...props} />
    </TooltipProvider>
  )

describe('ProductCountMetricCard', () => {
  describe('rendering', () => {
    it('should display product count with locale formatting', () => {
      renderCard({ count: 1234 })

      // Russian locale: 1 234
      expect(screen.getByText('1 234')).toBeInTheDocument()
    })

    it('should display zero count', () => {
      renderCard({ count: 0 })

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should display null as dash', () => {
      renderCard({ count: null })

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should display undefined as dash', () => {
      renderCard({ count: undefined })

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should display title "Товаров"', () => {
      renderCard({ count: 100 })

      expect(screen.getByText('Товаров')).toBeInTheDocument()
    })

    it('should display large numbers with proper formatting', () => {
      renderCard({ count: 1234567 })

      // Russian locale: 1 234 567
      expect(screen.getByText('1 234 567')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should display skeleton when loading', () => {
      renderCard({ count: 100, isLoading: true })

      expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument()
    })

    it('should not display value when loading', () => {
      renderCard({ count: 100, isLoading: true })

      expect(screen.queryByText('100')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should display error message', () => {
      renderCard({ count: 100, error: 'Ошибка загрузки' })

      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
    })

    it('should not display value when error', () => {
      renderCard({ count: 100, error: 'Ошибка загрузки' })

      expect(screen.queryByText('100')).not.toBeInTheDocument()
    })
  })

  describe('tooltip', () => {
    it('should have default tooltip', () => {
      renderCard({ count: 100 })

      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })

    it('should accept custom tooltip', () => {
      renderCard({ count: 100, tooltip: 'Custom tooltip' })

      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })
  })

  describe('icon', () => {
    it('should display Package icon', () => {
      renderCard({ count: 100 })

      expect(screen.getByTestId('metric-icon')).toBeInTheDocument()
    })
  })

  describe('comparison', () => {
    it('should display comparison when previousCount provided', () => {
      renderCard({ count: 150, previousCount: 100 })

      // Should show increase indicator
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText(/vs 100/)).toBeInTheDocument()
    })
  })
})
