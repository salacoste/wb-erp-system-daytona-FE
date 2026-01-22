/**
 * TDD Tests for Story 44.35-FE: Bug Fix - FBO/FBS Toggle Crashes Application
 *
 * These tests verify that the FBO/FBS toggle does NOT crash the application.
 * The bug is caused by useWatch hooks being called conditionally inside JSX,
 * which violates React's Rules of Hooks.
 *
 * TDD RED PHASE: These tests WILL FAIL until the bug is fixed by moving
 * all useWatch calls to the top level of the component.
 *
 * Bug Root Cause (lines 185-212 in PriceCalculatorForm.tsx):
 * - useWatch({ control, name: 'box_type' }) called inside {fulfillmentType === 'FBO' && ...}
 * - useWatch({ control, name: 'turnover_days' }) called inside conditional block
 * - These hooks are only called when FBO is selected, violating hooks rules
 *
 * @see docs/stories/epic-44/story-44.35-fe-bugfix-fbs-toggle-crash.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PriceCalculatorForm } from '../PriceCalculatorForm'

// ============================================================================
// Test Setup
// ============================================================================

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

// Mock sub-components to isolate the form component behavior
// We need to NOT mock FulfillmentTypeSelector to test the actual toggle behavior
vi.mock('../MarginSlider', () => ({
  MarginSlider: ({ name }: { name: string }) => (
    <div data-testid={`slider-${name}`}>
      <input type="number" data-testid={`input-${name}`} />
    </div>
  ),
}))

vi.mock('../BuybackSlider', () => ({
  BuybackSlider: ({ name }: { name: string }) => (
    <div data-testid={`slider-${name}`}>
      <input type="number" data-testid={`input-${name}`} />
    </div>
  ),
}))

vi.mock('../FieldTooltip', () => ({
  FieldTooltip: () => <button type="button" aria-label="Show tooltip">?</button>,
}))

vi.mock('../ProductSearchSelect', () => ({
  ProductSearchSelect: () => <div data-testid="product-search-select">Mock</div>,
}))

vi.mock('../CategorySelector', () => ({
  CategorySelector: () => <div data-testid="category-selector">Mock</div>,
}))

vi.mock('../WarehouseSection', () => ({
  WarehouseSection: () => <div data-testid="warehouse-section">Mock</div>,
}))

vi.mock('../DimensionInputSection', () => ({
  DimensionInputSection: () => <div data-testid="dimension-section">Mock</div>,
}))

vi.mock('../AutoFillWarning', () => ({
  AutoFillWarning: () => null,
}))

vi.mock('../TaxConfigurationSection', () => ({
  TaxConfigurationSection: () => <div data-testid="tax-section">Mock</div>,
}))

// Critical: Do NOT mock BoxTypeSelector, TurnoverDaysInput, WeightThresholdCheckbox,
// LocalizationIndexInput - these are part of the bug
vi.mock('../BoxTypeSelector', () => ({
  BoxTypeSelector: ({ value }: { value: string }) => (
    <div data-testid="box-type-selector">Box: {value}</div>
  ),
}))

vi.mock('../TurnoverDaysInput', () => ({
  TurnoverDaysInput: ({ value }: { value: number }) => (
    <div data-testid="turnover-days-input">Days: {value}</div>
  ),
}))

vi.mock('../WeightThresholdCheckbox', () => ({
  WeightThresholdCheckbox: ({ checked }: { checked: boolean }) => (
    <div data-testid="weight-checkbox">Weight: {checked ? 'yes' : 'no'}</div>
  ),
}))

vi.mock('../LocalizationIndexInput', () => ({
  LocalizationIndexInput: ({ value }: { value: number }) => (
    <div data-testid="localization-input">Index: {value}</div>
  ),
}))

vi.mock('@/hooks/useProductAutoFill', () => ({
  useProductAutoFill: () => ({
    dimensionAutoFill: null,
    categoryAutoFill: null,
    handleProductSelect: vi.fn(),
    markDimensionsModified: vi.fn(),
    restoreDimensions: vi.fn(),
    productHasDimensions: true,
    productHasCategory: true,
  }),
}))

// ============================================================================
// Story 44.35-FE: FBO/FBS Toggle Crash Tests
// ============================================================================

describe('Story 44.35-FE: FBO/FBS Toggle Does Not Crash', () => {
  const mockOnSubmit = vi.fn()
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Capture console errors to detect React hooks violations
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  // --------------------------------------------------------------------------
  // AC1: FBO to FBS Transition
  // --------------------------------------------------------------------------
  describe('AC1: FBO to FBS Transition', () => {
    it('should not crash when toggling from FBO to FBS', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Initial state: FBO is selected (default)
      const form = screen.getByTestId('price-calculator-form')
      expect(form).toBeInTheDocument()

      // Find FBS radio button and click it
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      expect(fbsButton).toBeInTheDocument()

      // This click should NOT crash the application
      await user.click(fbsButton)

      // After click, form should still be present (no crash)
      await waitFor(() => {
        expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
      })

      // FBS should now be selected
      expect(fbsButton).toHaveAttribute('aria-checked', 'true')
    })

    it('should hide FBO-only fields after switching to FBS', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Initially FBO - BoxTypeSelector and TurnoverDaysInput should be visible
      expect(screen.getByTestId('box-type-selector')).toBeInTheDocument()
      expect(screen.getByTestId('turnover-days-input')).toBeInTheDocument()

      // Toggle to FBS
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      await user.click(fbsButton)

      // FBO-only fields should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('box-type-selector')).not.toBeInTheDocument()
        expect(screen.queryByTestId('turnover-days-input')).not.toBeInTheDocument()
      })
    })

    it('should not produce React hooks errors in console', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Toggle to FBS
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      await user.click(fbsButton)

      // Wait for any async effects
      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /FBS/i })).toHaveAttribute('aria-checked', 'true')
      })

      // Check console.error was not called with hooks-related errors
      const hookErrors = consoleErrorSpy.mock.calls.filter(
        call => call.some(arg =>
          typeof arg === 'string' &&
          (arg.includes('Rendered fewer hooks than expected') ||
           arg.includes('Rendered more hooks than expected') ||
           arg.includes('Rules of Hooks'))
        )
      )
      expect(hookErrors).toHaveLength(0)
    })
  })

  // --------------------------------------------------------------------------
  // AC2: FBS to FBO Transition
  // --------------------------------------------------------------------------
  describe('AC2: FBS to FBO Transition', () => {
    it('should not crash when toggling from FBS to FBO', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // First switch to FBS
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      await user.click(fbsButton)

      // Verify FBS is selected
      await waitFor(() => {
        expect(fbsButton).toHaveAttribute('aria-checked', 'true')
      })

      // Now switch back to FBO
      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      await user.click(fboButton)

      // Form should still be present (no crash)
      await waitFor(() => {
        expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
      })

      // FBO should be selected
      expect(fboButton).toHaveAttribute('aria-checked', 'true')
    })

    it('should show FBO-only fields after switching back to FBO', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Toggle to FBS (FBO fields should disappear)
      await user.click(screen.getByRole('radio', { name: /FBS/i }))

      await waitFor(() => {
        expect(screen.queryByTestId('box-type-selector')).not.toBeInTheDocument()
      })

      // Toggle back to FBO
      await user.click(screen.getByRole('radio', { name: /FBO/i }))

      // FBO-only fields should reappear
      await waitFor(() => {
        expect(screen.getByTestId('box-type-selector')).toBeInTheDocument()
        expect(screen.getByTestId('turnover-days-input')).toBeInTheDocument()
      })
    })
  })

  // --------------------------------------------------------------------------
  // AC3: Rapid Toggling
  // --------------------------------------------------------------------------
  describe('AC3: Rapid Toggling', () => {
    it('should handle rapid toggling without crashing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })

      // Rapidly toggle multiple times
      for (let i = 0; i < 5; i++) {
        await user.click(fbsButton)
        await user.click(fboButton)
      }

      // Form should still be functional
      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
    })

    it('should maintain UI stability during rapid toggling', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      const fboButton = screen.getByRole('radio', { name: /FBO/i })

      // Toggle rapidly
      await user.click(fbsButton)
      await user.click(fboButton)
      await user.click(fbsButton)
      await user.click(fboButton)
      await user.click(fbsButton)

      // Final state should be FBS
      await waitFor(() => {
        expect(fbsButton).toHaveAttribute('aria-checked', 'true')
        expect(fboButton).toHaveAttribute('aria-checked', 'false')
      })

      // No console errors
      const hookErrors = consoleErrorSpy.mock.calls.filter(
        call => call.some(arg =>
          typeof arg === 'string' && arg.includes('hooks')
        )
      )
      expect(hookErrors).toHaveLength(0)
    })
  })

  // --------------------------------------------------------------------------
  // AC4: Form Submission After Toggle
  // --------------------------------------------------------------------------
  describe('AC4: Form Submission After Toggle', () => {
    it('should allow form submission after toggling to FBS', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Toggle to FBS
      await user.click(screen.getByRole('radio', { name: /FBS/i }))

      // Find and click the submit button
      const calculateButton = screen.getByRole('button', { name: /рассчитать цену/i })
      expect(calculateButton).toBeInTheDocument()

      // Form should be interactable (not crashed)
      await user.click(calculateButton)

      // The form should process (may fail validation, but shouldn't crash)
      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
    })

    it('should allow form submission after toggling FBO -> FBS -> FBO', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Toggle sequence
      await user.click(screen.getByRole('radio', { name: /FBS/i }))
      await user.click(screen.getByRole('radio', { name: /FBO/i }))

      // Form should still be functional
      const calculateButton = screen.getByRole('button', { name: /рассчитать цену/i })
      await user.click(calculateButton)

      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // AC5: Field Values Preserved
  // --------------------------------------------------------------------------
  describe('AC5: Field Values Preserved', () => {
    it('should preserve other form values when toggling fulfillment type', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // WeightThresholdCheckbox should be visible for both FBO and FBS
      const weightCheckbox = screen.getByTestId('weight-checkbox')
      expect(weightCheckbox).toBeInTheDocument()

      // Toggle to FBS
      await user.click(screen.getByRole('radio', { name: /FBS/i }))

      // Weight checkbox should still be present (it's for both types)
      await waitFor(() => {
        expect(screen.getByTestId('weight-checkbox')).toBeInTheDocument()
      })

      // Toggle back to FBO
      await user.click(screen.getByRole('radio', { name: /FBO/i }))

      // Weight checkbox should still be there
      expect(screen.getByTestId('weight-checkbox')).toBeInTheDocument()
    })

    it('should preserve LocalizationIndexInput across toggles', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // LocalizationIndexInput should be visible for both types
      expect(screen.getByTestId('localization-input')).toBeInTheDocument()

      // Toggle to FBS
      await user.click(screen.getByRole('radio', { name: /FBS/i }))

      await waitFor(() => {
        expect(screen.getByTestId('localization-input')).toBeInTheDocument()
      })

      // Toggle back to FBO
      await user.click(screen.getByRole('radio', { name: /FBO/i }))

      expect(screen.getByTestId('localization-input')).toBeInTheDocument()
    })
  })

  // --------------------------------------------------------------------------
  // AC6: No Regression - Core Form Functionality
  // --------------------------------------------------------------------------
  describe('AC6: No Regression', () => {
    it('should render form with all sections after toggle', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Toggle to FBS
      await user.click(screen.getByRole('radio', { name: /FBS/i }))

      // Core sections should still be present
      await waitFor(() => {
        expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
        expect(screen.getByTestId('warehouse-section')).toBeInTheDocument()
        expect(screen.getByTestId('product-search-select')).toBeInTheDocument()
        expect(screen.getByTestId('category-selector')).toBeInTheDocument()
        expect(screen.getByTestId('tax-section')).toBeInTheDocument()
      })
    })

    it('should have functional reset button after toggle', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Toggle to FBS
      await user.click(screen.getByRole('radio', { name: /FBS/i }))

      // Reset button should be functional
      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      expect(resetButton).toBeInTheDocument()

      await user.click(resetButton)

      // Form should not crash
      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Additional Edge Case Tests
// ============================================================================

describe('Story 44.35-FE: Edge Cases', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle component remount without hooks errors', async () => {
    const { unmount } = renderWithProviders(
      <PriceCalculatorForm onSubmit={mockOnSubmit} />
    )

    // Unmount
    unmount()

    // Remount
    const { getByTestId } = renderWithProviders(
      <PriceCalculatorForm onSubmit={mockOnSubmit} />
    )

    expect(getByTestId('price-calculator-form')).toBeInTheDocument()
  })

  it('should work correctly with disabled prop during toggle', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(
      <PriceCalculatorForm onSubmit={mockOnSubmit} disabled={false} />
    )

    // Toggle to FBS
    await user.click(screen.getByRole('radio', { name: /FBS/i }))

    // Rerender with disabled
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <PriceCalculatorForm onSubmit={mockOnSubmit} disabled={true} />
      </QueryClientProvider>
    )

    // Form should still be present
    expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
  })
})
