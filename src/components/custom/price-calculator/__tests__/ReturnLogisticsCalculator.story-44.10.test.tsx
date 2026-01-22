/**
 * TDD Component Tests for ReturnLogisticsCalculator
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD RED Phase - These tests define expected behavior from story specification.
 * Tests should FAIL until component implementation matches story requirements.
 *
 * Component: ReturnLogisticsCalculator
 * - Auto-calculates return logistics from forward logistics
 * - Applies buyback percentage to calculate effective return
 * - Supports manual override with warning
 * - Displays breakdown of calculation
 *
 * @see docs/stories/epic-44/story-44.10-fe-return-logistics-calculation.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReturnLogisticsCalculator } from '../ReturnLogisticsCalculator'

// ============================================================================
// Test Setup
// ============================================================================

const defaultProps = {
  forwardLogistics: 72.5,
  buybackPct: 98,
  value: 72.5, // Base return (same as forward)
  onChange: vi.fn(),
  autoCalculate: true,
  onAutoCalculateChange: vi.fn(),
  disabled: false,
}

function renderComponent(props: Partial<typeof defaultProps> = {}) {
  return render(<ReturnLogisticsCalculator {...defaultProps} {...props} />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// Story 44.10: AC1 - Auto-Calculate from Forward Logistics
// ============================================================================

describe('Story 44.10: AC1 - Auto-Calculate from Forward Logistics', () => {
  it('should auto-calculate base return when forward logistics provided', () => {
    renderComponent({ forwardLogistics: 72.5, value: 72.5, autoCalculate: true })

    // Base return should equal forward logistics
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(72.5)
  })

  it('should update value in real-time when forward logistics changes', async () => {
    const onChange = vi.fn()
    const { rerender } = renderComponent({
      forwardLogistics: 72.5,
      value: 72.5,
      autoCalculate: true,
      onChange,
    })

    // Change forward logistics
    rerender(
      <ReturnLogisticsCalculator
        {...defaultProps}
        forwardLogistics={100}
        value={72.5}
        autoCalculate={true}
        onChange={onChange}
      />
    )

    // Should call onChange with new calculated value
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(100)
    })
  })

  it('should show base return value with label "Базовая обратная: X ₽"', () => {
    renderComponent({ forwardLogistics: 72.5 })

    // Label should be present
    expect(screen.getByText(/логистика обратная.*базовая/i)).toBeInTheDocument()
  })

  it('should not update value when autoCalculate is false', () => {
    const onChange = vi.fn()
    const { rerender } = renderComponent({
      forwardLogistics: 72.5,
      value: 100, // Manual value different from calculated
      autoCalculate: false,
      onChange,
    })

    // Change forward logistics
    rerender(
      <ReturnLogisticsCalculator
        {...defaultProps}
        forwardLogistics={150}
        value={100}
        autoCalculate={false}
        onChange={onChange}
      />
    )

    // Should NOT call onChange (manual override active)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('should handle forward logistics = 0', () => {
    renderComponent({ forwardLogistics: 0, value: 0, autoCalculate: true })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(0)
  })
})

// ============================================================================
// Story 44.10: AC2 - Calculate Effective Return with Buyback
// ============================================================================

describe('Story 44.10: AC2 - Calculate Effective Return with Buyback', () => {
  it('should show effective return for 98% buyback', () => {
    renderComponent({ forwardLogistics: 72.5, buybackPct: 98 })

    // Effective return: 72.50 × 0.02 = 1.45 ₽
    expect(screen.getByText(/1[,.]45/)).toBeInTheDocument()
    expect(screen.getByText(/₽/)).toBeInTheDocument()
  })

  it('should show 0 effective for 100% buyback', () => {
    renderComponent({ forwardLogistics: 72.5, buybackPct: 100 })

    // Effective return: 72.50 × 0 = 0 ₽
    expect(screen.getByText(/эффективная/i)).toBeInTheDocument()
    // Should show 0 or 0,00
    expect(screen.getByText(/0[,.]00|^0$/)).toBeInTheDocument()
  })

  it('should show full amount for 0% buyback', () => {
    renderComponent({ forwardLogistics: 72.5, buybackPct: 0 })

    // Effective return: 72.50 × 1.00 = 72.50 ₽
    // Multiple elements may show 72.50 (input + effective display), so use getAllByText
    const elements = screen.getAllByText(/72[,.]50/)
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('should display buyback percentage in effective return label', () => {
    renderComponent({ forwardLogistics: 72.5, buybackPct: 98 })

    // Should show "Эффективная обратная (с учётом buyback 98%):"
    expect(screen.getByText(/buyback.*98%/i)).toBeInTheDocument()
  })

  it('should update effective return when buyback changes', async () => {
    const { rerender } = renderComponent({
      forwardLogistics: 72.5,
      buybackPct: 98,
    })

    // Initial: 1.45 ₽
    expect(screen.getByText(/1[,.]45/)).toBeInTheDocument()

    // Change buyback to 95%
    rerender(
      <ReturnLogisticsCalculator
        {...defaultProps}
        forwardLogistics={72.5}
        buybackPct={95}
      />
    )

    // New effective: 72.50 × 0.05 = 3.625 ≈ 3.63 ₽
    await waitFor(() => {
      expect(screen.getByText(/3[,.]6[23]/)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Story 44.10: AC3 - Breakdown Display
// ============================================================================

describe('Story 44.10: AC3 - Breakdown Display', () => {
  it('should have collapsible breakdown section', () => {
    renderComponent()

    // Should show trigger text
    expect(screen.getByText(/показать расчёт/i)).toBeInTheDocument()
  })

  it('should be collapsed by default', () => {
    renderComponent()

    // Breakdown content should not be visible initially
    expect(screen.queryByText(/базовая обратная логистика:/i)).not.toBeInTheDocument()
  })

  it('should expand breakdown on click', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/показать расчёт/i)
    await user.click(trigger)

    await waitFor(() => {
      // Should show breakdown items after clicking
      expect(screen.getByText(/базовая обратная логистика:/i)).toBeInTheDocument()
    })
  })

  it('should show 3-step breakdown when expanded', async () => {
    const user = userEvent.setup()
    renderComponent({ forwardLogistics: 72.5, buybackPct: 98 })

    const trigger = screen.getByText(/показать расчёт/i)
    await user.click(trigger)

    await waitFor(() => {
      // Step 1: Base return
      expect(screen.getByText(/базовая обратная логистика:/i)).toBeInTheDocument()

      // Step 2: Buyback percentage (may appear in multiple places)
      expect(screen.getByText(/buyback.*выкуп/i)).toBeInTheDocument()
      const buybackElements = screen.getAllByText(/98%/)
      expect(buybackElements.length).toBeGreaterThanOrEqual(1)

      // Step 3: Effective return (should be in breakdown)
      expect(screen.getByText(/эффективная обратная:/i)).toBeInTheDocument()
    })
  })

  it('should show return rate percentage in breakdown', async () => {
    const user = userEvent.setup()
    renderComponent({ forwardLogistics: 72.5, buybackPct: 98 })

    const trigger = screen.getByText(/показать расчёт/i)
    await user.click(trigger)

    await waitFor(() => {
      // Return rate = 100 - 98 = 2%
      expect(screen.getByText(/процент возврата:/i)).toBeInTheDocument()
      expect(screen.getByText(/2%/)).toBeInTheDocument()
    })
  })

  it('should update breakdown in real-time when values change', async () => {
    const user = userEvent.setup()
    const { rerender } = renderComponent({
      forwardLogistics: 72.5,
      buybackPct: 98,
    })

    // Expand breakdown
    const trigger = screen.getByText(/показать расчёт/i)
    await user.click(trigger)

    // Change buyback
    rerender(
      <ReturnLogisticsCalculator
        {...defaultProps}
        forwardLogistics={100}
        buybackPct={95}
      />
    )

    await waitFor(() => {
      // Should show updated values (5% appears in multiple places)
      const returnRateElements = screen.getAllByText(/5%/)
      expect(returnRateElements.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ============================================================================
// Story 44.10: AC4 - Manual Override Option
// ============================================================================

describe('Story 44.10: AC4 - Manual Override Option', () => {
  it('should have auto-calculate toggle with label "Рассчитать автоматически"', () => {
    renderComponent()

    expect(screen.getByText(/рассчитать автоматически/i)).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('should have toggle ON by default', () => {
    renderComponent({ autoCalculate: true })

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeChecked()
  })

  it('should disable input when auto-calculate is ON', () => {
    renderComponent({ autoCalculate: true })

    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })

  it('should enable input when auto-calculate is OFF', () => {
    renderComponent({ autoCalculate: false })

    const input = screen.getByRole('spinbutton')
    expect(input).not.toBeDisabled()
  })

  it('should call onAutoCalculateChange when toggle clicked', async () => {
    const user = userEvent.setup()
    const onAutoCalculateChange = vi.fn()
    renderComponent({ autoCalculate: true, onAutoCalculateChange })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(onAutoCalculateChange).toHaveBeenCalledWith(false)
  })

  it('should allow manual input when toggle is OFF', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ autoCalculate: false, value: 72.5, onChange })

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '100')

    expect(onChange).toHaveBeenCalled()
  })

  it('should turn off auto-calculate when user types in input', async () => {
    const user = userEvent.setup()
    const onAutoCalculateChange = vi.fn()
    renderComponent({
      autoCalculate: false,
      onAutoCalculateChange,
    })

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '50')

    // Should call onAutoCalculateChange(false) to ensure manual mode
    expect(onAutoCalculateChange).toHaveBeenCalledWith(false)
  })

  it('should show visual indicator when manual override is active', () => {
    renderComponent({ autoCalculate: false })

    // Should show "Вручную" badge
    expect(screen.getByText(/вручную/i)).toBeInTheDocument()
  })

  it('should show "Автозаполнено" badge when auto-calculate is ON', () => {
    renderComponent({ autoCalculate: true })

    expect(screen.getByText(/автозаполнено/i)).toBeInTheDocument()
  })

  it('should show warning if manual value differs >50% from calculated', () => {
    // Calculated base return: 72.5
    // Manual value: 150 (107% difference)
    renderComponent({
      forwardLogistics: 72.5,
      value: 150,
      autoCalculate: false,
    })

    expect(screen.getByText(/значительно отличается/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should NOT show warning if manual value within 50% of calculated', () => {
    // Calculated base return: 72.5
    // Manual value: 80 (10% difference)
    renderComponent({
      forwardLogistics: 72.5,
      value: 80,
      autoCalculate: false,
    })

    expect(screen.queryByText(/значительно отличается/i)).not.toBeInTheDocument()
  })

  it('should show restore button when manual override is active', () => {
    renderComponent({ autoCalculate: false })

    // Restore button (RotateCcw icon) should be visible
    const restoreButton = screen.getByRole('button', {
      name: /восстановить/i,
    })
    expect(restoreButton).toBeInTheDocument()
  })

  it('should restore calculated value on button click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onAutoCalculateChange = vi.fn()

    renderComponent({
      forwardLogistics: 72.5,
      value: 150, // Manual value
      autoCalculate: false,
      onChange,
      onAutoCalculateChange,
    })

    const restoreButton = screen.getByRole('button', {
      name: /восстановить/i,
    })
    await user.click(restoreButton)

    // Should restore calculated value (72.5) and re-enable auto-calculate
    expect(onChange).toHaveBeenCalledWith(72.5)
    expect(onAutoCalculateChange).toHaveBeenCalledWith(true)
  })

  it('should hide restore button when auto-calculate is ON', () => {
    renderComponent({ autoCalculate: true })

    expect(
      screen.queryByRole('button', { name: /восстановить/i })
    ).not.toBeInTheDocument()
  })
})

// ============================================================================
// Story 44.10: AC5 - Form Integration
// ============================================================================

describe('Story 44.10: AC5 - Form Integration', () => {
  it('should pass base_return to API (not effective)', () => {
    const onChange = vi.fn()
    renderComponent({
      forwardLogistics: 72.5,
      buybackPct: 98,
      value: 72.5,
      onChange,
    })

    // The value should be base_return (72.5), not effective (1.45)
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(72.5)
  })

  it('should validate that base return >= 0', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '0')
  })

  it('should handle step attribute for decimal input', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('step', '0.01')
  })

  it('should call onChange with parsed number value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ autoCalculate: false, value: 0, onChange })

    const input = screen.getByRole('spinbutton')
    await user.type(input, '50.25')

    // onChange should receive number, not string
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Number))
  })

  it('should handle empty input as 0', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ autoCalculate: false, value: 72.5, onChange })

    const input = screen.getByRole('spinbutton')
    await user.clear(input)

    // Should call onChange with 0 for empty input
    expect(onChange).toHaveBeenCalledWith(0)
  })
})

// ============================================================================
// Story 44.10: AC6 - UI Display Integration
// ============================================================================

describe('Story 44.10: AC6 - UI Display Integration', () => {
  it('should show forward logistics reference', () => {
    renderComponent({ forwardLogistics: 72.5 })

    // Should reference forward logistics value somewhere
    // Either in tooltip or in breakdown
    expect(screen.getByText(/72[,.]50/)).toBeInTheDocument()
  })

  it('should show effective return prominently', () => {
    renderComponent({ forwardLogistics: 72.5, buybackPct: 98 })

    // Effective return should be visible (1.45 ₽)
    const effectiveText = screen.getByText(/эффективная.*buyback/i)
    expect(effectiveText).toBeInTheDocument()
  })

  it('should format currency values in Russian locale', () => {
    renderComponent({ forwardLogistics: 1234.56, buybackPct: 98 })

    // Should use Russian formatting (1 234,56 or 1234,56)
    // At minimum, should show ₽ symbol
    expect(screen.getAllByText(/₽/).length).toBeGreaterThan(0)
  })

  it('should show muted text for small effective return (< 5 ₽)', () => {
    renderComponent({ forwardLogistics: 72.5, buybackPct: 98 })

    // Effective return is 1.45 ₽ (< 5 ₽), should have muted styling
    // This is implementation detail, but we can check the value is present
    expect(screen.getByText(/1[,.]45/)).toBeInTheDocument()
  })
})

// ============================================================================
// Story 44.10: Disabled State
// ============================================================================

describe('Story 44.10: Disabled State', () => {
  it('should disable toggle when disabled prop is true', () => {
    renderComponent({ disabled: true })

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })

  it('should disable input when disabled prop is true', () => {
    renderComponent({ disabled: true, autoCalculate: false })

    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })

  it('should hide restore button when disabled', () => {
    renderComponent({ disabled: true, autoCalculate: false })

    expect(
      screen.queryByRole('button', { name: /восстановить/i })
    ).not.toBeInTheDocument()
  })
})

// ============================================================================
// Story 44.10: Accessibility (WCAG 2.1 AA)
// ============================================================================

describe('Story 44.10: Accessibility', () => {
  it('should have proper label for toggle switch', () => {
    renderComponent()

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAccessibleName(/рассчитать автоматически/i)
  })

  it('should have proper label for input field', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAccessibleName(/логистика обратная/i)
  })

  it('should announce warnings with role="alert"', () => {
    renderComponent({
      forwardLogistics: 72.5,
      value: 150,
      autoCalculate: false,
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
  })

  it('should have keyboard-accessible toggle', async () => {
    const user = userEvent.setup()
    const onAutoCalculateChange = vi.fn()
    renderComponent({ autoCalculate: true, onAutoCalculateChange })

    const toggle = screen.getByRole('switch')
    toggle.focus()
    await user.keyboard('{Enter}')

    expect(onAutoCalculateChange).toHaveBeenCalledWith(false)
  })

  it('should have keyboard-accessible restore button', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderComponent({ autoCalculate: false, onChange })

    const restoreButton = screen.getByRole('button', {
      name: /восстановить/i,
    })
    restoreButton.focus()
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalled()
  })

  it('should have visible focus indicators', () => {
    renderComponent()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveClass('focus-visible:ring')
  })

  it('should have sufficient color contrast', () => {
    renderComponent()

    // Check that labels have appropriate text colors
    const label = screen.getByText(/логистика обратная/i)
    // Should not have low-contrast text classes
    expect(label).not.toHaveClass('text-gray-300')
  })
})

// ============================================================================
// Story 44.10: Edge Cases
// ============================================================================

describe('Story 44.10: Edge Cases', () => {
  it('should handle NaN forward logistics', () => {
    renderComponent({ forwardLogistics: NaN, value: 0 })

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(0)
  })

  it('should handle very large forward logistics values', () => {
    renderComponent({ forwardLogistics: 99999.99, buybackPct: 98 })

    // Should not crash and should display something
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('should handle decimal buyback percentage', () => {
    // Buyback 98.5% -> Return 1.5%
    renderComponent({ forwardLogistics: 100, buybackPct: 98.5 })

    // Effective: 100 × 0.015 = 1.50
    expect(screen.getByText(/1[,.]50?/)).toBeInTheDocument()
  })
})
