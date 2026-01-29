/**
 * Unit Tests for Loading States and Empty States
 * Story 60.8-FE: Improve Loading States
 *
 * Tests for skeleton loading, empty states, and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendingUp } from 'lucide-react'
import { MetricCardEnhanced } from '../MetricCardEnhanced'
import { EmptyStateIllustration } from '../EmptyStateIllustration'

// Mock TooltipProvider for MetricCardEnhanced
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('MetricCardEnhanced Loading State', () => {
  describe('Skeleton Display (AC1)', () => {
    it('should show skeleton loader when isLoading=true', () => {
      render(<MetricCardEnhanced title="Выручка" value={null} isLoading={true} />)

      // Should have skeleton container with testid
      expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument()
    })

    it('should NOT show skeleton when isLoading=false', () => {
      render(<MetricCardEnhanced title="Выручка" value={1234} isLoading={false} />)

      // Should NOT have skeleton container
      expect(screen.queryByTestId('metric-card-skeleton')).not.toBeInTheDocument()

      // Should show formatted value
      expect(screen.getByText(/1.*234/)).toBeInTheDocument()
    })

    it('should show skeleton for title area with correct dimensions', () => {
      render(<MetricCardEnhanced title="Выручка" value={null} isLoading={true} />)

      const skeleton = screen.getByTestId('metric-card-skeleton')
      // Check for h-4 w-24 skeleton (title)
      const titleSkeleton = skeleton.querySelector('.h-4.w-24')
      expect(titleSkeleton).toBeInTheDocument()
    })

    it('should show skeleton for value area with correct dimensions', () => {
      render(<MetricCardEnhanced title="Выручка" value={null} isLoading={true} />)

      const skeleton = screen.getByTestId('metric-card-skeleton')
      // Check for h-8 w-32 skeleton (value)
      const valueSkeleton = skeleton.querySelector('.h-8.w-32')
      expect(valueSkeleton).toBeInTheDocument()
    })

    it('should show skeleton for trend/delta area with correct dimensions', () => {
      render(<MetricCardEnhanced title="Выручка" value={null} isLoading={true} />)

      const skeleton = screen.getByTestId('metric-card-skeleton')
      // Check for h-4 w-20 skeleton (trend)
      const trendSkeleton = skeleton.querySelector('.h-4.w-20')
      expect(trendSkeleton).toBeInTheDocument()
    })

    it('should show icon skeleton when icon prop is provided', () => {
      render(<MetricCardEnhanced title="Выручка" value={null} isLoading={true} icon={TrendingUp} />)

      const skeleton = screen.getByTestId('metric-card-skeleton')
      // Check for h-5 w-5 rounded skeleton (icon)
      const iconSkeleton = skeleton.querySelector('.h-5.w-5.rounded')
      expect(iconSkeleton).toBeInTheDocument()
    })
  })

  describe('Value Transition Animation (AC2)', () => {
    it('should apply fade-in animation class when value changes', () => {
      const { container } = render(
        <MetricCardEnhanced title="Выручка" value={1234} isLoading={false} />
      )

      // Check for animate-in and fade-in classes on value container
      const animatedDiv = container.querySelector('.animate-in.fade-in')
      expect(animatedDiv).toBeInTheDocument()
    })

    it('should have 200ms transition duration', () => {
      const { container } = render(
        <MetricCardEnhanced title="Выручка" value={1234} isLoading={false} />
      )

      // Check for duration-200 class
      const animatedDiv = container.querySelector('.duration-200')
      expect(animatedDiv).toBeInTheDocument()
    })
  })

  describe('Layout Stability (AC6, AC7)', () => {
    it('should maintain same height during loading state', () => {
      render(<MetricCardEnhanced title="Выручка" value={null} isLoading={true} />)

      const skeleton = screen.getByTestId('metric-card-skeleton')
      // Check for min-h class on container
      const content = skeleton.querySelector('.min-h-\\[120px\\]')
      expect(content).toBeInTheDocument()
    })
  })
})

describe('EmptyStateIllustration', () => {
  describe('Empty Data Display (AC3, AC5)', () => {
    it('should display Russian message "Нет данных за этот период"', () => {
      render(<EmptyStateIllustration type="trends" />)

      expect(screen.getByText('Нет данных за этот период')).toBeInTheDocument()
    })

    it('should show helpful secondary message for trends', () => {
      render(<EmptyStateIllustration type="trends" />)

      expect(
        screen.getByText(/Данные о трендах появятся после загрузки отчетов за несколько недель/)
      ).toBeInTheDocument()
    })

    it('should show helpful secondary message for expenses', () => {
      render(<EmptyStateIllustration type="expenses" />)

      expect(
        screen.getByText(/Данные о расходах появятся после загрузки финансовых отчетов/)
      ).toBeInTheDocument()
    })

    it('should display illustration icon with aria-hidden', () => {
      const { container } = render(<EmptyStateIllustration type="general" />)

      // Check for icon with aria-hidden="true"
      const icon = container.querySelector('svg[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })

    it('should allow custom message override', () => {
      render(<EmptyStateIllustration type="general" message="Кастомное сообщение" />)

      expect(screen.getByText('Кастомное сообщение')).toBeInTheDocument()
    })

    it('should allow custom secondary message override', () => {
      render(
        <EmptyStateIllustration type="general" secondaryMessage="Кастомное вторичное сообщение" />
      )

      expect(screen.getByText('Кастомное вторичное сообщение')).toBeInTheDocument()
    })
  })

  describe('Empty State Accessibility', () => {
    it('should have aria-hidden="true" on decorative icon', () => {
      const { container } = render(<EmptyStateIllustration type="general" />)

      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have readable empty state text for screen readers', () => {
      render(<EmptyStateIllustration type="general" />)

      // Main message and secondary message should be readable (not hidden)
      const message = screen.getByText('Нет данных за этот период')
      expect(message).not.toHaveAttribute('aria-hidden')

      const secondary = screen.getByText(/Выберите другой период/)
      expect(secondary).not.toHaveAttribute('aria-hidden')
    })
  })
})

describe('Accessibility', () => {
  describe('Skeleton Accessibility', () => {
    it('should have aria-hidden="true" on skeleton elements', () => {
      const { container } = render(
        <MetricCardEnhanced title="Выручка" value={null} isLoading={true} />
      )

      // Get all skeleton elements (they are divs with animate-pulse)
      const skeletons = container.querySelectorAll('[aria-hidden="true"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should have aria-busy="true" on loading container', () => {
      render(<MetricCardEnhanced title="Выручка" value={null} isLoading={true} />)

      const skeleton = screen.getByTestId('metric-card-skeleton')
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      // Mock matchMedia for prefers-reduced-motion
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }))
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should respect prefers-reduced-motion for animations', () => {
      const { container } = render(
        <MetricCardEnhanced title="Выручка" value={1234} isLoading={false} />
      )

      // With reduced motion, the animation duration should be 0ms
      const animatedDiv = container.querySelector('.animate-in')
      expect(animatedDiv).toBeInTheDocument()
      expect(animatedDiv).toHaveStyle({ animationDuration: '0ms' })
    })

    it('should still show value changes without animation', () => {
      render(<MetricCardEnhanced title="Выручка" value={1234} isLoading={false} />)

      // Value should still be displayed
      expect(screen.getByText(/1.*234/)).toBeInTheDocument()
    })
  })
})

describe('Loading State Transitions', () => {
  describe('MetricCardEnhanced transitions', () => {
    it('should transition from skeleton to content smoothly', () => {
      const { rerender } = render(
        <MetricCardEnhanced title="Выручка" value={null} isLoading={true} />
      )

      // Initially shows skeleton
      expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument()

      // Rerender with loaded state
      rerender(<MetricCardEnhanced title="Выручка" value={1234} isLoading={false} />)

      // Should show value, not skeleton
      expect(screen.queryByTestId('metric-card-skeleton')).not.toBeInTheDocument()
      expect(screen.getByText(/1.*234/)).toBeInTheDocument()
    })
  })
})
