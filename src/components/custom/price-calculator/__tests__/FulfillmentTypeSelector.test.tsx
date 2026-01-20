/**
 * Unit tests for FulfillmentTypeSelector component
 * Story 44.15-FE: FBO/FBS Fulfillment Type Selection
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FulfillmentTypeSelector } from '../FulfillmentTypeSelector'

describe('FulfillmentTypeSelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render FBO and FBS options', () => {
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      expect(screen.getByText('FBO')).toBeInTheDocument()
      expect(screen.getByText('FBS')).toBeInTheDocument()
    })

    it('should render with Russian labels', () => {
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      expect(screen.getByText('Тип исполнения')).toBeInTheDocument()
      expect(screen.getByText('Товар на складе WB')).toBeInTheDocument()
      expect(screen.getByText('Товар у продавца')).toBeInTheDocument()
    })

    it('should default to FBO when value is FBO', () => {
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      expect(fboButton).toHaveAttribute('aria-checked', 'true')
    })

    it('should show FBS as selected when value is FBS', () => {
      render(
        <FulfillmentTypeSelector value="FBS" onChange={mockOnChange} />
      )

      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      expect(fbsButton).toHaveAttribute('aria-checked', 'true')
    })

    it('should display commission difference badge when provided', () => {
      render(
        <FulfillmentTypeSelector
          value="FBO"
          onChange={mockOnChange}
          commissionDiff={3.5}
        />
      )

      expect(screen.getByText('+3.5%')).toBeInTheDocument()
    })

    it('should not display commission badge when diff is 0', () => {
      render(
        <FulfillmentTypeSelector
          value="FBO"
          onChange={mockOnChange}
          commissionDiff={0}
        />
      )

      expect(screen.queryByText('+0.0%')).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onChange when selection changes to FBS', async () => {
      const user = userEvent.setup()
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      await user.click(fbsButton)

      expect(mockOnChange).toHaveBeenCalledWith('FBS')
    })

    it('should call onChange when selection changes to FBO', async () => {
      const user = userEvent.setup()
      render(
        <FulfillmentTypeSelector value="FBS" onChange={mockOnChange} />
      )

      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      await user.click(fboButton)

      expect(mockOnChange).toHaveBeenCalledWith('FBO')
    })

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup()
      render(
        <FulfillmentTypeSelector
          value="FBO"
          onChange={mockOnChange}
          disabled
        />
      )

      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      await user.click(fbsButton)

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Tooltips', () => {
    it('should have tooltip trigger button', () => {
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      const tooltipButton = screen.getByRole('button', {
        name: 'Информация о типах исполнения',
      })
      expect(tooltipButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role=radiogroup on container', () => {
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
      expect(radioGroup).toHaveAttribute('aria-label', 'Тип исполнения')
    })

    it('should have role=radio on each option', () => {
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      const radioButtons = screen.getAllByRole('radio')
      expect(radioButtons).toHaveLength(2)
    })

    it('should have correct aria-checked attributes', () => {
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })

      expect(fboButton).toHaveAttribute('aria-checked', 'true')
      expect(fbsButton).toHaveAttribute('aria-checked', 'false')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(
        <FulfillmentTypeSelector value="FBO" onChange={mockOnChange} />
      )

      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      fboButton.focus()
      expect(fboButton).toHaveFocus()

      await user.tab()
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })
      expect(fbsButton).toHaveFocus()
    })
  })

  describe('Disabled State', () => {
    it('should disable both buttons when disabled prop is true', () => {
      render(
        <FulfillmentTypeSelector
          value="FBO"
          onChange={mockOnChange}
          disabled
        />
      )

      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      const fbsButton = screen.getByRole('radio', { name: /FBS/i })

      expect(fboButton).toBeDisabled()
      expect(fbsButton).toBeDisabled()
    })

    it('should apply disabled styling', () => {
      render(
        <FulfillmentTypeSelector
          value="FBO"
          onChange={mockOnChange}
          disabled
        />
      )

      const fboButton = screen.getByRole('radio', { name: /FBO/i })
      expect(fboButton).toHaveClass('opacity-50')
    })
  })
})
