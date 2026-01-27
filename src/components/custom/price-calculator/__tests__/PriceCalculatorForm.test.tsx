/**
 * Unit tests for PriceCalculatorForm component
 * Story 44.2-FE: Input Form Component for Price Calculator
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { PriceCalculatorForm } from '../PriceCalculatorForm'

// Mock the sub-components that use React Query or complex logic
vi.mock('../MarginSlider', () => ({
  MarginSlider: ({
    name,
    error,
    unit,
  }: {
    name: string
    error?: string
    unit: string
  }) => (
    <div data-testid={`slider-${name}`}>
      <input type="number" data-testid={`input-${name}`} />
      <span>{unit}</span>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}))

// Story 44.30: Mock BuybackSlider (new component without margin zones)
vi.mock('../BuybackSlider', () => ({
  BuybackSlider: ({
    name,
    error,
    unit,
  }: {
    name: string
    error?: string
    unit: string
  }) => (
    <div data-testid={`slider-${name}`}>
      <input type="number" data-testid={`input-${name}`} />
      <span>{unit}</span>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}))

vi.mock('../FieldTooltip', () => ({
  FieldTooltip: ({ content: _content }: { content: string }) => (
    <button type="button" aria-label="Show tooltip">
      ?
    </button>
  ),
}))

vi.mock('../ProductSearchSelect', () => ({
  ProductSearchSelect: ({
    onProductSelect,
  }: {
    onProductSelect?: (p: unknown) => void
  }) => (
    <div data-testid="product-search-select">
      <button type="button" onClick={() => onProductSelect?.({ nmId: 123 })}>
        Выбрать товар
      </button>
    </div>
  ),
}))

vi.mock('../CategorySelector', () => ({
  CategorySelector: () => (
    <div data-testid="category-selector">Category Selector Mock</div>
  ),
}))

vi.mock('../WarehouseSection', () => ({
  WarehouseSection: () => (
    <div data-testid="warehouse-section">Warehouse Section Mock</div>
  ),
}))

vi.mock('../FulfillmentTypeSelector', () => ({
  FulfillmentTypeSelector: () => (
    <div data-testid="fulfillment-type-selector">FBO/FBS Selector Mock</div>
  ),
}))

vi.mock('../DimensionInputSection', () => ({
  DimensionInputSection: () => (
    <div data-testid="dimension-input-section">Dimensions Mock</div>
  ),
}))

vi.mock('../AutoFillWarning', () => ({
  AutoFillWarning: () => null,
}))

vi.mock('../TaxConfigurationSection', () => ({
  TaxConfigurationSection: () => (
    <div data-testid="tax-configuration-section">Tax Config Mock</div>
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

// Story 44.44: Mock preset components and hook
vi.mock('../usePriceCalculatorPreset', () => ({
  usePriceCalculatorPreset: () => ({
    hasPreset: false,
    isPresetLoaded: false,
    loadPreset: vi.fn(() => null),
    savePreset: vi.fn(),
    clearPreset: vi.fn(),
  }),
}))

vi.mock('../PresetIndicator', () => ({
  PresetIndicator: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <span data-testid="preset-indicator">Preset Loaded</span> : null,
}))

vi.mock('../PresetActions', () => ({
  PresetActions: () => <div data-testid="preset-actions">Preset Actions Mock</div>,
}))

describe('PriceCalculatorForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Required Fields', () => {
    it('renders form with Russian title', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Check for Russian title
      expect(screen.getByText('Калькулятор цены')).toBeInTheDocument()
    })

    it('renders form description', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(
        screen.getByText(
          /Рассчитайте оптимальную цену на основе затрат и желаемой маржи/
        )
      ).toBeInTheDocument()
    })

    it('renders target margin slider', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Target margin section header
      expect(screen.getByText('Целевая маржа')).toBeInTheDocument()
      expect(screen.getByTestId('slider-target_margin_pct')).toBeInTheDocument()
    })

    it('renders fixed costs section', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Fixed costs section - check for COGS field
      expect(screen.getByText(/Фиксированные затраты/)).toBeInTheDocument()
    })

    it('renders percentage costs section', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Percentage costs section
      expect(screen.getByText(/Процентные расходы/)).toBeInTheDocument()
      expect(screen.getByTestId('slider-buyback_pct')).toBeInTheDocument()
    })
  })

  describe('Form Structure', () => {
    it('renders product search select', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('product-search-select')).toBeInTheDocument()
    })

    it('renders category selector', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('category-selector')).toBeInTheDocument()
    })

    it('renders tax configuration section', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('tax-configuration-section')).toBeInTheDocument()
    })
  })

  describe('Story 44.5: Auto-calculation', () => {
    it('shows calculating indicator during loading', () => {
      renderWithProviders(
        <PriceCalculatorForm onSubmit={mockOnSubmit} loading={true} />
      )

      // Check for loading text (Russian: Расчёт...) - may appear multiple times
      const loadingElements = screen.getAllByText('Расчёт...')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('triggers reset confirmation when results exist', async () => {
      renderWithProviders(
        <PriceCalculatorForm onSubmit={mockOnSubmit} hasResults={true} />
      )

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      await userEvent.click(resetButton)

      // Should show confirmation dialog (Russian)
      await waitFor(() => {
        expect(screen.getByText(/Подтверждение сброса/i)).toBeInTheDocument()
      })
    })

    it('resets immediately when no results', async () => {
      renderWithProviders(
        <PriceCalculatorForm onSubmit={mockOnSubmit} hasResults={false} />
      )

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      await userEvent.click(resetButton)

      // Should NOT show confirmation dialog
      expect(
        screen.queryByText(/Подтверждение сброса/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Form Actions', () => {
    it('renders Calculate button in Russian', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(
        screen.getByRole('button', { name: /рассчитать цену/i })
      ).toBeInTheDocument()
    })

    it('renders Reset button in Russian', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(
        screen.getByRole('button', { name: /сбросить/i })
      ).toBeInTheDocument()
    })

    it('shows loading state on Calculate button', () => {
      renderWithProviders(
        <PriceCalculatorForm onSubmit={mockOnSubmit} loading={true} />
      )

      // When loading, shows "Расчёт..." instead of "Рассчитать цену" - may appear multiple times
      const loadingElements = screen.getAllByText('Расчёт...')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('disables Calculate button when disabled prop is true', () => {
      renderWithProviders(
        <PriceCalculatorForm onSubmit={mockOnSubmit} disabled={true} />
      )

      const calculateBtn = screen.getByRole('button', {
        name: /рассчитать цену/i,
      })
      expect(calculateBtn).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Калькулятор цены')).toBeInTheDocument()
      expect(
        screen.getByText(
          /Рассчитайте оптимальную цену на основе затрат и желаемой маржи/
        )
      ).toBeInTheDocument()
    })

    it('has field tooltips for explanations', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Should have multiple tooltip buttons
      const tooltips = screen.getAllByLabelText(/show tooltip/i)
      expect(tooltips.length).toBeGreaterThan(0)
    })

    it('reset button has keyboard shortcut hint in Russian', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      expect(resetButton).toHaveAttribute('title', 'Нажмите Esc для сброса')
    })

    it('calculate button has keyboard shortcut hint in Russian', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const calculateBtn = screen.getByRole('button', {
        name: /рассчитать цену/i,
      })
      expect(calculateBtn).toHaveAttribute(
        'title',
        'Нажмите Enter для расчёта'
      )
    })
  })

  describe('Responsive Layout', () => {
    it('renders in responsive grid structure', () => {
      const { container } = renderWithProviders(
        <PriceCalculatorForm onSubmit={mockOnSubmit} />
      )

      // Check for form element
      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })

    it('renders form with test id', () => {
      renderWithProviders(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
    })
  })
})
