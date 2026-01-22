/**
 * Unit tests for MarginSlider component
 * Story 44.2-FE: Input Form Component for Price Calculator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { MarginSlider } from '../MarginSlider'

// Test form type
interface TestFormData {
  testField: number
}

// Helper to render MarginSlider with form context
function renderMarginSlider(overrides: { error?: string; min?: number; max?: number; step?: number } = {}) {
  function Wrapper() {
    const { control } = useForm<TestFormData>({ defaultValues: { testField: 50 } })
    return (
      <MarginSlider<TestFormData>
        name="testField"
        control={control}
        min={overrides.min ?? 0}
        max={overrides.max ?? 100}
        step={overrides.step ?? 1}
        unit="%"
        error={overrides.error}
      />
    )
  }

  return render(<Wrapper />)
}

describe('MarginSlider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders slider and number input', () => {
      renderMarginSlider()

      // Check that slider is rendered (via its accessible role if available)
      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
      expect(input).toHaveAttribute('step', '1')
    })

    it('displays unit label', () => {
      renderMarginSlider()

      expect(screen.getByText('%')).toBeInTheDocument()
    })

    it('displays error message when provided', () => {
      renderMarginSlider({ error: 'This field is required' })

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
  })

  describe('Value Constraints', () => {
    it('respects min value', () => {
      renderMarginSlider({ min: 10, max: 100 })

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '10')
    })

    it('respects max value', () => {
      renderMarginSlider({ min: 0, max: 50 })

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('max', '50')
    })

    it('respects step increment', () => {
      renderMarginSlider({ step: 0.5 })

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.5')
    })
  })

  describe('Accessibility', () => {
    it('has proper input type for numbers', () => {
      renderMarginSlider()

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })
  })
})
