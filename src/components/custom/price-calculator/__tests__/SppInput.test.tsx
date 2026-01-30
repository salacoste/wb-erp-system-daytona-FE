/**
 * Unit tests for SppInput component
 * Story 44.19-FE: SPP Display (Customer Price)
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SppInput } from '../SppInput'

describe('SppInput', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render slider and input', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      expect(screen.getByTestId('spp-slider')).toBeInTheDocument()
      expect(screen.getByTestId('spp-input')).toBeInTheDocument()
    })

    it('should render with Russian labels', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      expect(screen.getByText('СПП (Скидка постоянного покупателя)')).toBeInTheDocument()
    })

    it('should display current value in input', () => {
      render(<SppInput value={10} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      expect(input).toHaveValue(10)
    })

    it('should display percentage symbol', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      expect(screen.getByText('%')).toBeInTheDocument()
    })
  })

  describe('Range Constraints', () => {
    it('should have 0-50% range on input', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '50')
    })

    it('should have 1% step on input', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      expect(input).toHaveAttribute('step', '1')
    })
  })

  describe('Help Text', () => {
    it('should show help text when SPP > 0', () => {
      render(<SppInput value={10} onChange={mockOnChange} />)

      expect(screen.getByTestId('spp-help-text')).toBeInTheDocument()
      expect(screen.getByText('Покупатель увидит цену со скидкой 10%')).toBeInTheDocument()
    })

    it('should not show help text when SPP = 0', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      expect(screen.queryByTestId('spp-help-text')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label on slider and input', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      // Both slider and input have the same aria-label
      const elements = screen.getAllByLabelText('СПП процент')
      expect(elements.length).toBe(2)
    })
  })

  describe('Interactions', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup()
      render(<SppInput value={0} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      await user.clear(input)
      await user.type(input, '15')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should not allow values above 30', async () => {
      const user = userEvent.setup()
      render(<SppInput value={0} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      await user.clear(input)
      await user.type(input, '35')

      // Should not call onChange with values > 30
      const calls = mockOnChange.mock.calls
      const validCalls = calls.filter(call => call[0] <= 30)
      expect(validCalls.length).toBe(calls.length)
    })

    it('should not allow negative values', async () => {
      const user = userEvent.setup()
      render(<SppInput value={5} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      await user.clear(input)
      await user.type(input, '-5')

      // Should not call onChange with negative values
      const calls = mockOnChange.mock.calls
      const validCalls = calls.filter(call => call[0] >= 0)
      expect(validCalls.length).toBe(calls.length)
    })
  })

  describe('Error State', () => {
    it('should display error message when provided', () => {
      render(<SppInput value={0} onChange={mockOnChange} error="СПП не может превышать 30%" />)

      expect(screen.getByTestId('spp-error')).toBeInTheDocument()
      expect(screen.getByText('СПП не может превышать 30%')).toBeInTheDocument()
    })

    it('should not display error when not provided', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      expect(screen.queryByTestId('spp-error')).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<SppInput value={0} onChange={mockOnChange} disabled />)

      expect(screen.getByTestId('spp-input')).toBeDisabled()
    })
  })

  describe('Default Value', () => {
    it('should work with default 0% value (no SPP)', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      expect(input).toHaveValue(0)

      // No help text when SPP = 0
      expect(screen.queryByTestId('spp-help-text')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label for input', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      const input = screen.getByTestId('spp-input')
      expect(input).toHaveAttribute('aria-label', 'СПП процент')
    })

    it('should have accessible label for slider', () => {
      render(<SppInput value={0} onChange={mockOnChange} />)

      const slider = screen.getByTestId('spp-slider')
      expect(slider).toHaveAttribute('aria-label', 'СПП процент')
    })
  })
})
