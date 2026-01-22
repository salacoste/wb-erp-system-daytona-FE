/**
 * Unit Tests for GroupByToggle Component
 * Epic 36 - Product Card Linking (Склейки)
 * Story 36.5-FE: Testing & Documentation - Phase 3
 *
 * Tests:
 * - Rendering with both grouping modes
 * - Button state and aria-pressed attributes
 * - Click interactions and callbacks
 * - Accessibility
 * - Custom styling
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupByToggle } from '../GroupByToggle'

describe('GroupByToggle', () => {
  describe('Rendering', () => {
    it('renders both toggle buttons', () => {
      const mockOnChange = vi.fn()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      expect(screen.getByText('По артикулам')).toBeInTheDocument()
      expect(screen.getByText('По склейкам')).toBeInTheDocument()
    })

    it('applies default variant to active button (SKU)', () => {
      const mockOnChange = vi.fn()
      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам').closest('button')
      const imtIdButton = screen.getByText('По склейкам').closest('button')

      expect(skuButton?.className).toContain('bg-primary')
      expect(imtIdButton?.className).toContain('border-input')
    })

    it('applies default variant to active button (imtId)', () => {
      const mockOnChange = vi.fn()
      render(<GroupByToggle groupBy="imtId" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам').closest('button')
      const imtIdButton = screen.getByText('По склейкам').closest('button')

      expect(skuButton?.className).toContain('border-input')
      expect(imtIdButton?.className).toContain('bg-primary')
    })

    it('applies custom className', () => {
      const mockOnChange = vi.fn()
      const { container } = render(
        <GroupByToggle
          groupBy="sku"
          onGroupByChange={mockOnChange}
          className="custom-toggle"
        />
      )

      const wrapper = container.querySelector('.custom-toggle')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Aria Attributes', () => {
    it('sets aria-pressed="true" for active SKU button', () => {
      const mockOnChange = vi.fn()
      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам').closest('button')
      const imtIdButton = screen.getByText('По склейкам').closest('button')

      expect(skuButton).toHaveAttribute('aria-pressed', 'true')
      expect(imtIdButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('sets aria-pressed="true" for active imtId button', () => {
      const mockOnChange = vi.fn()
      render(<GroupByToggle groupBy="imtId" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам').closest('button')
      const imtIdButton = screen.getByText('По склейкам').closest('button')

      expect(skuButton).toHaveAttribute('aria-pressed', 'false')
      expect(imtIdButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('has descriptive aria-label for SKU button', () => {
      const mockOnChange = vi.fn()
      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам').closest('button')
      expect(skuButton).toHaveAttribute(
        'aria-label',
        'Группировка по артикулам'
      )
    })

    it('has descriptive aria-label for imtId button', () => {
      const mockOnChange = vi.fn()
      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const imtIdButton = screen.getByText('По склейкам').closest('button')
      expect(imtIdButton).toHaveAttribute('aria-label', 'Группировка по склейкам')
    })
  })

  describe('Click Interactions', () => {
    it('calls onGroupByChange with "sku" when SKU button clicked', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="imtId" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам')
      await user.click(skuButton)

      expect(mockOnChange).toHaveBeenCalledWith('sku')
      expect(mockOnChange).toHaveBeenCalledTimes(1)
    })

    it('calls onGroupByChange with "imtId" when imtId button clicked', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const imtIdButton = screen.getByText('По склейкам')
      await user.click(imtIdButton)

      expect(mockOnChange).toHaveBeenCalledWith('imtId')
      expect(mockOnChange).toHaveBeenCalledTimes(1)
    })

    it('allows clicking active button (no-op expected in parent)', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам')
      await user.click(skuButton)

      // Component still calls callback even for active button
      expect(mockOnChange).toHaveBeenCalledWith('sku')
    })
  })

  describe('Button Sizing', () => {
    it('applies small size to both buttons', () => {
      const mockOnChange = vi.fn()
      const { container } = render(
        <GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />
      )

      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        expect(button.className).toContain('h-8') // updated to smaller size
      })
    })
  })

  describe('Layout', () => {
    it('displays buttons in flex gap layout', () => {
      const mockOnChange = vi.fn()
      const { container } = render(
        <GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />
      )

      const wrapper = container.querySelector('.flex.gap-2')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('State Transitions', () => {
    it('updates visual state when groupBy changes', () => {
      const mockOnChange = vi.fn()
      const { rerender } = render(
        <GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />
      )

      let skuButton = screen.getByText('По артикулам').closest('button')
      expect(skuButton).toHaveAttribute('aria-pressed', 'true')

      rerender(<GroupByToggle groupBy="imtId" onGroupByChange={mockOnChange} />)

      skuButton = screen.getByText('По артикулам').closest('button')
      const imtIdButton = screen.getByText('По склейкам').closest('button')

      expect(skuButton).toHaveAttribute('aria-pressed', 'false')
      expect(imtIdButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid consecutive clicks', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const imtIdButton = screen.getByText('По склейкам')

      // Rapid clicks
      await user.click(imtIdButton)
      await user.click(imtIdButton)
      await user.click(imtIdButton)

      expect(mockOnChange).toHaveBeenCalledTimes(3)
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'imtId')
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'imtId')
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'imtId')
    })

    it('handles alternating clicks', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам')
      const imtIdButton = screen.getByText('По склейкам')

      await user.click(imtIdButton)
      await user.click(skuButton)
      await user.click(imtIdButton)

      expect(mockOnChange).toHaveBeenCalledTimes(3)
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'imtId')
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'sku')
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'imtId')
    })
  })

  describe('Keyboard Navigation', () => {
    it('allows keyboard navigation between buttons', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const skuButton = screen.getByText('По артикулам')
      const imtIdButton = screen.getByText('По склейкам')

      // Focus first button
      await user.tab()
      expect(skuButton).toHaveFocus()

      // Tab to second button
      await user.tab()
      expect(imtIdButton).toHaveFocus()
    })

    it('activates button with Enter key', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const imtIdButton = screen.getByText('По склейкам')
      imtIdButton.focus()

      await user.keyboard('{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith('imtId')
    })

    it('activates button with Space key', async () => {
      const mockOnChange = vi.fn()
      const user = userEvent.setup()

      render(<GroupByToggle groupBy="sku" onGroupByChange={mockOnChange} />)

      const imtIdButton = screen.getByText('По склейкам')
      imtIdButton.focus()

      await user.keyboard(' ')

      expect(mockOnChange).toHaveBeenCalledWith('imtId')
    })
  })
})
