/**
 * Unit tests for DrrSlider component
 * Story 44.18-FE: DRR Input (Advertising Percentage)
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DrrSlider, getDrrLevel } from '../DrrSlider'

describe('DrrSlider', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render slider and input', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(screen.getByTestId('drr-slider')).toBeInTheDocument()
      expect(screen.getByTestId('drr-input')).toBeInTheDocument()
    })

    it('should render with Russian labels', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(
        screen.getByText('DRR (Доля рекламных расходов)')
      ).toBeInTheDocument()
    })

    it('should display current value in input', () => {
      render(<DrrSlider value={7.5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveValue(7.5)
    })

    it('should display percentage symbol', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(screen.getByText('%')).toBeInTheDocument()
    })
  })

  describe('Range Constraints', () => {
    it('should have 0-30% range on input', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '30')
    })

    it('should have 0.5% step on input', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveAttribute('step', '0.5')
    })
  })

  describe('Level Indicator', () => {
    it('should show "Низкий" for DRR <= 3%', () => {
      render(<DrrSlider value={2} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Низкий')
    })

    it('should show "Умеренный" for DRR 3-7%', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Умеренный')
    })

    it('should show "Высокий" for DRR 7-15%', () => {
      render(<DrrSlider value={10} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Высокий')
    })

    it('should show "Очень высокий" for DRR > 15%', () => {
      render(<DrrSlider value={20} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Очень высокий')
    })
  })

  describe('Advertising Cost Preview', () => {
    it('should display advertising cost when provided', () => {
      render(
        <DrrSlider
          value={5}
          onChange={mockOnChange}
          advertisingCost={60.87}
        />
      )

      expect(screen.getByTestId('advertising-cost-preview')).toBeInTheDocument()
      expect(screen.getByText('Расходы на рекламу:')).toBeInTheDocument()
    })

    it('should not display preview when cost is 0', () => {
      render(
        <DrrSlider value={0} onChange={mockOnChange} advertisingCost={0} />
      )

      expect(
        screen.queryByTestId('advertising-cost-preview')
      ).not.toBeInTheDocument()
    })

    it('should not display preview when cost is undefined', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(
        screen.queryByTestId('advertising-cost-preview')
      ).not.toBeInTheDocument()
    })
  })

  describe('Warning for Very High DRR', () => {
    it('should show warning when DRR > 15%', () => {
      render(<DrrSlider value={16} onChange={mockOnChange} />)

      expect(screen.getByTestId('drr-high-warning')).toBeInTheDocument()
      expect(
        screen.getByText('Очень высокий DRR может привести к убыточности')
      ).toBeInTheDocument()
    })

    it('should not show warning when DRR <= 15%', () => {
      render(<DrrSlider value={15} onChange={mockOnChange} />)

      expect(screen.queryByTestId('drr-high-warning')).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      await user.clear(input)
      await user.type(input, '10')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should not allow values above 30', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      await user.clear(input)
      await user.type(input, '35')

      // Should not call onChange with invalid value
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
      if (lastCall) {
        expect(lastCall[0]).toBeLessThanOrEqual(30)
      }
    })
  })

  describe('Error State', () => {
    it('should display error message when provided', () => {
      render(
        <DrrSlider
          value={5}
          onChange={mockOnChange}
          error="DRR слишком высокий"
        />
      )

      expect(screen.getByTestId('drr-error')).toBeInTheDocument()
      expect(screen.getByText('DRR слишком высокий')).toBeInTheDocument()
    })

    it('should not display error when not provided', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(screen.queryByTestId('drr-error')).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} disabled />)

      expect(screen.getByTestId('drr-input')).toBeDisabled()
    })
  })

  describe('Default Value', () => {
    it('should work with default 5% value', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveValue(5)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Умеренный')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on slider', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const slider = screen.getByTestId('drr-slider')
      expect(slider).toHaveAttribute('aria-label', 'DRR (Доля рекламных расходов)')
    })

    it('should have aria-valuenow on slider', () => {
      render(<DrrSlider value={10} onChange={mockOnChange} />)

      const slider = screen.getByTestId('drr-slider')
      expect(slider).toHaveAttribute('aria-valuenow', '10')
    })

    it('should have aria-valuetext with level', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const slider = screen.getByTestId('drr-slider')
      expect(slider).toHaveAttribute('aria-valuetext', '5% - Умеренный')
    })

    it('should have aria-label on input', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveAttribute('aria-label', 'DRR в процентах')
    })

    it('should have alert role on warning', () => {
      render(<DrrSlider value={20} onChange={mockOnChange} />)

      const warning = screen.getByTestId('drr-high-warning')
      expect(warning).toHaveAttribute('role', 'alert')
      expect(warning).toHaveAttribute('aria-live', 'polite')
    })

    it('should have linked label via htmlFor/id', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const label = screen.getByText('DRR (Доля рекламных расходов)')
      const input = screen.getByTestId('drr-input')

      expect(label).toHaveAttribute('for', 'drr_pct')
      expect(input).toHaveAttribute('id', 'drr_pct')
    })
  })
})

describe('getDrrLevel', () => {
  it('should return low level for DRR <= 3', () => {
    expect(getDrrLevel(0).level).toBe('low')
    expect(getDrrLevel(3).level).toBe('low')
    expect(getDrrLevel(3).label).toBe('Низкий')
  })

  it('should return moderate level for DRR 3-7', () => {
    expect(getDrrLevel(4).level).toBe('moderate')
    expect(getDrrLevel(7).level).toBe('moderate')
    expect(getDrrLevel(5).label).toBe('Умеренный')
  })

  it('should return high level for DRR 7-15', () => {
    expect(getDrrLevel(8).level).toBe('high')
    expect(getDrrLevel(15).level).toBe('high')
    expect(getDrrLevel(10).label).toBe('Высокий')
  })

  it('should return very-high level for DRR > 15', () => {
    expect(getDrrLevel(16).level).toBe('very-high')
    expect(getDrrLevel(30).level).toBe('very-high')
    expect(getDrrLevel(20).label).toBe('Очень высокий')
  })

  it('should return correct colors for each level', () => {
    expect(getDrrLevel(2).color).toContain('green')
    expect(getDrrLevel(5).color).toContain('yellow')
    expect(getDrrLevel(10).color).toContain('orange')
    expect(getDrrLevel(20).color).toContain('red')
  })
})

// ============================================================================
// TDD RED PHASE: Additional tests for Story 44.18-FE AC requirements
// These tests verify extended functionality per Acceptance Criteria
// ============================================================================

describe('DrrSlider - AC2: Tooltip Content', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render tooltip trigger button', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    // FieldTooltip renders a button with aria-label="Информация"
    const tooltipTrigger = screen.getByRole('button', { name: 'Информация' })
    expect(tooltipTrigger).toBeInTheDocument()
    expect(tooltipTrigger).toHaveAttribute('data-state', 'closed')
  })

  it('should display tooltip with DRR explanation on click', async () => {
    const user = userEvent.setup()
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    // FieldTooltip uses aria-label="Информация"
    const tooltipTrigger = screen.getByRole('button', { name: 'Информация' })
    await user.click(tooltipTrigger)

    // Tooltip should contain DRR explanation (per AC2)
    // Radix tooltip renders content in multiple places - use getAllBy
    const tooltipTexts = screen.getAllByText(/DRR — процент от цены на рекламу/)
    expect(tooltipTexts.length).toBeGreaterThan(0)
  })

  it('should mention how DRR affects margin in tooltip', async () => {
    const user = userEvent.setup()
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    // FieldTooltip uses aria-label="Информация"
    const tooltipTrigger = screen.getByRole('button', { name: 'Информация' })
    await user.click(tooltipTrigger)

    // AC2 requires tooltip to explain how DRR affects calculation
    // Radix tooltip renders content in multiple places - use getAllBy
    const marginTexts = screen.getAllByText(/влияет на финальную маржу/)
    expect(marginTexts.length).toBeGreaterThan(0)
  })
})

describe('DrrSlider - AC3: Visual Zone Colors', () => {
  const mockOnChange = vi.fn()

  it('should apply green background for low DRR (0-3%)', () => {
    render(<DrrSlider value={2} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveClass('bg-green-100')
    expect(badge).toHaveClass('text-green-600')
  })

  it('should apply yellow background for moderate DRR (3-7%)', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveClass('bg-yellow-100')
    expect(badge).toHaveClass('text-yellow-600')
  })

  it('should apply orange background for high DRR (7-15%)', () => {
    render(<DrrSlider value={10} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveClass('bg-orange-100')
    expect(badge).toHaveClass('text-orange-600')
  })

  it('should apply red background for very high DRR (>15%)', () => {
    render(<DrrSlider value={20} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-600')
  })
})

describe('DrrSlider - AC4: Advertising Cost Preview Formatting', () => {
  const mockOnChange = vi.fn()

  it('should format advertising cost in Russian rubles', () => {
    render(
      <DrrSlider value={5} onChange={mockOnChange} advertisingCost={1234.56} />
    )

    const preview = screen.getByTestId('advertising-cost-preview')
    // Should show formatted currency: "1 234,56 ₽"
    expect(preview).toHaveTextContent(/1[\s ]234,56/)
    expect(preview).toHaveTextContent('₽')
  })

  it('should update cost preview when advertisingCost prop changes', () => {
    const { rerender } = render(
      <DrrSlider value={5} onChange={mockOnChange} advertisingCost={100} />
    )

    expect(screen.getByTestId('advertising-cost-preview')).toHaveTextContent('100')

    rerender(
      <DrrSlider value={10} onChange={mockOnChange} advertisingCost={200} />
    )

    expect(screen.getByTestId('advertising-cost-preview')).toHaveTextContent('200')
  })
})

describe('DrrSlider - Boundary Value Tests', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle boundary value DRR = 0%', () => {
    render(<DrrSlider value={0} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    expect(input).toHaveValue(0)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Низкий')
  })

  it('should handle boundary value DRR = 3% (low/moderate threshold)', () => {
    render(<DrrSlider value={3} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Низкий') // 3% is still "low"
  })

  it('should handle boundary value DRR = 3.5% (just above low threshold)', () => {
    render(<DrrSlider value={3.5} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Умеренный') // 3.5% is "moderate"
  })

  it('should handle boundary value DRR = 7% (moderate/high threshold)', () => {
    render(<DrrSlider value={7} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Умеренный') // 7% is still "moderate"
  })

  it('should handle boundary value DRR = 15% (high/very-high threshold)', () => {
    render(<DrrSlider value={15} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Высокий') // 15% is still "high"

    // Warning should NOT show at exactly 15%
    expect(screen.queryByTestId('drr-high-warning')).not.toBeInTheDocument()
  })

  it('should handle boundary value DRR = 15.5% (just above high threshold)', () => {
    render(<DrrSlider value={15.5} onChange={mockOnChange} />)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Очень высокий')

    // Warning should show above 15%
    expect(screen.getByTestId('drr-high-warning')).toBeInTheDocument()
  })

  it('should handle maximum value DRR = 30%', () => {
    render(<DrrSlider value={30} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    expect(input).toHaveValue(30)

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Очень высокий')
  })
})

describe('DrrSlider - Keyboard Accessibility', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have focusable input element', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    // Input should be focusable (not have negative tabindex)
    expect(input).not.toHaveAttribute('tabindex', '-1')
  })

  it('should allow keyboard input in the field', async () => {
    const user = userEvent.setup()
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    await user.click(input)
    await user.clear(input)
    await user.type(input, '12')

    expect(mockOnChange).toHaveBeenCalled()
  })

  it('should have accessible min/max attributes for screen readers', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    const slider = screen.getByTestId('drr-slider')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '30')
  })

  it('should have slider with role="slider" for assistive technology', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    // Radix Slider thumb has role="slider"
    const sliderThumb = screen.getByRole('slider')
    expect(sliderThumb).toBeInTheDocument()
  })
})

describe('DrrSlider - Input Validation Edge Cases', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle empty input by setting value to 0', async () => {
    const user = userEvent.setup()
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    await user.clear(input)

    // Should call onChange with 0 for empty input
    expect(mockOnChange).toHaveBeenLastCalledWith(0)
  })

  it('should reject negative values', async () => {
    const user = userEvent.setup()
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    await user.clear(input)
    await user.type(input, '-5')

    // Should not call onChange with negative value
    const calls = mockOnChange.mock.calls
    const hasNegativeCall = calls.some(call => call[0] < 0)
    expect(hasNegativeCall).toBe(false)
  })

  it('should handle decimal values with 0.5 step precision', () => {
    // Test that the input accepts decimal step values
    // by verifying the step attribute is set correctly
    render(<DrrSlider value={7.5} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    // Input should have step="0.5" for decimal precision
    expect(input).toHaveAttribute('step', '0.5')
    // And should display the decimal value correctly
    expect(input).toHaveValue(7.5)
  })
})

describe('DrrSlider - Component Integration', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should keep slider and input in sync when value prop changes', () => {
    const { rerender } = render(
      <DrrSlider value={5} onChange={mockOnChange} />
    )

    const input = screen.getByTestId('drr-input')
    expect(input).toHaveValue(5)

    rerender(<DrrSlider value={10} onChange={mockOnChange} />)

    expect(input).toHaveValue(10)
  })

  it('should update level badge when value changes', () => {
    const { rerender } = render(
      <DrrSlider value={2} onChange={mockOnChange} />
    )

    const badge = screen.getByTestId('drr-level-badge')
    expect(badge).toHaveTextContent('Низкий')

    rerender(<DrrSlider value={20} onChange={mockOnChange} />)

    expect(badge).toHaveTextContent('Очень высокий')
  })

  it('should show/hide warning based on value threshold', () => {
    const { rerender } = render(
      <DrrSlider value={10} onChange={mockOnChange} />
    )

    expect(screen.queryByTestId('drr-high-warning')).not.toBeInTheDocument()

    rerender(<DrrSlider value={20} onChange={mockOnChange} />)

    expect(screen.getByTestId('drr-high-warning')).toBeInTheDocument()

    rerender(<DrrSlider value={5} onChange={mockOnChange} />)

    expect(screen.queryByTestId('drr-high-warning')).not.toBeInTheDocument()
  })
})

// ============================================================================
// TDD RED PHASE: Tests for UNIMPLEMENTED features
// These tests SHOULD FAIL until the corresponding functionality is added
// ============================================================================

describe('DrrSlider - TDD RED PHASE: Future Enhancements', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Extended range support (0-100% instead of 0-30%)
   * Story 44.18 edge case: Allow up to 100%, show strong warning above 15%
   */
  it('should allow values up to 100% with extended range prop', () => {
    render(
      <DrrSlider
        value={50}
        onChange={mockOnChange}
        maxValue={100}
      />
    )

    const input = screen.getByTestId('drr-input')
    expect(input).toHaveAttribute('max', '100')
    expect(input).toHaveValue(50)
  })

  /**
   * Configurable warning threshold
   */
  it('should use custom warning threshold when provided', () => {
    render(
      <DrrSlider
        value={12}
        onChange={mockOnChange}
        warningThreshold={10}
      />
    )

    // With threshold=10, value=12 should show warning
    expect(screen.getByTestId('drr-high-warning')).toBeInTheDocument()
  })

  /**
   * Negative margin error display
   * AC: "DRR causes negative margin → Show error"
   */
  it('should show negative margin error when DRR causes loss', () => {
    render(
      <DrrSlider
        value={25}
        onChange={mockOnChange}
        error="DRR слишком высокий для заданной маржи"
      />
    )

    // Should display specific error about margin impact
    expect(screen.getByText(/DRR слишком высокий для заданной маржи/)).toBeInTheDocument()
  })

  /**
   * Real-time advertising cost calculation
   * AC4: Update in real-time as DRR or price changes
   */
  it('should auto-calculate advertising cost from price', () => {
    render(
      <DrrSlider
        value={5}
        onChange={mockOnChange}
        recommendedPrice={4057.87}
        // advertisingCost should be calculated: 4057.87 * 0.05 = 202.89
      />
    )

    // Should show auto-calculated cost
    expect(screen.getByTestId('advertising-cost-preview')).toHaveTextContent(
      /202,89/
    )
  })

  /**
   * Mobile responsive layout
   * Story invariant: "Mobile viewport → Full-width slider, input below"
   */
  it('should render input below slider on mobile viewport', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    // Container should have responsive flex classes
    const container = screen
      .getByTestId('drr-slider-section')
      .querySelector('.flex.items-center.gap-4')
    expect(container).toHaveClass('flex-col', 'sm:flex-row')
  })

  /**
   * Slider visual zone colors
   * The slider track itself should show colored zones (like MarginSlider)
   */
  it('should display colored zone overlay on slider track', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    // Should have visual zone indicators on slider
    const sliderSection = screen.getByTestId('drr-slider-section')

    // Zone overlay should exist (green/yellow/orange/red gradient)
    expect(sliderSection.querySelector('.bg-green-100')).toBeInTheDocument()
    expect(sliderSection.querySelector('.bg-yellow-100')).toBeInTheDocument()
    expect(sliderSection.querySelector('.bg-orange-100')).toBeInTheDocument()
    expect(sliderSection.querySelector('.bg-red-100')).toBeInTheDocument()
  })
})

