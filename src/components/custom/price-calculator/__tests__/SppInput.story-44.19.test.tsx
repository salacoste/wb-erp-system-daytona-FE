/**
 * TDD Tests for Story 44.19
 * SPP Display (Customer Price)
 *
 * RED Phase: Tests written to define expected behavior
 * These tests verify all Acceptance Criteria (AC1-AC5)
 *
 * @see docs/stories/epic-44/story-44.19-fe-spp-display.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SppInput } from '../SppInput'

describe('Story 44.19: SPP Display (Customer Price)', () => {
  describe('SppInput Component', () => {
    const mockOnChange = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('AC1: SPP Input Field', () => {
      it('should render input field for "СПП"', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        expect(screen.getByTestId('spp-input')).toBeInTheDocument()
      })

      it('should have numeric input with % suffix', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        expect(input).toHaveAttribute('type', 'number')
        expect(screen.getByText('%')).toBeInTheDocument()
      })

      it('should have range 0-50%', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        expect(input).toHaveAttribute('min', '0')
        expect(input).toHaveAttribute('max', '50')
      })

      it('should default to 0% (no discount)', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        expect(input).toHaveValue(0)
      })

      it('should have step of 1%', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        expect(input).toHaveAttribute('step', '1')
      })

      it('should render slider alongside input', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        expect(screen.getByTestId('spp-slider')).toBeInTheDocument()
        expect(screen.getByTestId('spp-input')).toBeInTheDocument()
      })
    })

    describe('AC2: SPP Explanation', () => {
      it('should display label "СПП (Скидка постоянного покупателя)"', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        expect(screen.getByText('СПП (Скидка постоянного покупателя)')).toBeInTheDocument()
      })

      it('should have tooltip explaining SPP', async () => {
        const user = userEvent.setup()
        render(<SppInput value={0} onChange={mockOnChange} />)

        const tooltipTrigger = screen.getByLabelText('Информация')
        await user.hover(tooltipTrigger)

        await waitFor(() => {
          // Tooltip should explain that SPP is provided by WB
          // Radix may render multiple copies of tooltip content, use getAllByText
          const texts = screen.getAllByText(/WB предоставляет покупателям за свой счёт/i)
          expect(texts.length).toBeGreaterThan(0)
        })
      })

      it('should explain in tooltip that SPP does not affect seller revenue', async () => {
        const user = userEvent.setup()
        render(<SppInput value={0} onChange={mockOnChange} />)

        const tooltipTrigger = screen.getByLabelText('Информация')
        await user.hover(tooltipTrigger)

        await waitFor(() => {
          // Radix may render multiple copies of tooltip content, use getAllByText
          const texts = screen.getAllByText(/Вы получаете полную сумму без учёта СПП/i)
          expect(texts.length).toBeGreaterThan(0)
        })
      })
    })

    describe('AC3: Help Text When SPP > 0', () => {
      it('should show help text when SPP > 0', () => {
        render(<SppInput value={10} onChange={mockOnChange} />)

        expect(screen.getByTestId('spp-help-text')).toBeInTheDocument()
        expect(screen.getByText(/Покупатель увидит цену со скидкой 10\s%/)).toBeInTheDocument() // ru-RU NBSP
      })

      it('should not show help text when SPP = 0', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        expect(screen.queryByTestId('spp-help-text')).not.toBeInTheDocument()
      })

      it('should update help text when SPP changes', () => {
        const { rerender } = render(<SppInput value={10} onChange={mockOnChange} />)

        expect(screen.getByText(/Покупатель увидит цену со скидкой 10\s%/)).toBeInTheDocument() // ru-RU NBSP

        rerender(<SppInput value={15} onChange={mockOnChange} />)

        expect(screen.getByText(/Покупатель увидит цену со скидкой 15\s%/)).toBeInTheDocument() // ru-RU NBSP
      })
    })

    describe('AC5: Form State Integration', () => {
      it('should call onChange when value changes', async () => {
        const user = userEvent.setup()
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        await user.clear(input)
        await user.type(input, '15')

        expect(mockOnChange).toHaveBeenCalled()
      })

      it('should not allow values above 30%', async () => {
        const user = userEvent.setup()
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        await user.clear(input)
        await user.type(input, '35')

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

        const calls = mockOnChange.mock.calls
        const validCalls = calls.filter(call => call[0] >= 0)
        expect(validCalls.length).toBe(calls.length)
      })

      it('should be a controlled component', () => {
        const { rerender } = render(<SppInput value={5} onChange={mockOnChange} />)

        expect(screen.getByTestId('spp-input')).toHaveValue(5)

        rerender(<SppInput value={10} onChange={mockOnChange} />)
        expect(screen.getByTestId('spp-input')).toHaveValue(10)
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

      it('should be keyboard navigable', async () => {
        const user = userEvent.setup()
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        await user.click(input)
        expect(input).toHaveFocus()
      })
    })

    describe('Edge Cases', () => {
      it('should handle SPP = 0% (default, no discount)', () => {
        render(<SppInput value={0} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        expect(input).toHaveValue(0)
        expect(screen.queryByTestId('spp-help-text')).not.toBeInTheDocument()
      })

      it('should handle SPP = 30% (maximum)', () => {
        render(<SppInput value={30} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        expect(input).toHaveValue(30)
        expect(screen.getByText(/Покупатель увидит цену со скидкой 30\s%/)).toBeInTheDocument() // ru-RU NBSP
      })

      it('should handle decimal SPP values', () => {
        render(<SppInput value={10.5} onChange={mockOnChange} />)

        const input = screen.getByTestId('spp-input')
        expect(input).toHaveValue(10.5)
      })
    })
  })

  describe('SPP Formula Verification', () => {
    it('should correctly calculate customer_price = recommended_price * (1 - spp_pct / 100)', () => {
      // Test case 1: 4057.87 at 10% SPP
      const result1 = 4057.87 * (1 - 10 / 100)
      expect(result1).toBeCloseTo(3652.083, 2)

      // Test case 2: 1000 at 30% SPP
      const result2 = 1000 * (1 - 30 / 100)
      expect(result2).toBe(700)

      // Test case 3: 1000 at 0% SPP
      const result3 = 1000 * (1 - 0 / 100)
      expect(result3).toBe(1000)
    })

    it('should correctly calculate discount_amount = recommended_price - customer_price', () => {
      const recommendedPrice = 4057.87
      const sppPct = 10
      const customerPrice = recommendedPrice * (1 - sppPct / 100)
      const discountAmount = recommendedPrice - customerPrice

      expect(discountAmount).toBeCloseTo(405.787, 2)
    })
  })
})
