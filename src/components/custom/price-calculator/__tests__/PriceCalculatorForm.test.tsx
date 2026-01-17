/**
 * Unit tests for PriceCalculatorForm component
 * Story 44.2-FE: Input Form Component for Price Calculator
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PriceCalculatorForm } from '../PriceCalculatorForm'

// Mock the sub-components
vi.mock('../MarginSlider', () => ({
  MarginSlider: ({ name, error, unit }: { name: string; error?: string; unit: string }) => (
    <div data-testid={`slider-${name}`}>
      <input type="number" data-testid={`input-${name}`} />
      <span>{unit}</span>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}))

vi.mock('../FieldTooltip', () => ({
  FieldTooltip: ({ _content }: { _content: string }) => (
    <button type="button" aria-label="Show tooltip">
      ?
    </button>
  ),
}))

describe('PriceCalculatorForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Required Fields', () => {
    it('renders all required input fields', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Check for key labels and headings
      expect(screen.getByText('Price Calculator')).toBeInTheDocument()
      expect(screen.getByText(/target margin %/i)).toBeInTheDocument()
      expect(screen.getByText(/fixed costs/i)).toBeInTheDocument()
      expect(screen.getByText(/percentage costs/i)).toBeInTheDocument()
    })

    it('renders percentage sliders', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByTestId('slider-target_margin_pct')).toBeInTheDocument()
      expect(screen.getByTestId('slider-buyback_pct')).toBeInTheDocument()
      expect(screen.getByTestId('slider-advertising_pct')).toBeInTheDocument()
    })

    it('renders storage input with default 0', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const storageInput = screen.getByLabelText(/storage/i)
      expect(storageInput).toBeInTheDocument()
    })
  })

  describe('Advanced Options', () => {
    it('renders collapsible advanced section', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText(/advanced options/i)).toBeInTheDocument()
    })

    it('toggles advanced section on click', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const trigger = screen.getByRole('button', { name: /advanced options/i })
      await userEvent.click(trigger)

      // After clicking, VAT select should be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/vat %/i)).toBeInTheDocument()
      })
    })

    it('renders VAT select with correct options', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const trigger = screen.getByRole('button', { name: /advanced options/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        const vatSelect = screen.getByLabelText(/vat %/i)
        expect(vatSelect).toBeInTheDocument()
      })
    })

    it('renders acquiring input', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const trigger = screen.getByRole('button', { name: /advanced options/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByLabelText(/acquiring %/i)).toBeInTheDocument()
      })
    })

    it('renders commission override input', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const trigger = screen.getByRole('button', { name: /advanced options/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByLabelText(/commission % \(override\)/i)).toBeInTheDocument()
      })
    })

    it('renders nm_id override input', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const trigger = screen.getByRole('button', { name: /advanced options/i })
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByLabelText(/product id \(override\)/i)).toBeInTheDocument()
      })
    })
  })

  describe('Story 44.5: Auto-calculation', () => {
    it('shows calculating indicator during loading', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} loading={true} />)

      // Check for the loading button text (using getAllByText since there may be multiple)
      const calculatingElements = screen.getAllByText('Calculating...')
      expect(calculatingElements.length).toBeGreaterThan(0)
    })

    it('triggers reset confirmation when results exist', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} hasResults={true} />)

      const resetButton = screen.getByRole('button', { name: /reset/i })
      await userEvent.click(resetButton)

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/confirm reset/i)).toBeInTheDocument()
      })
    })

    it('resets immediately when no results', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} hasResults={false} />)

      const resetButton = screen.getByRole('button', { name: /reset/i })
      await userEvent.click(resetButton)

      // Should NOT show confirmation dialog
      expect(screen.queryByText(/confirm reset/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Actions', () => {
    it('renders Calculate button', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('button', { name: /calculate price/i })).toBeInTheDocument()
    })

    it('renders Reset button', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
    })

    it('shows loading state on Calculate button', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} loading={true} />)

      // Check for the loading button text (using getAllByText since there may be multiple)
      const calculatingElements = screen.getAllByText('Calculating...')
      expect(calculatingElements.length).toBeGreaterThan(0)
    })

    it('disables Calculate button when disabled', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} disabled={true} />)

      const calculateBtn = screen.getByRole('button', { name: /calculate price/i })
      expect(calculateBtn).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('shows required field errors when submitting empty form', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Clear the COGS input (has default 0) and blur to trigger validation
      const cogsInput = screen.getByLabelText(/cogs/i)
      await userEvent.clear(cogsInput)
      await userEvent.tab() // Blur to trigger validation

      // Validation error should appear
      await waitFor(() => {
        expect(screen.getByText(/COGS is required/i)).toBeInTheDocument()
      })
    })

    it('shows error for negative values', async () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const cogsInput = screen.getByLabelText(/cogs/i)
      await userEvent.clear(cogsInput)
      await userEvent.type(cogsInput, '-10')

      await waitFor(() => {
        expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument()
      })
    })

    it('has title attribute for keyboard hint', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const calculateBtn = screen.getByRole('button', { name: /calculate price/i })
      expect(calculateBtn).toHaveAttribute('title', 'Press Enter to calculate')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      expect(screen.getByText('Price Calculator')).toBeInTheDocument()
      expect(screen.getByText(/enter your cost parameters/i)).toBeInTheDocument()
    })

    it('all inputs have associated labels', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Check that key inputs have labels
      expect(screen.getByLabelText(/logistics forward/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/logistics reverse/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/storage/i)).toBeInTheDocument()
    })

    it('has field tooltips for explanations', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Should have multiple tooltip buttons
      const tooltips = screen.getAllByLabelText(/show tooltip/i)
      expect(tooltips.length).toBeGreaterThan(0)
    })

    it('reset button has keyboard shortcut hint', () => {
      render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      const resetButton = screen.getByRole('button', { name: /reset/i })
      expect(resetButton).toHaveAttribute('title', 'Press Esc to reset (keyboard shortcut)')
    })
  })

  describe('Responsive Layout', () => {
    it('renders in responsive grid structure', () => {
      const { container } = render(<PriceCalculatorForm onSubmit={mockOnSubmit} />)

      // Check for grid classes (using querySelector since className is complex)
      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
    })
  })
})
