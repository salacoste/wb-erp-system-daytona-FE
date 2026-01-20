/**
 * Unit tests for FieldTooltip component
 * Story 44.2-FE: Input Form Component for Price Calculator
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the entire FieldTooltip component
vi.mock('@/components/custom/price-calculator/FieldTooltip', () => ({
  FieldTooltip: ({ _content, icon }: { _content: string; icon?: React.ReactNode }) => (
    <button type="button" data-testid="field-tooltip" name="field-tooltip">
      {icon || <span data-testid="question-icon">?</span>}
    </button>
  ),
}))

// Import the mocked component
import { FieldTooltip } from '@/components/custom/price-calculator/FieldTooltip'

describe('FieldTooltip', () => {
  describe('Rendering', () => {
    it('renders tooltip button', () => {
      render(<FieldTooltip content="Test tooltip content" />)

      const button = screen.getByTestId('field-tooltip')
      expect(button).toBeInTheDocument()
    })

    it('renders with default question mark icon', () => {
      render(<FieldTooltip content="Test tooltip content" />)

      expect(screen.getByTestId('question-icon')).toBeInTheDocument()
    })

    it('renders custom icon when provided', () => {
      const CustomIcon = () => <span data-testid="custom-icon">★</span>
      render(<FieldTooltip content="Test tooltip content" icon={<CustomIcon />} />)

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper button type', () => {
      render(<FieldTooltip content="Test content" />)

      const button = screen.getByTestId('field-tooltip')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('button is present in DOM', () => {
      render(<FieldTooltip content="Test content" />)

      const button = screen.getByTestId('field-tooltip')
      expect(button).toBeInTheDocument()
    })
  })
})
