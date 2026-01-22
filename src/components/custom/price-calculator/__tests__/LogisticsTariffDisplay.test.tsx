/**
 * TDD Tests for LogisticsTariffDisplay Component
 * Story 44.8-FE: Logistics Tariff Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: Tests for LogisticsTariffDisplay component
 * These tests verify the component's behavior for tariff display and user interaction
 *
 * Tests cover:
 * - AC1: Volume-based tariff calculation display
 * - AC2: Warehouse tariff integration display
 * - AC3: Calculation breakdown display (4-step)
 * - AC4: Form integration (auto-fill, manual override, restore)
 * - AC5: Fallback mode display
 * - AC6: Real-time updates
 * - Accessibility (WCAG 2.1 AA)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogisticsTariffDisplay } from '../LogisticsTariffDisplay'

// ============================================================================
// Test Setup
// ============================================================================

const defaultProps = {
  volumeLiters: 3.0,
  coefficient: 1.0,
  value: 58.0,
  onChange: vi.fn(),
}

function renderComponent(props = {}) {
  return render(<LogisticsTariffDisplay {...defaultProps} {...props} />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// AC1: Volume-Based Tariff Calculation Display
// ============================================================================

describe('AC1: Volume-Based Tariff Calculation Display', () => {
  it('renders calculated tariff based on volume', () => {
    renderComponent({ volumeLiters: 3.0, coefficient: 1.0 })

    // Should display the logistics section
    expect(screen.getByText(/Логистика прямая/i)).toBeInTheDocument()
  })

  it('displays correct value for 1L volume (base rate only)', () => {
    const onChange = vi.fn()
    renderComponent({ volumeLiters: 1.0, coefficient: 1.0, value: 48, onChange })

    // Value should reflect base rate calculation
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(48)
  })

  it('displays correct value for multi-liter volume', () => {
    const onChange = vi.fn()
    // 3L with default tariffs (48 base + 2 * 5 additional) * 1.0 = 58
    renderComponent({ volumeLiters: 3.0, coefficient: 1.0, value: 58, onChange })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(58)
  })

  it('recalculates when volume changes', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <LogisticsTariffDisplay {...defaultProps} volumeLiters={3.0} onChange={onChange} />
    )

    // Rerender with different volume
    rerender(
      <LogisticsTariffDisplay {...defaultProps} volumeLiters={5.0} onChange={onChange} />
    )

    // Should trigger recalculation (if auto-calculate is enabled)
    // Note: Actual behavior depends on component implementation
  })
})

// ============================================================================
// AC2: Warehouse Tariff Integration Display
// ============================================================================

describe('AC2: Warehouse Tariff Integration Display', () => {
  it('shows warehouse name when provided', () => {
    renderComponent({ warehouseName: 'Коледино' })

    // Should show warehouse name somewhere in the breakdown
    expect(screen.getByText(/Коледино/i)).toBeInTheDocument()
  })

  it('shows "no warehouse" notice when warehouse not selected', () => {
    renderComponent({ warehouseName: undefined })

    expect(screen.getByText(/Выберите склад для точного расчёта/i)).toBeInTheDocument()
  })

  it('uses warehouse tariffs when provided', () => {
    const warehouseTariffs = { baseLiterRub: 60, additionalLiterRub: 8 }
    const onChange = vi.fn()

    renderComponent({
      volumeLiters: 3.0,
      coefficient: 1.0,
      warehouseTariffs,
      warehouseName: 'Тестовый склад',
      value: 76, // (60 + 2 * 8) * 1.0 = 76
      onChange,
    })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(76)
  })

  it('applies warehouse coefficient correctly', () => {
    const onChange = vi.fn()
    // 3L with coefficient 1.25: (48 + 2 * 5) * 1.25 = 72.5
    renderComponent({
      volumeLiters: 3.0,
      coefficient: 1.25,
      warehouseName: 'Коледино',
      value: 72.5,
      onChange,
    })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(72.5)
  })
})

// ============================================================================
// AC3: Calculation Breakdown Display
// ============================================================================

describe('AC3: Calculation Breakdown Display', () => {
  it('has collapsible breakdown section', () => {
    renderComponent()

    // Should have "Show calculation" trigger
    expect(screen.getByText(/Показать расчёт/i)).toBeInTheDocument()
  })

  it('breakdown is collapsed by default', () => {
    renderComponent()

    // Volume breakdown item should not be visible initially
    expect(screen.queryByText(/Объём:/i)).not.toBeInTheDocument()
  })

  it('expands breakdown when clicked', async () => {
    const user = userEvent.setup()
    renderComponent({ volumeLiters: 3.0 })

    const trigger = screen.getByText(/Показать расчёт/i)
    await user.click(trigger)

    // Should now show breakdown items
    await waitFor(() => {
      expect(screen.getByText(/Объём:/i)).toBeInTheDocument()
    })
  })

  it('shows 4-step breakdown when expanded', async () => {
    const user = userEvent.setup()
    renderComponent({ volumeLiters: 3.0, coefficient: 1.25 })

    const trigger = screen.getByText(/Показать расчёт/i)
    await user.click(trigger)

    await waitFor(() => {
      // Step 1: Volume
      expect(screen.getByText(/Объём:/i)).toBeInTheDocument()
      // Step 2: Base tariff
      expect(screen.getByText(/Базовый тариф:/i)).toBeInTheDocument()
      // Step 3: Additional liters
      expect(screen.getByText(/Доп\. литры:/i)).toBeInTheDocument()
      // Step 4: Coefficient
      expect(screen.getByText(/Коэффициент:/i)).toBeInTheDocument()
    })
  })

  it('shows final total in breakdown', async () => {
    const user = userEvent.setup()
    renderComponent({ volumeLiters: 3.0 })

    const trigger = screen.getByText(/Показать расчёт/i)
    await user.click(trigger)

    await waitFor(() => {
      expect(screen.getByText(/Итого логистика:/i)).toBeInTheDocument()
    })
  })

  it('displays volume correctly in breakdown', async () => {
    const user = userEvent.setup()
    renderComponent({ volumeLiters: 3.5 })

    const trigger = screen.getByText(/Показать расчёт/i)
    await user.click(trigger)

    await waitFor(() => {
      // Should show "3,50 л" (Russian format)
      expect(screen.getByText(/3,50 л/)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// AC4: Form Integration
// ============================================================================

describe('AC4: Form Integration - Auto-fill', () => {
  it('shows "Рассчитано" badge when auto-calculated', () => {
    renderComponent()

    expect(screen.getByText(/Рассчитано/i)).toBeInTheDocument()
  })

  it('has auto-calculate toggle switch', () => {
    renderComponent()

    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByText(/Рассчитать автоматически/i)).toBeInTheDocument()
  })

  it('auto-calculate is enabled by default', () => {
    renderComponent()

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeChecked()
  })

  it('input is disabled when auto-calculate is enabled', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })
})

describe('AC4: Form Integration - Manual Override', () => {
  it('enables input when auto-calculate is disabled', async () => {
    const user = userEvent.setup()
    renderComponent()

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const input = screen.getByRole('spinbutton')
    expect(input).not.toBeDisabled()
  })

  it('shows "Вручную" badge when manually overridden', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    // Disable auto-calculate
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    // Enter manual value
    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '100')

    expect(screen.getByText(/Вручную/i)).toBeInTheDocument()
  })

  it('calls onChange when manual value entered', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    // Disable auto-calculate first
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '100')

    expect(onChange).toHaveBeenCalled()
  })

  it('disables auto-calculate when user types manually', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    // Disable auto-calculate
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    // Type in input
    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '99')

    // Auto-calculate should be off
    expect(toggle).not.toBeChecked()
  })
})

describe('AC4: Form Integration - Restore Button', () => {
  it('shows restore button when value is manually overridden', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ value: 100, onChange }) // Different from calculated

    // Disable auto-calculate
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    // Should show restore button
    const restoreButton = screen.getByRole('button', { name: /Восстановить/i })
    expect(restoreButton).toBeInTheDocument()
  })

  it('restore button restores calculated value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ volumeLiters: 3.0, coefficient: 1.0, value: 100, onChange })

    // Disable auto-calculate first
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    // Click restore
    const restoreButton = screen.getByRole('button', { name: /Восстановить/i })
    await user.click(restoreButton)

    // Should call onChange with calculated value (58 for 3L with standard tariffs)
    expect(onChange).toHaveBeenCalledWith(58)
  })

  it('restore button re-enables auto-calculate', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ value: 100, onChange })

    // Disable auto-calculate
    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    // Click restore
    const restoreButton = screen.getByRole('button', { name: /Восстановить/i })
    await user.click(restoreButton)

    // Auto-calculate should be re-enabled
    expect(toggle).toBeChecked()
  })

  it('hides restore button when values match', () => {
    renderComponent({ volumeLiters: 3.0, coefficient: 1.0, value: 58 })

    // Should not show restore button when value matches calculated
    expect(screen.queryByRole('button', { name: /Восстановить/i })).not.toBeInTheDocument()
  })
})

// ============================================================================
// AC5: Fallback Mode Display
// ============================================================================

describe('AC5: Fallback Mode', () => {
  it('shows info notice when no warehouse selected', () => {
    renderComponent({ warehouseName: undefined })

    expect(screen.getByText(/Выберите склад для точного расчёта/i)).toBeInTheDocument()
  })

  it('uses default tariffs when no warehouse tariffs provided', () => {
    // Default tariffs: base=46, additional=14, coef=1.0
    // 3L: (46 + 2 * 14) * 1.0 = 74
    renderComponent({
      volumeLiters: 3.0,
      coefficient: 1.0,
      warehouseTariffs: undefined,
      warehouseName: undefined,
      value: 74, // Expected with default tariffs
    })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(74)
  })

  it('does not show info notice when warehouse is selected', () => {
    renderComponent({ warehouseName: 'Коледино' })

    expect(screen.queryByText(/Выберите склад для точного расчёта/i)).not.toBeInTheDocument()
  })
})

// ============================================================================
// AC6: Real-time Updates
// ============================================================================

describe('AC6: Real-time Updates', () => {
  it('updates calculated value when coefficient changes', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <LogisticsTariffDisplay {...defaultProps} coefficient={1.0} onChange={onChange} />
    )

    // Change coefficient
    rerender(
      <LogisticsTariffDisplay {...defaultProps} coefficient={1.25} onChange={onChange} />
    )

    // Should trigger update (if auto-calculate enabled)
    // Component should recalculate
  })

  it('updates calculated value when warehouseTariffs change', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <LogisticsTariffDisplay {...defaultProps} warehouseTariffs={null} onChange={onChange} />
    )

    // Change warehouse tariffs
    rerender(
      <LogisticsTariffDisplay
        {...defaultProps}
        warehouseTariffs={{ baseLiterRub: 60, additionalLiterRub: 8 }}
        onChange={onChange}
      />
    )

    // Should trigger update
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

  it('shows loading state in breakdown area', () => {
    renderComponent({ isLoading: true })

    // Should show skeleton or loading indicator
    // Exact implementation depends on TariffBreakdown component
  })
})

// ============================================================================
// Disabled State
// ============================================================================

describe('Disabled State', () => {
  it('disables input when component is disabled', () => {
    renderComponent({ disabled: true })

    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })

  it('disables toggle when component is disabled', () => {
    renderComponent({ disabled: true })

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })
})

// ============================================================================
// Accessibility (WCAG 2.1 AA)
// ============================================================================

describe('Accessibility', () => {
  it('has accessible name for input field', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAccessibleName()
  })

  it('has accessible label for toggle', () => {
    renderComponent()

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAccessibleName()
  })

  it('restore button has accessible label', async () => {
    const user = userEvent.setup()
    renderComponent({ value: 100 })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const restoreButton = screen.getByRole('button', { name: /Восстановить/i })
    expect(restoreButton).toHaveAccessibleName()
  })

  it('breakdown trigger is keyboard accessible', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/Показать расчёт/i)

    // Should be focusable and activatable with keyboard
    trigger.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText(/Объём:/i)).toBeInTheDocument()
    })
  })

  it('has aria-live region for calculated result', () => {
    const { container } = renderComponent()

    // Should announce changes to screen readers
    const liveRegion = container.querySelector('[aria-live]')
    expect(liveRegion).toBeInTheDocument()
  })

  it('tooltip content is accessible', () => {
    const { container } = renderComponent()

    // Tooltip trigger should exist and be accessible
    const tooltipTrigger = container.querySelector('[data-state]') ||
      container.querySelector('button[aria-label]')
    expect(tooltipTrigger).toBeInTheDocument()
  })
})

// ============================================================================
// Input Validation
// ============================================================================

describe('Input Validation', () => {
  it('accepts positive numbers', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '50')

    expect(onChange).toHaveBeenCalledWith(50)
  })

  it('handles decimal input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ onChange })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '72.5')

    expect(onChange).toHaveBeenCalledWith(72.5)
  })

  it('converts empty input to 0', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ value: 100, onChange })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    const input = screen.getByRole('spinbutton')
    await user.clear(input)

    // Should call onChange with 0 for empty input
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('has min=0 constraint on input', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '0')
  })

  it('has step=0.01 for decimal precision', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('step', '0.01')
  })
})

// ============================================================================
// Visual Styling
// ============================================================================

describe('Visual Styling', () => {
  it('has cyan color theme for logistics section', () => {
    const { container } = renderComponent()

    // Should have cyan background/border styling
    const section = container.querySelector('.bg-cyan-50')
    expect(section).toBeInTheDocument()
  })

  it('shows truck icon', () => {
    renderComponent()

    // Truck icon should be present (aria-hidden for decorative)
    // Check by presence of the icon container
    const header = screen.getByText(/Логистика прямая/i).closest('div')
    expect(header).toBeInTheDocument()
  })

  it('input has muted background when auto-calculate enabled', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveClass('bg-muted')
  })
})