// ============================================================================
// TDD Tests that verify AC requirements are FULLY met
// These PASS when implementation is complete
// ============================================================================

describe('DrrSlider - Complete AC Verification', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC1: Complete input field requirements
  it('AC1: should have slider with min=0, max=30, step=0.5, default=5', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    const input = screen.getByTestId('drr-input')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '30')
    expect(input).toHaveAttribute('step', '0.5')
    expect(input).toHaveValue(5)
  })

  // AC2: Label and tooltip requirements
  it('AC2: should have correct Russian label', () => {
    render(<DrrSlider value={5} onChange={mockOnChange} />)

    expect(
      screen.getByText('DRR (Доля рекламных расходов)')
    ).toBeInTheDocument()
  })

  // AC3: Visual feedback with all 4 color levels
  it('AC3: should show all 4 DRR levels with correct colors', () => {
    const levels = [
      { value: 2, label: 'Низкий', bgClass: 'bg-green-100' },
      { value: 5, label: 'Умеренный', bgClass: 'bg-yellow-100' },
      { value: 10, label: 'Высокий', bgClass: 'bg-orange-100' },
      { value: 20, label: 'Очень высокий', bgClass: 'bg-red-100' },
    ]

    for (const { value, label, bgClass } of levels) {
      const { unmount } = render(
        <DrrSlider value={value} onChange={mockOnChange} />
      )

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent(label)
      expect(badge).toHaveClass(bgClass)

      unmount()
    }
  })

  // AC4: Advertising cost preview
  it('AC4: should display formatted advertising cost in rubles', () => {
    render(
      <DrrSlider
        value={5}
        onChange={mockOnChange}
        advertisingCost={202.89}
      />
    )

    const preview = screen.getByTestId('advertising-cost-preview')
    expect(preview).toHaveTextContent('Расходы на рекламу:')
    expect(preview).toHaveTextContent('₽')
  })

  // AC5: Form state integration - value controlled by parent
  it('AC5: should be a controlled component', () => {
    const { rerender } = render(
      <DrrSlider value={5} onChange={mockOnChange} />
    )

    expect(screen.getByTestId('drr-input')).toHaveValue(5)

    // Parent controls value
    rerender(<DrrSlider value={10} onChange={mockOnChange} />)
    expect(screen.getByTestId('drr-input')).toHaveValue(10)

    // Parent can reset to default
    rerender(<DrrSlider value={5} onChange={mockOnChange} />)
    expect(screen.getByTestId('drr-input')).toHaveValue(5)
  })
})
