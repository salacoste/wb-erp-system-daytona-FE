/**
 * Unit tests for TargetMarginSection component
 * Story 44.2-FE: Input Form Component
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { TargetMarginSection } from '../TargetMarginSection'

// Test form data interface
interface TestFormData {
  target_margin_pct: number
}

// Helper to render TargetMarginSection with form context
function renderTargetMarginSection(error?: string) {
  function Wrapper() {
    const { control } = useForm<TestFormData>({
      defaultValues: { target_margin_pct: 17 },
    })

    return (
      <TargetMarginSection<TestFormData> control={control} error={error} />
    )
  }

  return render(<Wrapper />)
}

describe('TargetMarginSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render section header with Russian text', () => {
      renderTargetMarginSection()

      expect(screen.getByText('Целевая маржа')).toBeInTheDocument()
    })

    it('should render margin percentage label', () => {
      renderTargetMarginSection()

      expect(screen.getByText('Процент маржи')).toBeInTheDocument()
    })

    it('should render target icon', () => {
      const { container } = renderTargetMarginSection()

      const icon = container.querySelector('.lucide-target')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('MarginSlider Integration', () => {
    it('should render number input from MarginSlider', () => {
      renderTargetMarginSection()

      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should have 0-50% range', () => {
      renderTargetMarginSection()

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '50')
    })

    it('should have 0.5% step', () => {
      renderTargetMarginSection()

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', '0.5')
    })

    it('should display percentage unit', () => {
      renderTargetMarginSection()

      expect(screen.getByText('%')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      renderTargetMarginSection('Маржа не может быть отрицательной')

      expect(
        screen.getByText('Маржа не может быть отрицательной')
      ).toBeInTheDocument()
    })

    it('should not display error when not provided', () => {
      renderTargetMarginSection()

      expect(
        screen.queryByText('Маржа не может быть отрицательной')
      ).not.toBeInTheDocument()
    })
  })

  describe('Tooltip', () => {
    it('should render tooltip trigger for margin field', () => {
      renderTargetMarginSection()

      // FieldTooltip renders a button as trigger
      const tooltipTriggers = screen.getAllByRole('button')
      expect(tooltipTriggers.length).toBeGreaterThan(0)
    })
  })

  describe('Styling', () => {
    it('should have primary background color scheme', () => {
      const { container } = renderTargetMarginSection()

      const section = container.querySelector('.bg-primary\\/5')
      expect(section).toBeInTheDocument()
    })

    it('should have primary left border', () => {
      const { container } = renderTargetMarginSection()

      const section = container.querySelector('.border-l-primary')
      expect(section).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper htmlFor/id linking', () => {
      renderTargetMarginSection()

      const label = screen.getByText('Процент маржи')
      expect(label).toHaveAttribute('for', 'target_margin_pct')
    })

    it('should have hidden icon for screen readers', () => {
      const { container } = renderTargetMarginSection()

      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })
})
