/**
 * Integration Tests: CogsMissingState → MetricCardEnhanced
 * TDD Approach: RED → GREEN → REFACTOR
 *
 * Task 1: Integrate CogsMissingState component into MetricCardEnhanced
 * @see docs/stories/epic-60/TDD-VALIDATION-INTEGRATION.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MetricCardEnhanced } from '../MetricCardEnhanced'
import { TooltipProvider } from '@/components/ui/tooltip'

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockProps = (overrides = {}) => ({
  title: 'Валовая прибыль',
  value: null as number | null,
  format: 'currency' as const,
  isLoading: false,
  error: null,
  showCogsWarning: false,
  productsWithCogs: 0,
  totalProducts: 0,
  cogsCoverage: 0,
  onAssignCogs: undefined,
  ...overrides,
})

/** Wrapper with TooltipProvider for tests */
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

// =============================================================================
// Story 60.3-FE: CogsMissingState Integration - showCogsWarning prop
// =============================================================================

describe('CogsMissingState Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('showCogsWarning prop', () => {
    it('should render CogsMissingState when showCogsWarning=true and value=null', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({ value: null, showCogsWarning: true, cogsCoverage: 0 })}
        />
      )

      // CogsMissingState should be rendered
      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()

      // Should show warning message
      expect(screen.getByText(/Назначьте себестоимость/)).toBeInTheDocument()
    })

    it('should NOT render CogsMissingState when showCogsWarning=false', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: null, showCogsWarning: false })} />
      )

      // Should NOT show CogsMissingState
      expect(screen.queryByTestId('cogs-missing-state')).not.toBeInTheDocument()

      // Should NOT show warning message
      expect(screen.queryByText(/Назначьте себестоимость/)).not.toBeInTheDocument()
    })

    it('should render CogsMissingState with correct props', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            showCogsWarning: true,
            productsWithCogs: 25,
            totalProducts: 100,
            cogsCoverage: 25,
          })}
        />
      )

      // Should show coverage information
      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
      expect(screen.getByText(/25%/)).toBeInTheDocument()
      expect(screen.getByText(/75 товаров без COGS/)).toBeInTheDocument()
    })

    it('should render CogsMissingState with action button when onAssignCogs provided', () => {
      const onAssignCogs = vi.fn()
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            showCogsWarning: true,
            onAssignCogs,
          })}
        />
      )

      const actionButton = screen.getByTestId('action-button')
      expect(actionButton).toBeInTheDocument()
    })

    it('should call onAssignCogs when action button is clicked', async () => {
      const onAssignCogs = vi.fn()
      const user = userEvent.setup()

      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            showCogsWarning: true,
            onAssignCogs,
          })}
        />
      )

      const actionButton = screen.getByTestId('action-button')
      await user.click(actionButton)

      expect(onAssignCogs).toHaveBeenCalledTimes(1)
    })
  })

  describe('rendering priorities', () => {
    it('should show error state before CogsMissingState', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            error: 'Ошибка загрузки данных',
            showCogsWarning: true,
          })}
        />
      )

      // Error should be shown
      expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()

      // CogsMissingState should NOT be shown
      expect(screen.queryByTestId('cogs-missing-state')).not.toBeInTheDocument()
      expect(screen.queryByText(/Назначьте себестоимость/)).not.toBeInTheDocument()
    })

    it('should show loading before CogsMissingState', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            isLoading: true,
            showCogsWarning: true,
          })}
        />
      )

      // Loading skeleton should be shown
      expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument()

      // CogsMissingState should NOT be shown
      expect(screen.queryByTestId('cogs-missing-state')).not.toBeInTheDocument()
    })

    it('should show normal content when value exists even with showCogsWarning=true', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: 50000,
            showCogsWarning: true,
            cogsCoverage: 50,
          })}
        />
      )

      // Should show the actual value, not CogsMissingState
      expect(screen.getByTestId('metric-value')).toBeInTheDocument()
      expect(screen.getByText(/50\s*000/)).toBeInTheDocument()

      // CogsMissingState should NOT be shown
      expect(screen.queryByTestId('cogs-missing-state')).not.toBeInTheDocument()
    })
  })

  describe('coverage levels', () => {
    it('should show critical level when coverage is 0%', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            showCogsWarning: true,
            cogsCoverage: 0,
            productsWithCogs: 0,
            totalProducts: 100,
          })}
        />
      )

      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
      expect(screen.getByTestId('coverage-badge')).toHaveTextContent('Критично')
    })

    it('should show warning level when coverage is 1-49%', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            showCogsWarning: true,
            cogsCoverage: 25,
            productsWithCogs: 25,
            totalProducts: 100,
          })}
        />
      )

      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
      expect(screen.getByTestId('coverage-badge')).toHaveTextContent('Внимание')
    })

    it('should show info level when coverage is 50-99%', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            showCogsWarning: true,
            cogsCoverage: 75,
            productsWithCogs: 75,
            totalProducts: 100,
          })}
        />
      )

      expect(screen.getByTestId('cogs-missing-state')).toBeInTheDocument()
      expect(screen.getByTestId('coverage-badge')).toHaveTextContent('Почти готово')
    })

    it('should NOT show CogsMissingState when coverage is 100%', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: null,
            showCogsWarning: true,
            cogsCoverage: 100,
            productsWithCogs: 100,
            totalProducts: 100,
          })}
        />
      )

      // CogsMissingState should not be shown when coverage is complete
      expect(screen.queryByTestId('cogs-missing-state')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have role="alert" on CogsMissingState', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: null, showCogsWarning: true })} />
      )

      const cogsState = screen.getByTestId('cogs-missing-state')
      expect(cogsState).toHaveAttribute('role', 'alert')
    })

    it('should have aria-live="polite" for screen readers', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: null, showCogsWarning: true })} />
      )

      const cogsState = screen.getByTestId('cogs-missing-state')
      expect(cogsState).toHaveAttribute('aria-live', 'polite')
    })

    it('should show info icon with tooltip', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: null, showCogsWarning: true })} />
      )

      // Margin formula info icon
      const infoIcon = screen.getAllByTestId('info-icon')
      expect(infoIcon.length).toBeGreaterThan(0)
    })
  })
})
