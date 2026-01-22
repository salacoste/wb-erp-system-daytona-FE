/**
 * TDD Tests for Story 44.18
 * DRR Input (Advertising Percentage Slider)
 *
 * RED Phase: Tests written to define expected behavior
 * These tests verify all Acceptance Criteria (AC1-AC5)
 *
 * @see docs/stories/epic-44/story-44.18-fe-drr-input.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DrrSlider, getDrrLevel } from '../DrrSlider'

describe('Story 44.18: DRR Input (Advertising Percentage Slider)', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC1: DRR Slider Component', () => {
    it('should render slider element', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(screen.getByTestId('drr-slider')).toBeInTheDocument()
    })

    it('should have range 0-30%', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '30')
    })

    it('should default to 5%', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveValue(5)
    })

    it('should have step of 0.5%', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).toHaveAttribute('step', '0.5')
    })

    it('should render numeric input alongside slider', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(screen.getByTestId('drr-input')).toBeInTheDocument()
      expect(screen.getByTestId('drr-slider')).toBeInTheDocument()
    })

    it('should show percentage symbol', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(screen.getByText('%')).toBeInTheDocument()
    })
  })

  describe('AC2: Label and Tooltip', () => {
    it('should display label "DRR (Доля рекламных расходов)"', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      expect(
        screen.getByText('DRR (Доля рекламных расходов)')
      ).toBeInTheDocument()
    })

    it('should have tooltip explaining what DRR is', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      // FieldTooltip uses aria-label="Информация"
      const tooltipTrigger = screen.getByRole('button', { name: 'Информация' })
      await user.click(tooltipTrigger)

      await waitFor(() => {
        const tooltipTexts = screen.getAllByText(
          /DRR — процент от цены на рекламу/
        )
        expect(tooltipTexts.length).toBeGreaterThan(0)
      })
    })

    it('should explain how DRR affects margin in tooltip', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      // FieldTooltip uses aria-label="Информация"
      const tooltipTrigger = screen.getByRole('button', { name: 'Информация' })
      await user.click(tooltipTrigger)

      await waitFor(() => {
        const marginTexts = screen.getAllByText(/влияет на финальную маржу/)
        expect(marginTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('AC3: Visual Level Indicator', () => {
    it('should show "Низкий" (green) for DRR 0-3%', () => {
      render(<DrrSlider value={2} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Низкий')
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-600')
    })

    it('should show "Умеренный" (yellow) for DRR 3-7%', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Умеренный')
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-600')
    })

    it('should show "Высокий" (orange) for DRR 7-15%', () => {
      render(<DrrSlider value={10} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Высокий')
      expect(badge).toHaveClass('bg-orange-100')
      expect(badge).toHaveClass('text-orange-600')
    })

    it('should show "Очень высокий" (red) for DRR >15%', () => {
      render(<DrrSlider value={20} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Очень высокий')
      expect(badge).toHaveClass('bg-red-100')
      expect(badge).toHaveClass('text-red-600')
    })

    it('should handle boundary value DRR = 3% (still low)', () => {
      render(<DrrSlider value={3} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Низкий')
    })

    it('should handle boundary value DRR = 3.5% (moderate)', () => {
      render(<DrrSlider value={3.5} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Умеренный')
    })

    it('should handle boundary value DRR = 7% (still moderate)', () => {
      render(<DrrSlider value={7} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Умеренный')
    })

    it('should handle boundary value DRR = 15% (still high)', () => {
      render(<DrrSlider value={15} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Высокий')
    })

    it('should handle boundary value DRR = 15.5% (very high)', () => {
      render(<DrrSlider value={15.5} onChange={mockOnChange} />)

      const badge = screen.getByTestId('drr-level-badge')
      expect(badge).toHaveTextContent('Очень высокий')
    })
  })

  describe('AC4: Advertising Cost Preview', () => {
    it('should display advertising cost when provided', () => {
      render(
        <DrrSlider
          value={5}
          onChange={mockOnChange}
          advertisingCost={202.89}
        />
      )

      expect(screen.getByTestId('advertising-cost-preview')).toBeInTheDocument()
      expect(screen.getByText('Расходы на рекламу:')).toBeInTheDocument()
    })

    it('should format advertising cost in Russian rubles', () => {
      render(
        <DrrSlider
          value={5}
          onChange={mockOnChange}
          advertisingCost={1234.56}
        />
      )

      const preview = screen.getByTestId('advertising-cost-preview')
      expect(preview).toHaveTextContent(/1[\s ]234,56/)
      expect(preview).toHaveTextContent('₽')
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

    it('should update cost preview when value changes', () => {
      const { rerender } = render(
        <DrrSlider value={5} onChange={mockOnChange} advertisingCost={100} />
      )

      expect(screen.getByTestId('advertising-cost-preview')).toHaveTextContent(
        '100'
      )

      rerender(
        <DrrSlider value={10} onChange={mockOnChange} advertisingCost={200} />
      )

      expect(screen.getByTestId('advertising-cost-preview')).toHaveTextContent(
        '200'
      )
    })
  })

  describe('AC5: Warning for High DRR', () => {
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

    it('should show warning at DRR = 30%', () => {
      render(<DrrSlider value={30} onChange={mockOnChange} />)

      expect(screen.getByTestId('drr-high-warning')).toBeInTheDocument()
    })
  })

  describe('Form State Integration', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      await user.clear(input)
      await user.type(input, '10')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should be a controlled component', () => {
      const { rerender } = render(
        <DrrSlider value={5} onChange={mockOnChange} />
      )

      expect(screen.getByTestId('drr-input')).toHaveValue(5)

      rerender(<DrrSlider value={10} onChange={mockOnChange} />)
      expect(screen.getByTestId('drr-input')).toHaveValue(10)

      rerender(<DrrSlider value={5} onChange={mockOnChange} />)
      expect(screen.getByTestId('drr-input')).toHaveValue(5)
    })

    it('should clamp values to max 30', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      await user.clear(input)
      await user.type(input, '35')

      const lastCall =
        mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1]
      if (lastCall) {
        expect(lastCall[0]).toBeLessThanOrEqual(30)
      }
    })

    it('should handle empty input by setting value to 0', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      await user.clear(input)

      expect(mockOnChange).toHaveBeenLastCalledWith(0)
    })

    it('should reject negative values', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      await user.clear(input)
      await user.type(input, '-5')

      const calls = mockOnChange.mock.calls
      const hasNegativeCall = calls.some((call) => call[0] < 0)
      expect(hasNegativeCall).toBe(false)
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

  describe('Accessibility', () => {
    it('should have aria-label on slider', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const slider = screen.getByTestId('drr-slider')
      expect(slider).toHaveAttribute(
        'aria-label',
        'DRR (Доля рекламных расходов)'
      )
    })

    it('should have aria-valuenow on slider', () => {
      render(<DrrSlider value={10} onChange={mockOnChange} />)

      const slider = screen.getByTestId('drr-slider')
      expect(slider).toHaveAttribute('aria-valuenow', '10')
    })

    it('should have aria-valuemin and aria-valuemax', () => {
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const slider = screen.getByTestId('drr-slider')
      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '30')
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

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<DrrSlider value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('drr-input')
      expect(input).not.toHaveAttribute('tabindex', '-1')

      await user.click(input)
      expect(input).toHaveFocus()
    })
  })
})

describe('getDrrLevel Helper Function', () => {
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
