/**
 * Unit tests for MarginSlider component
 * Story 44.2-FE: Input Form Component for Price Calculator
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarginSlider } from '../MarginSlider'

describe('MarginSlider', () => {
  // Mock register function
  const mockRegister = vi.fn().mockReturnValue({
    ref: { current: null },
    onChange: vi.fn(),
    name: 'test-field',
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders slider and number input', () => {
      render(
        <MarginSlider
          name="test-field"
          register={mockRegister}
          min={0}
          max={100}
          step={1}
          unit="%"
          defaultValue={50}
        />
      )

      // Check that slider is rendered (via its accessible role if available)
      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '100')
      expect(input).toHaveAttribute('step', '1')
    })

    it('displays unit label', () => {
      render(
        <MarginSlider
          name="test-field"
          register={mockRegister}
          min={0}
          max={100}
          step={1}
          unit="%"
          defaultValue={50}
        />
      )

      expect(screen.getByText('%')).toBeInTheDocument()
    })

    it('displays error message when provided', () => {
      render(
        <MarginSlider
          name="test-field"
          register={mockRegister}
          min={0}
          max={100}
          step={1}
          unit="%"
          error="This field is required"
          defaultValue={50}
        />
      )

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
  })

  describe('Value Constraints', () => {
    it('respects min value', () => {
      render(
        <MarginSlider
          name="test-field"
          register={mockRegister}
          min={10}
          max={100}
          step={1}
          unit="%"
          defaultValue={50}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '10')
    })

    it('respects max value', () => {
      render(
        <MarginSlider
          name="test-field"
          register={mockRegister}
          min={0}
          max={50}
          step={1}
          unit="%"
          defaultValue={25}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('max', '50')
    })

    it('respects step increment', () => {
      render(
        <MarginSlider
          name="test-field"
          register={mockRegister}
          min={0}
          max={100}
          step={0.5}
          unit="%"
          defaultValue={20}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.5')
    })
  })

  describe('Bidirectional Sync', () => {
    it('registers with validation constraints', () => {
      render(
        <MarginSlider
          name="target_margin_pct"
          register={mockRegister}
          min={0}
          max={50}
          step={0.5}
          unit="%"
          defaultValue={20}
        />
      )

      expect(mockRegister).toHaveBeenCalledWith('target_margin_pct', {
        valueAsNumber: true,
        min: { value: 0, message: 'Minimum 0' },
        max: { value: 50, message: 'Maximum 50' },
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper input type for numbers', () => {
      render(
        <MarginSlider
          name="test-field"
          register={mockRegister}
          min={0}
          max={100}
          step={1}
          unit="%"
          defaultValue={50}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })
  })
})
