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
