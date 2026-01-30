/**
 * Unit Tests for CogsMissingState Component
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Tests all coverage levels, interactions, accessibility, and edge cases.
 *
 * @see src/components/custom/CogsMissingState.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils/test-utils'
import { CogsMissingState } from '../CogsMissingState'

describe('CogsMissingState Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // =============================================================================
  // Test Suite 1: Rendering & Visibility
  // =============================================================================

  describe('Rendering & Visibility', () => {
    it('should not render when coverage is 100%', () => {
      const { container } = render(
        <CogsMissingState productsWithCogs={100} totalProducts={100} coverage={100} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('should not render when calculated coverage is 100%', () => {
      const { container } = render(<CogsMissingState productsWithCogs={50} totalProducts={50} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render when coverage is less than 100%', () => {
      render(<CogsMissingState productsWithCogs={50} totalProducts={100} coverage={50} />)
      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
    })

    it('should render when coverage is 0%', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      render(<CogsMissingState isLoading />)
      expect(screen.getByTestId('cogs-missing-state-loading')).toBeInTheDocument()
    })

    it('should calculate coverage from productsWithCogs and totalProducts', () => {
      render(<CogsMissingState productsWithCogs={25} totalProducts={100} />)
      expect(screen.getByTestId('coverage-text')).toHaveTextContent('25% покрытия')
    })
  })

  // =============================================================================
  // Test Suite 2: Coverage Levels - Critical (0%)
  // =============================================================================

  describe('Critical Level (0% Coverage)', () => {
    it('should display critical badge when coverage is 0%', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveTextContent('Критично')
      expect(badge).toHaveClass('bg-red-600', 'text-white')
    })

    it('should show critical message for 0% coverage', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      expect(screen.getByTestId('message-text')).toHaveTextContent(
        'Назначьте себестоимость товарам для расчета маржи'
      )
    })

    it('should show red alert triangle icon for critical level', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const iconContainer = screen.getByRole('alert').querySelector('.rounded-full')
      expect(iconContainer).toHaveClass('bg-red-50')
    })

    it('should show remaining products count for critical level', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={50} coverage={0} />)
      expect(screen.getByTestId('coverage-text')).toHaveTextContent('(50 товаров без COGS)')
    })
  })

  // =============================================================================
  // Test Suite 3: Coverage Levels - Warning (1-49%)
  // =============================================================================

  describe('Warning Level (1-49% Coverage)', () => {
    it('should display warning badge when coverage is 1%', () => {
      render(<CogsMissingState productsWithCogs={1} totalProducts={100} coverage={1} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveTextContent('Внимание')
    })

    it('should display warning badge when coverage is 49%', () => {
      render(<CogsMissingState productsWithCogs={49} totalProducts={100} coverage={49} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveTextContent('Внимание')
    })

    it('should show warning message for 1-49% coverage', () => {
      render(<CogsMissingState productsWithCogs={25} totalProducts={100} coverage={25} />)
      expect(screen.getByTestId('message-text')).toHaveTextContent(
        'Назначьте COGS для точного расчета маржи'
      )
    })

    it('should show orange styling for warning level', () => {
      render(<CogsMissingState productsWithCogs={25} totalProducts={100} coverage={25} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')
    })
  })

  // =============================================================================
  // Test Suite 4: Coverage Levels - Info (50-99%)
  // =============================================================================

  describe('Info Level (50-99% Coverage)', () => {
    it('should display info badge when coverage is 50%', () => {
      render(<CogsMissingState productsWithCogs={50} totalProducts={100} coverage={50} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveTextContent('Почти готово')
    })

    it('should display info badge when coverage is 99%', () => {
      render(<CogsMissingState productsWithCogs={99} totalProducts={100} coverage={99} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveTextContent('Почти готово')
    })

    it('should show info message for 50-99% coverage', () => {
      render(<CogsMissingState productsWithCogs={75} totalProducts={100} coverage={75} />)
      expect(screen.getByTestId('message-text')).toHaveTextContent(
        'Назначьте COGS оставшимся товарам'
      )
    })

    it('should show yellow styling for info level', () => {
      render(<CogsMissingState productsWithCogs={75} totalProducts={100} coverage={75} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })
  })

  // =============================================================================
  // Test Suite 5: Action Button
  // =============================================================================

  describe('Action Button', () => {
    it('should render action button when onAssignCogs is provided', () => {
      const onAssignCogs = vi.fn()
      render(
        <CogsMissingState
          productsWithCogs={0}
          totalProducts={100}
          coverage={0}
          onAssignCogs={onAssignCogs}
        />
      )
      expect(screen.getByTestId('action-button')).toBeInTheDocument()
    })

    it('should not render action button when onAssignCogs is not provided', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      expect(screen.queryByTestId('action-button')).not.toBeInTheDocument()
    })

    it('should call onAssignCogs when button is clicked', async () => {
      const user = userEvent.setup()
      const onAssignCogs = vi.fn()
      render(
        <CogsMissingState
          productsWithCogs={0}
          totalProducts={100}
          coverage={0}
          onAssignCogs={onAssignCogs}
        />
      )

      await user.click(screen.getByTestId('action-button'))
      expect(onAssignCogs).toHaveBeenCalledTimes(1)
    })

    it('should show "Назначить COGS" text for critical and warning levels', () => {
      const onAssignCogs = vi.fn()
      render(
        <CogsMissingState
          productsWithCogs={0}
          totalProducts={100}
          coverage={0}
          onAssignCogs={onAssignCogs}
        />
      )
      expect(screen.getByTestId('action-button')).toHaveTextContent('Назначить COGS')
    })

    it('should show "Дособрать товары" text for info level', () => {
      const onAssignCogs = vi.fn()
      render(
        <CogsMissingState
          productsWithCogs={75}
          totalProducts={100}
          coverage={75}
          onAssignCogs={onAssignCogs}
        />
      )
      expect(screen.getByTestId('action-button')).toHaveTextContent('Дособрать товары')
    })
  })

  // =============================================================================
  // Test Suite 6: Tooltip with Margin Formula
  // =============================================================================

  describe('Margin Formula Tooltip', () => {
    it('should show info icon', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })

    it('should display tooltip on info icon hover', async () => {
      const user = userEvent.setup()
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)

      const infoIcon = screen.getByTestId('info-icon')
      await user.hover(infoIcon)

      await waitFor(() => {
        expect(screen.getAllByText('Маржа = (Выручка − COGS) / Выручка')).toHaveLength(2)
      })
    })

    it('should show margin calculation benefits in tooltip', async () => {
      const user = userEvent.setup()
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)

      await user.hover(screen.getByTestId('info-icon'))

      await waitFor(() => {
        // Check that tooltip content is visible (using getByRole with name)
        const tooltipContent = screen.getByText((content, element) => {
          return (
            element?.tagName.toLowerCase() === 'p' &&
            content.startsWith('Назначьте себестоимость товарам')
          )
        })
        expect(tooltipContent).toBeInTheDocument()
      })
    })

    it('should have proper ARIA label for info button', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const infoButton = screen.getByLabelText('Информация о расчете маржи')
      expect(infoButton).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Test Suite 7: Accessibility (WCAG 2.1 AA)
  // =============================================================================

  describe('Accessibility', () => {
    it('should have role="alert" for screen readers', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live="polite" for polite announcements', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('should have aria-busy="true" during loading', () => {
      render(<CogsMissingState isLoading />)
      const loadingCard = screen.getByTestId('cogs-missing-state-loading')
      expect(loadingCard).toHaveAttribute('aria-busy', 'true')
    })

    it('should have accessible action button text', () => {
      const onAssignCogs = vi.fn()
      render(
        <CogsMissingState
          productsWithCogs={0}
          totalProducts={100}
          coverage={0}
          onAssignCogs={onAssignCogs}
        />
      )
      const button = screen.getByTestId('action-button')
      expect(button).toHaveTextContent('Назначить COGS')
    })

    it('should hide decorative icon with aria-hidden', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const alert = screen.getByRole('alert')
      const iconBg = alert.querySelector('.rounded-full')
      expect(iconBg).toHaveAttribute('aria-hidden', 'true')
    })

    it('should have keyboard-accessible action button', async () => {
      const user = userEvent.setup()
      const onAssignCogs = vi.fn()
      render(
        <CogsMissingState
          productsWithCogs={0}
          totalProducts={100}
          coverage={0}
          onAssignCogs={onAssignCogs}
        />
      )

      const button = screen.getByTestId('action-button')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(onAssignCogs).toHaveBeenCalledTimes(1)
    })
  })

  // =============================================================================
  // Test Suite 8: Coverage Text Display
  // =============================================================================

  describe('Coverage Text Display', () => {
    it('should show percentage coverage', () => {
      render(<CogsMissingState productsWithCogs={25} totalProducts={100} coverage={25} />)
      expect(screen.getByTestId('coverage-text')).toHaveTextContent('25% покрытия')
    })

    it('should show remaining products count when not all have COGS', () => {
      render(<CogsMissingState productsWithCogs={25} totalProducts={100} coverage={25} />)
      expect(screen.getByTestId('coverage-text')).toHaveTextContent('(75 товаров без COGS)')
    })

    it('should not show remaining count when totalProducts is 0', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={0} coverage={0} />)
      const coverageText = screen.getByTestId('coverage-text')
      expect(coverageText).toHaveTextContent('0% покрытия')
      expect(coverageText).not.toHaveTextContent('товаров без COGS')
    })

    it('should round coverage percentage', () => {
      render(<CogsMissingState productsWithCogs={33} totalProducts={100} coverage={33.33} />)
      expect(screen.getByTestId('coverage-text')).toHaveTextContent('33% покрытия')
    })
  })

  // =============================================================================
  // Test Suite 9: Edge Cases
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle zero total products gracefully', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={0} coverage={0} />)
      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
    })

    it('should handle undefined props with defaults', () => {
      render(<CogsMissingState />)
      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
      expect(screen.getByTestId('coverage-text')).toHaveTextContent('0% покрытия')
    })

    it('should apply custom className', () => {
      render(
        <CogsMissingState
          productsWithCogs={0}
          totalProducts={100}
          coverage={0}
          className="custom-class"
        />
      )
      expect(screen.getByTestId('cogs-missing-state')).toHaveClass('custom-class')
    })

    it('should handle negative coverage as 0%', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={-10} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge).toHaveTextContent('Критично')
    })

    it('should handle coverage over 100% as complete (null render)', () => {
      const { container } = render(
        <CogsMissingState productsWithCogs={100} totalProducts={100} coverage={150} />
      )
      // Component treats coverage >= 100 as complete (returns null)
      expect(container.firstChild).toBeNull()
    })

    it('should handle large product counts', () => {
      render(<CogsMissingState productsWithCogs={5000} totalProducts={10000} coverage={50} />)
      expect(screen.getByTestId('coverage-text')).toHaveTextContent('(5000 товаров без COGS)')
    })

    it('should not render action button without callback', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      expect(screen.queryByTestId('action-button')).not.toBeInTheDocument()
      // Info icon button should still be present for tooltip
      expect(screen.getByLabelText('Информация о расчете маржи')).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Test Suite 10: Loading State
  // =============================================================================

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      render(<CogsMissingState isLoading />)
      expect(screen.getByTestId('cogs-missing-state-loading')).toBeInTheDocument()
    })

    it('should not show actual content when loading', () => {
      render(<CogsMissingState isLoading productsWithCogs={50} totalProducts={100} />)
      expect(screen.queryByTestId('cogs-missing-state')).not.toBeInTheDocument()
      expect(screen.queryByTestId('coverage-badge')).not.toBeInTheDocument()
    })

    it('should show loading skeleton with proper ARIA', () => {
      render(<CogsMissingState isLoading />)
      const loadingCard = screen.getByTestId('cogs-missing-state-loading')
      expect(loadingCard).toHaveAttribute('aria-busy', 'true')
    })
  })

  // =============================================================================
  // Test Suite 11: Styling & Design System
  // =============================================================================

  describe('Styling & Design System', () => {
    it('should use dashed border for visual distinction', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const card = screen.getByTestId('cogs-missing-state')
      expect(card).toHaveClass('border-dashed', 'border-2')
    })

    it('should use Card component from shadcn/ui', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const card = screen.getByRole('alert')
      expect(card).toHaveClass('rounded-xl', 'bg-card', 'text-card-foreground')
    })

    it('should use Badge component for status indicator', () => {
      render(<CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />)
      const badge = screen.getByTestId('coverage-badge')
      expect(badge.tagName).toBe('DIV')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md')
    })

    it('should include ArrowRight icon in action button', () => {
      const onAssignCogs = vi.fn()
      render(
        <CogsMissingState
          productsWithCogs={0}
          totalProducts={100}
          coverage={0}
          onAssignCogs={onAssignCogs}
        />
      )
      const button = screen.getByTestId('action-button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  // =============================================================================
  // Test Suite 12: Transitions & Boundary Conditions
  // =============================================================================

  describe('Boundary Conditions', () => {
    it('should transition from critical to warning at 1%', () => {
      const { rerender } = render(
        <CogsMissingState productsWithCogs={0} totalProducts={100} coverage={0} />
      )
      expect(screen.getByTestId('coverage-badge')).toHaveTextContent('Критично')

      rerender(<CogsMissingState productsWithCogs={1} totalProducts={100} coverage={1} />)
      expect(screen.getByTestId('coverage-badge')).toHaveTextContent('Внимание')
    })

    it('should transition from warning to info at 50%', () => {
      const { rerender } = render(
        <CogsMissingState productsWithCogs={49} totalProducts={100} coverage={49} />
      )
      expect(screen.getByTestId('coverage-badge')).toHaveTextContent('Внимание')

      rerender(<CogsMissingState productsWithCogs={50} totalProducts={100} coverage={50} />)
      expect(screen.getByTestId('coverage-badge')).toHaveTextContent('Почти готово')
    })

    it('should hide component when reaching 100%', () => {
      const { rerender, container } = render(
        <CogsMissingState productsWithCogs={99} totalProducts={100} coverage={99} />
      )
      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()

      rerender(<CogsMissingState productsWithCogs={100} totalProducts={100} coverage={100} />)
      expect(container.firstChild).toBeNull()
    })
  })
})
