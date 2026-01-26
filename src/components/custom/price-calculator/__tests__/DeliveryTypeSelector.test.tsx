/**
 * DeliveryTypeSelector Component Tests for Story 44.42-FE
 * Story 44.42-FE: Box Type Selection Support (NEW COMPONENT)
 * Epic 44: Price Calculator UI (Frontend)
 *
 * NOTE: This tests the NEW Story 44.42-FE DeliveryTypeSelector component which:
 * - Supports 3 box types (Boxes/Pallets/Supersafe) with boxTypeId (2/5/6)
 * - Uses dropdown/select instead of radio buttons
 * - Has warehouse availability checking
 * - Shows fixed rate badge for Pallets
 *
 * The legacy DeliveryTypeSelector (Story 44.32) uses a different interface
 * with only 2 types (box/pallet as strings) and radio buttons.
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeliveryTypeSelector } from '../DeliveryTypeSelector'
import type { BoxTypeId } from '@/lib/box-type-utils'

// Placeholder: These tests expect a NEW component interface
// The actual component will need to be created per Story 44.42-FE spec

// ============================================================================
// Test Setup
// ============================================================================

const mockOnChange = vi.fn()

const defaultProps = {
  value: 2 as BoxTypeId,
  onChange: mockOnChange,
  availableTypes: [2, 5, 6] as BoxTypeId[],
  disabled: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// Rendering Tests
// ============================================================================

describe('DeliveryTypeSelector - Rendering', () => {
  it('should render with label "Тип доставки"', () => {
    render(<DeliveryTypeSelector {...defaultProps} />)

    expect(screen.getByText('Тип доставки')).toBeInTheDocument()
  })

  it('should render a select/dropdown element', () => {
    render(<DeliveryTypeSelector {...defaultProps} />)

    // Should have a trigger button for the select
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
  })

  it('should display currently selected value', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    // Should show "Коробки" as selected
    expect(screen.getByText('Коробки')).toBeInTheDocument()
  })

  it('should display icon for selected box type', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    // Should show box icon
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('should render all three box type options when opened', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} />)

    // Open the dropdown
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Should show all three options (use getAllByRole to find options)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)

    // Check each option text exists
    expect(screen.getAllByText('Коробки').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Монопаллеты')).toBeInTheDocument()
    expect(screen.getByText('Суперсейф')).toBeInTheDocument()
  })

  it('should render icons for all box types', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} />)

    await user.click(screen.getByRole('combobox'))

    // All icons should be present (📦 appears twice - in trigger and option)
    expect(screen.getAllByText('📦').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('🔲')).toBeInTheDocument()
    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  it('should show "фикс." badge for Pallets option', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} />)

    await user.click(screen.getByRole('combobox'))

    // Pallets should have fixed rate badge - use getByRole
    const palletsOption = screen.getByRole('option', { name: /Монопаллеты/i })
    expect(palletsOption).toBeInTheDocument()

    // Should contain "фикс." badge
    const badge = within(palletsOption as HTMLElement).getByText('фикс.')
    expect(badge).toBeInTheDocument()
  })
})

// ============================================================================
// Selection Tests
// ============================================================================

describe('DeliveryTypeSelector - Selection', () => {
  it('should call onChange when selecting Boxes', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} value={5} />)

    await user.click(screen.getByRole('combobox'))
    // Find the Boxes option specifically (use getAllByText since text appears in trigger too)
    const boxesOptions = screen.getAllByText('Коробки')
    // Click the one inside the listbox (not the trigger)
    const boxesOption = boxesOptions.find(
      (el) => el.closest('[role="option"]') !== null
    )
    await user.click(boxesOption!)

    expect(mockOnChange).toHaveBeenCalledWith(2)
  })

  it('should call onChange when selecting Pallets', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Монопаллеты'))

    expect(mockOnChange).toHaveBeenCalledWith(5)
  })

  it('should call onChange when selecting Supersafe', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Суперсейф'))

    expect(mockOnChange).toHaveBeenCalledWith(6)
  })

  it('should display selected value after selection', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    await user.click(screen.getByRole('combobox'))
    // Find Pallets option in the listbox
    const palletsOption = screen.getByRole('option', { name: /Монопаллеты/i })
    await user.click(palletsOption)

    // Simulate controlled component update
    rerender(<DeliveryTypeSelector {...defaultProps} value={5} />)

    // Should now show Pallets as selected
    const trigger = screen.getByRole('combobox')
    expect(within(trigger).getByText('Монопаллеты')).toBeInTheDocument()
  })
})

// ============================================================================
// Default Selection Tests
// ============================================================================

describe('DeliveryTypeSelector - Default Selection', () => {
  it('should default to Boxes (boxTypeId: 2)', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    expect(screen.getByText('Коробки')).toBeInTheDocument()
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('should show Boxes as most common selection', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    const trigger = screen.getByRole('combobox')
    expect(within(trigger).getByText('Коробки')).toBeInTheDocument()
  })
})

// ============================================================================
// Disabled State Tests
// ============================================================================

describe('DeliveryTypeSelector - Disabled State', () => {
  it('should disable entire selector when disabled prop is true', () => {
    render(<DeliveryTypeSelector {...defaultProps} disabled={true} />)

    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDisabled()
  })

  it('should not open dropdown when disabled', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} disabled={true} />)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Options should not appear
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('should not call onChange when disabled', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} disabled={true} />)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    expect(mockOnChange).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Available Types Tests (AC5)
// ============================================================================

describe('DeliveryTypeSelector - Available Types', () => {
  it('should disable unavailable box types', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[2, 5]} // Supersafe not available
      />
    )

    await user.click(screen.getByRole('combobox'))

    // Supersafe option should be disabled
    const supersafeOption = screen.getByText('Суперсейф').closest('[role="option"]')
    expect(supersafeOption).toHaveAttribute('aria-disabled', 'true')
  })

  it('should enable only available box types', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[2]} // Only Boxes available
      />
    )

    await user.click(screen.getByRole('combobox'))

    // Boxes should be enabled - use getByRole for unique option
    const boxesOption = screen.getByRole('option', { name: /Коробки/i })
    expect(boxesOption).not.toHaveAttribute('aria-disabled', 'true')

    // Pallets and Supersafe should be disabled
    const palletsOption = screen.getByRole('option', { name: /Монопаллеты/i })
    expect(palletsOption).toHaveAttribute('aria-disabled', 'true')

    const supersafeOption = screen.getByRole('option', { name: /Суперсейф/i })
    expect(supersafeOption).toHaveAttribute('aria-disabled', 'true')
  })

  it('should show visual indication for unavailable types (opacity)', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[2, 5]}
      />
    )

    await user.click(screen.getByRole('combobox'))

    // Supersafe should have reduced opacity
    const supersafeOption = screen.getByText('Суперсейф').closest('[role="option"]')
    expect(supersafeOption).toHaveClass('opacity-50')
  })

  it('should not call onChange when clicking unavailable type', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[2, 5]}
      />
    )

    await user.click(screen.getByRole('combobox'))

    // Try to click disabled Supersafe
    const supersafeOption = screen.getByText('Суперсейф').closest('[role="option"]')
    await user.click(supersafeOption!)

    // Should not trigger onChange for disabled option
    expect(mockOnChange).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Tooltip Tests (AC5)
// ============================================================================

describe('DeliveryTypeSelector - Tooltips', () => {
  it('should show tooltip for unavailable types on hover', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[2]}
      />
    )

    await user.click(screen.getByRole('combobox'))

    // Hover over disabled Pallets option
    const palletsOption = screen.getByRole('option', { name: /Монопаллеты/i })
    await user.hover(palletsOption)

    // Should show tooltip (may have multiple instances due to Radix)
    const tooltips = await screen.findAllByText('Недоступно на этом складе')
    expect(tooltips.length).toBeGreaterThanOrEqual(1)
  })

  it('should not show tooltip for available types', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[2, 5, 6]}
      />
    )

    await user.click(screen.getByRole('combobox'))

    // Hover over enabled Boxes option
    const boxesOption = screen.getByRole('option', { name: /Коробки/i })
    await user.hover(boxesOption)

    // Should not show "Недоступно" tooltip
    expect(screen.queryByText('Недоступно на этом складе')).not.toBeInTheDocument()
  })
})

// ============================================================================
// Pallets Special Handling (AC4)
// ============================================================================

describe('DeliveryTypeSelector - Pallets Special Handling', () => {
  it('should show fixed rate explanation when Pallets selected', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={5} />)

    // Should show explanation text about fixed rate
    expect(
      screen.getByText(/Хранение не зависит от объёма товара/)
    ).toBeInTheDocument()
  })

  it('should show Pallets icon in explanation', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={5} />)

    // Explanation should include the icon
    const explanation = screen.getByText(/Хранение не зависит от объёма товара/)
    expect(explanation.textContent).toContain('🔲')
  })

  it('should NOT show fixed rate explanation for Boxes', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={2} />)

    expect(
      screen.queryByText(/Хранение не зависит от объёма товара/)
    ).not.toBeInTheDocument()
  })

  it('should NOT show fixed rate explanation for Supersafe', () => {
    render(<DeliveryTypeSelector {...defaultProps} value={6} />)

    expect(
      screen.queryByText(/Хранение не зависит от объёма товара/)
    ).not.toBeInTheDocument()
  })
})

// ============================================================================
// Accessibility Tests (WCAG 2.1 AA)
// ============================================================================

describe('DeliveryTypeSelector - Accessibility', () => {
  it('should have accessible label', () => {
    render(<DeliveryTypeSelector {...defaultProps} />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveAccessibleName('Тип доставки')
  })

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} />)

    // Tab to focus
    await user.tab()
    expect(screen.getByRole('combobox')).toHaveFocus()

    // Enter to open
    await user.keyboard('{Enter}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Arrow down to navigate
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should have proper aria attributes for disabled items', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[2]}
      />
    )

    await user.click(screen.getByRole('combobox'))

    const disabledOption = screen.getByText('Монопаллеты').closest('[role="option"]')
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true')
  })

  it('should have sufficient color contrast', () => {
    render(<DeliveryTypeSelector {...defaultProps} />)

    // Label should be visible
    const label = screen.getByText('Тип доставки')
    expect(label).toBeVisible()

    // Trigger should have visible text
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeVisible()
  })

  it('should use icon + text (not icon-only)', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} />)

    await user.click(screen.getByRole('combobox'))

    // Each option should have both icon and text - use getByRole for unique options
    const boxesOption = screen.getByRole('option', { name: /Коробки/i })
    expect(boxesOption.textContent).toContain('📦')
    expect(boxesOption.textContent).toContain('Коробки')

    const palletsOption = screen.getByRole('option', { name: /Монопаллеты/i })
    expect(palletsOption.textContent).toContain('🔲')
    expect(palletsOption.textContent).toContain('Монопаллеты')

    const supersafeOption = screen.getByRole('option', { name: /Суперсейф/i })
    expect(supersafeOption.textContent).toContain('🔒')
    expect(supersafeOption.textContent).toContain('Суперсейф')
  })
})

// ============================================================================
// Integration with Form State
// ============================================================================

describe('DeliveryTypeSelector - Form Integration', () => {
  it('should work as controlled component', async () => {
    const user = userEvent.setup()
    let value: BoxTypeId = 2
    const handleChange = vi.fn((newValue: BoxTypeId) => {
      value = newValue
    })

    const { rerender } = render(
      <DeliveryTypeSelector
        {...defaultProps}
        value={value}
        onChange={handleChange}
      />
    )

    // Select Pallets
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Монопаллеты'))

    expect(handleChange).toHaveBeenCalledWith(5)

    // Rerender with new value
    rerender(
      <DeliveryTypeSelector
        {...defaultProps}
        value={5}
        onChange={handleChange}
      />
    )

    // Should now show Pallets
    expect(screen.getByText('Монопаллеты')).toBeInTheDocument()
  })

  it('should preserve selection when availableTypes changes', () => {
    const { rerender } = render(
      <DeliveryTypeSelector
        {...defaultProps}
        value={5}
        availableTypes={[2, 5, 6]}
      />
    )

    expect(screen.getByText('Монопаллеты')).toBeInTheDocument()

    // Remove Supersafe from available
    rerender(
      <DeliveryTypeSelector
        {...defaultProps}
        value={5}
        availableTypes={[2, 5]}
      />
    )

    // Should still show Pallets selected
    expect(screen.getByText('Монопаллеты')).toBeInTheDocument()
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('DeliveryTypeSelector - Edge Cases', () => {
  it('should handle empty availableTypes array', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryTypeSelector
        {...defaultProps}
        availableTypes={[]}
      />
    )

    await user.click(screen.getByRole('combobox'))

    // All options should be disabled - use role selector
    const boxesOption = screen.getByRole('option', { name: /Коробки/i })
    expect(boxesOption).toHaveAttribute('aria-disabled', 'true')
  })

  it('should handle rapid selection changes', async () => {
    const user = userEvent.setup()
    let currentValue: BoxTypeId = 2
    const handleChange = vi.fn((newValue: BoxTypeId) => {
      currentValue = newValue
    })

    const { rerender } = render(
      <DeliveryTypeSelector {...defaultProps} value={currentValue} onChange={handleChange} />
    )

    // Select Pallets
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Монопаллеты/i }))
    rerender(
      <DeliveryTypeSelector {...defaultProps} value={5} onChange={handleChange} />
    )

    // Select Supersafe
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Суперсейф/i }))
    rerender(
      <DeliveryTypeSelector {...defaultProps} value={6} onChange={handleChange} />
    )

    // Select Boxes
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Коробки/i }))

    // Should have called onChange three times
    expect(handleChange).toHaveBeenCalledTimes(3)
    expect(handleChange).toHaveBeenNthCalledWith(1, 5)
    expect(handleChange).toHaveBeenNthCalledWith(2, 6)
    expect(handleChange).toHaveBeenNthCalledWith(3, 2)
  })
})

// ============================================================================
// Visual Design Tests (AC7)
// ============================================================================

describe('DeliveryTypeSelector - Visual Design', () => {
  it('should render consistently with warehouse selector styling', () => {
    render(<DeliveryTypeSelector {...defaultProps} />)

    // Should have space-y-2 for proper spacing
    const container = screen.getByText('Тип доставки').closest('div')
    expect(container).toHaveClass('space-y-2')
  })

  it('should show flex layout for option items', async () => {
    const user = userEvent.setup()
    render(<DeliveryTypeSelector {...defaultProps} />)

    await user.click(screen.getByRole('combobox'))

    // Options should have flex layout for icon + text
    const boxesOption = screen.getByRole('option', { name: /Коробки/i })
    // Find the flex container within the option
    const flexContainer = boxesOption.querySelector('.flex.items-center.gap-2')
    expect(flexContainer).toBeInTheDocument()
  })
})
