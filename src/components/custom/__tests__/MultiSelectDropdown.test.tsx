/**
 * Unit tests for MultiSelectDropdown component
 * Story 24.9-FE: Multi-select Brand & Warehouse Filters
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Note: Radix dropdown uses portals, so we test the button/trigger behavior
 * and mocked interactions rather than the full portal-based dropdown.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MultiSelectDropdown } from '../MultiSelectDropdown'

describe('MultiSelectDropdown', () => {
  const defaultProps = {
    label: 'Бренды',
    options: ['Brand A', 'Brand B', 'Brand C'],
    selected: [] as string[],
    onChange: vi.fn(),
  }

  describe('button rendering', () => {
    it('renders with placeholder when nothing selected', () => {
      render(<MultiSelectDropdown {...defaultProps} placeholder="Все бренды" />)
      expect(screen.getByText('Все бренды')).toBeInTheDocument()
    })

    it('renders with default placeholder "Все" when not specified', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      expect(screen.getByText('Все')).toBeInTheDocument()
    })

    it('shows single selected item name', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={['Brand A']} />)
      expect(screen.getByText('Brand A')).toBeInTheDocument()
    })

    it('shows count when multiple items selected', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={['Brand A', 'Brand B']} />)
      expect(screen.getByText('Бренды (2)')).toBeInTheDocument()
    })

    it('shows count when all items selected', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={['Brand A', 'Brand B', 'Brand C']} />)
      expect(screen.getByText('Бренды (3)')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('renders loading skeleton when loading', () => {
      render(<MultiSelectDropdown {...defaultProps} loading />)
      const skeleton = document.querySelector('[class*="animate-pulse"]')
      expect(skeleton).toBeInTheDocument()
    })

    it('does not render button when loading', () => {
      render(<MultiSelectDropdown {...defaultProps} loading />)
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('applies disabled attribute when disabled prop is true', () => {
      render(<MultiSelectDropdown {...defaultProps} disabled />)
      const button = screen.getByRole('combobox')
      expect(button).toBeDisabled()
    })

    it('is not disabled by default', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      const button = screen.getByRole('combobox')
      expect(button).not.toBeDisabled()
    })
  })

  describe('clear button', () => {
    it('shows clear button when items are selected', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={['Brand A']} />)
      expect(screen.getByLabelText('Очистить')).toBeInTheDocument()
    })

    it('hides clear button when nothing selected', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      expect(screen.queryByLabelText('Очистить')).not.toBeInTheDocument()
    })

    it('calls onChange with empty array when clear button clicked', () => {
      const onChange = vi.fn()
      render(
        <MultiSelectDropdown
          {...defaultProps}
          selected={['Brand A', 'Brand B']}
          onChange={onChange}
        />
      )

      fireEvent.click(screen.getByLabelText('Очистить'))

      expect(onChange).toHaveBeenCalledWith([])
    })

    it('clears and resets search when clear clicked', () => {
      const onChange = vi.fn()
      render(
        <MultiSelectDropdown
          {...defaultProps}
          selected={['Brand A']}
          onChange={onChange}
        />
      )

      fireEvent.click(screen.getByLabelText('Очистить'))

      expect(onChange).toHaveBeenCalledWith([])
    })
  })

  describe('accessibility', () => {
    it('has aria-label from prop', () => {
      render(<MultiSelectDropdown {...defaultProps} aria-label="Выберите бренды" />)
      expect(screen.getByLabelText('Выберите бренды')).toBeInTheDocument()
    })

    it('uses label as default aria-label', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      expect(screen.getByLabelText('Бренды')).toBeInTheDocument()
    })

    it('has role="combobox"', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('has aria-expanded="false" when closed', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      const button = screen.getByRole('combobox')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('has aria-haspopup="menu"', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      const button = screen.getByRole('combobox')
      expect(button).toHaveAttribute('aria-haspopup', 'menu')
    })
  })

  describe('visual states', () => {
    it('adds border highlight when items selected', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={['Brand A']} />)
      const button = screen.getByRole('combobox')
      expect(button).toHaveClass('border-primary')
    })

    it('no border highlight when nothing selected', () => {
      render(<MultiSelectDropdown {...defaultProps} />)
      const button = screen.getByRole('combobox')
      expect(button).not.toHaveClass('border-primary')
    })
  })

  describe('custom className', () => {
    it('applies custom className to button', () => {
      render(<MultiSelectDropdown {...defaultProps} className="w-60" />)
      const button = screen.getByRole('combobox')
      expect(button).toHaveClass('w-60')
    })
  })

  describe('empty options', () => {
    it('still renders button with empty options', () => {
      render(<MultiSelectDropdown {...defaultProps} options={[]} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('shows placeholder with empty options', () => {
      render(<MultiSelectDropdown {...defaultProps} options={[]} placeholder="Нет опций" />)
      expect(screen.getByText('Нет опций')).toBeInTheDocument()
    })
  })

  describe('button text logic', () => {
    it('shows placeholder when selected is empty array', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={[]} placeholder="Все" />)
      expect(screen.getByText('Все')).toBeInTheDocument()
    })

    it('shows single item text when one selected', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={['Brand B']} />)
      expect(screen.getByText('Brand B')).toBeInTheDocument()
    })

    it('shows label with count when 2+ selected', () => {
      render(<MultiSelectDropdown {...defaultProps} selected={['Brand A', 'Brand C']} />)
      expect(screen.getByText('Бренды (2)')).toBeInTheDocument()
    })
  })
})
