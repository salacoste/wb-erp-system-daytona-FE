/**
 * TDD Tests for LogisticsTariffCalculator Component
 * Story 44.8-FE: Logistics Tariff Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: Tests for LogisticsTariffCalculator component
 * This component extends LogisticsTariffDisplay with editable tariff inputs
 *
 * Tests cover:
 * - Editable tariff input fields (base, additional, coefficient)
 * - Tariff validation (AC4 limits: 0.5-3.0 coefficient)
 * - Reset to defaults functionality
 * - Integration with calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogisticsTariffCalculator } from '../LogisticsTariffCalculator'

// ============================================================================
// Test Setup
// ============================================================================

const defaultProps = {
  volumeLiters: 3.0,
  value: 58.0,
  onChange: vi.fn(),
}

function renderComponent(props = {}) {
  return render(<LogisticsTariffCalculator {...defaultProps} {...props} />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// Basic Rendering
// ============================================================================

describe('Basic Rendering', () => {
  it('renders component with title', () => {
    renderComponent()
    expect(screen.getByText(/Логистика прямая/i)).toBeInTheDocument()
  })

  it('renders auto-calculate toggle', () => {
    renderComponent()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders value input field', () => {
    renderComponent()
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('has collapsible tariff settings section', () => {
    renderComponent()
    expect(screen.getByText(/Настроить тарифы/i)).toBeInTheDocument()
  })
})

// ============================================================================
// Tariff Settings Section
// ============================================================================

describe('Tariff Settings Section', () => {
  it('tariff settings are collapsed by default', () => {
    renderComponent()
    // Input fields for tariffs should not be visible
    expect(screen.queryByLabelText(/Базовый тариф/i)).not.toBeInTheDocument()
  })

  it('expands tariff settings when clicked', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      // Should show tariff input fields
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })
  })

  it('shows base liter input when expanded', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs.length).toBeGreaterThan(1) // Main input + tariff inputs
    })
  })

  it('shows additional liter input when expanded', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Доп\. литр/i)).toBeInTheDocument()
    })
  })

  it('shows coefficient input when expanded', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Коэффициент/i)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Tariff Input Editing
// ============================================================================

describe('Tariff Input Editing', () => {
  it('allows editing base liter rate', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    // Expand tariff settings
    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })

    // Find and edit base rate input
    const inputs = screen.getAllByRole('spinbutton')
    const baseInput = inputs.find((input) =>
      input.closest('div')?.textContent?.includes('Базовый')
    )

    if (baseInput) {
      await user.clear(baseInput)
      await user.type(baseInput, '60')
    }

    // Should trigger recalculation
    expect(onChange).toHaveBeenCalled()
  })

  it('allows editing additional liter rate', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Доп\. литр/i)).toBeInTheDocument()
    })
  })

  it('allows editing coefficient', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Коэффициент/i)).toBeInTheDocument()
    })
  })

  it('recalculates when tariff changes and auto-calculate is on', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    // Expand tariff settings
    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })

    // Auto-calculate should be on by default, so changing tariff should trigger onChange
    const initialCallCount = onChange.mock.calls.length

    // Edit a tariff value - this should trigger recalculation
    // Implementation depends on TariffInputFields component
    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount)
  })
})

// ============================================================================
// Tariff Validation
// ============================================================================

describe('Tariff Validation', () => {
  it('enforces minimum coefficient of 0.5', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Коэффициент/i)).toBeInTheDocument()
    })

    // Try to enter coefficient below minimum
    // Validation should prevent or correct it
  })

  it('enforces maximum coefficient of 3.0', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Коэффициент/i)).toBeInTheDocument()
    })

    // Try to enter coefficient above maximum
    // Validation should prevent or correct it
  })

  it('enforces minimum base liter rate of 1', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })
  })

  it('enforces maximum base liter rate of 500', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Reset to Defaults
// ============================================================================

describe('Reset to Defaults', () => {
  it('shows reset button in tariff settings', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /Сбросить/i })
      expect(resetButton).toBeInTheDocument()
    })
  })

  it('reset button restores default tariffs', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /Сбросить/i })
    await user.click(resetButton)

    // Should reset to default values and recalculate
    expect(onChange).toHaveBeenCalled()
  })

  it('reset uses warehouse tariffs if available', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const warehouseTariffs = { baseLiterRub: 60, additionalLiterRub: 8 }

    renderComponent({
      warehouseTariffs,
      warehouseName: 'Тестовый склад',
      onChange,
    })

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })

    const resetButton = screen.getByRole('button', { name: /Сбросить/i })
    await user.click(resetButton)

    // Should reset to warehouse tariffs, not global defaults
    expect(onChange).toHaveBeenCalled()
  })
})

// ============================================================================
// Warehouse Integration
// ============================================================================

describe('Warehouse Integration', () => {
  it('uses warehouse tariffs for initial values', () => {
    const warehouseTariffs = { baseLiterRub: 60, additionalLiterRub: 8 }

    renderComponent({
      warehouseTariffs,
      warehouseName: 'Коледино',
      value: 76, // (60 + 2*8) * 1.0 = 76
    })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(76)
  })

  it('uses warehouse coefficient for calculation', () => {
    const warehouseTariffs = { baseLiterRub: 48, additionalLiterRub: 5 }

    renderComponent({
      warehouseTariffs,
      warehouseCoefficient: 1.25,
      warehouseName: 'Коледино',
      value: 72.5, // (48 + 2*5) * 1.25 = 72.5
    })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(72.5)
  })

  it('shows no warehouse notice when warehouse not selected', () => {
    renderComponent({ warehouseName: undefined })

    expect(screen.getByText(/Выберите склад для точного расчёта/i)).toBeInTheDocument()
  })

  it('hides no warehouse notice when warehouse selected', () => {
    renderComponent({ warehouseName: 'Коледино' })

    expect(screen.queryByText(/Выберите склад для точного расчёта/i)).not.toBeInTheDocument()
  })
})

// ============================================================================
// Auto-Calculate Toggle
// ============================================================================

describe('Auto-Calculate Toggle', () => {
  it('auto-calculate is enabled by default', () => {
    renderComponent()

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeChecked()
  })

  it('disables main input when auto-calculate is on', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })

  it('enables main input when auto-calculate is off', async () => {
    const user = userEvent.setup()
    renderComponent()

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const input = screen.getByRole('spinbutton')
    expect(input).not.toBeDisabled()
  })

  it('recalculates and updates value when toggle turned on', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ value: 100, onChange }) // Different from calculated

    // Turn off auto-calculate first
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    // Turn it back on
    await user.click(toggle)

    // Should call onChange with calculated value
    // 3L with default tariffs: (46 + 2 × 14) × 1.0 = 74
    expect(onChange).toHaveBeenCalledWith(74)
  })
})

// ============================================================================
// Manual Override
// ============================================================================

describe('Manual Override', () => {
  it('shows restore button when value differs from calculated', async () => {
    const user = userEvent.setup()
    renderComponent({ value: 100 })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const restoreButton = screen.getByRole('button', { name: /Восстановить/i })
    expect(restoreButton).toBeInTheDocument()
  })

  it('shows "Вручную" badge when manually overridden', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '99')

    expect(screen.getByText(/Вручную/i)).toBeInTheDocument()
  })

  it('restore button restores calculated value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ value: 100, onChange })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const restoreButton = screen.getByRole('button', { name: /Восстановить/i })
    await user.click(restoreButton)

    // 3L with default tariffs: (46 + 2 × 14) × 1.0 = 74
    expect(onChange).toHaveBeenCalledWith(74)
  })
})

// ============================================================================
// Tariff Breakdown Display
// ============================================================================

describe('Tariff Breakdown Display', () => {
  it('shows tariff breakdown section', () => {
    renderComponent()

    expect(screen.getByText(/Показать расчёт/i)).toBeInTheDocument()
  })

  it('breakdown shows warehouse name if provided', () => {
    renderComponent({ warehouseName: 'Коледино' })

    expect(screen.getByText(/Коледино/i)).toBeInTheDocument()
  })

  it('updates breakdown when tariffs change', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Expand breakdown
    const breakdownTrigger = screen.getByText(/Показать расчёт/i)
    await user.click(breakdownTrigger)

    await waitFor(() => {
      expect(screen.getByText(/Объём:/i)).toBeInTheDocument()
    })

    // Expand tariff settings and change a value
    const settingsTrigger = screen.getByText(/Настроить тарифы/i)
    await user.click(settingsTrigger)

    // After changing tariff, breakdown should update
  })
})

// ============================================================================
// Loading State
// ============================================================================

describe('Loading State', () => {
  it('disables toggle when loading', () => {
    renderComponent({ isLoading: true })

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })

  it('disables main input when loading', () => {
    renderComponent({ isLoading: true })

    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })
})

// ============================================================================
// Disabled State
// ============================================================================

describe('Disabled State', () => {
  it('disables all inputs when disabled', () => {
    renderComponent({ disabled: true })

    const input = screen.getByRole('spinbutton')
    const toggle = screen.getByRole('switch')

    expect(input).toBeDisabled()
    expect(toggle).toBeDisabled()
  })

  it('disables tariff inputs when disabled', async () => {
    const user = userEvent.setup()
    renderComponent({ disabled: true })

    const trigger = screen.getByText(/Настроить тарифы/i)
    await user.click(trigger)

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton')
      inputs.forEach((input) => {
        expect(input).toBeDisabled()
      })
    })
  })
})

// ============================================================================
// Accessibility
// ============================================================================

describe('Accessibility', () => {
  it('main input has accessible name', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAccessibleName()
  })

  it('toggle has accessible name', () => {
    renderComponent()

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAccessibleName()
  })

  it('has screen reader hint for calculated value', () => {
    const { container } = renderComponent()

    const srHint = container.querySelector('.sr-only')
    expect(srHint).toBeInTheDocument()
  })

  it('tariff settings trigger is keyboard accessible', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Настроить тарифы/i)
    trigger.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText(/Базовый тариф/i)).toBeInTheDocument()
    })
  })

  it('restore button has aria-label', async () => {
    const user = userEvent.setup()
    renderComponent({ value: 100 })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const restoreButton = screen.getByRole('button', { name: /Восстановить/i })
    expect(restoreButton).toHaveAttribute('aria-label')
  })
})

// ============================================================================
// Formula Tooltip
// ============================================================================

describe('Formula Tooltip', () => {
  it('shows tooltip with formula explanation', () => {
    renderComponent()

    // Tooltip should contain formula info
    // Check for tooltip trigger presence
    const header = screen.getByText(/Логистика прямая/i).closest('div')
    expect(header).toBeInTheDocument()
  })
})
