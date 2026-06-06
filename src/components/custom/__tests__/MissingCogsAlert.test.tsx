/**
 * Tests for Story 42.3-FE: Missing COGS Alert Component
 * Epic 42-FE: Task Handlers Adaptation
 *
 * Component displays alert when products are missing COGS assignment.
 * Shows count, preview of products in tooltip, and actionable link to COGS page.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MissingCogsAlert, pluralizeProduct } from '../MissingCogsAlert'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock Radix Tooltip — always render content (jsdom can't trigger open)
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const defaultProducts = ['123456', '234567', '345678', '456789', '567890']

function createMockProps(overrides: Record<string, unknown> = {}) {
  return {
    missingCount: 45,
    missingProducts: defaultProducts,
    onDismiss: vi.fn(),
    className: '',
    ...overrides,
  }
}

describe('MissingCogsAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('visibility conditions', () => {
    it('renders alert when missingCount > 0', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 45 })} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('returns null when missingCount is 0', () => {
      const { container } = render(<MissingCogsAlert {...createMockProps({ missingCount: 0 })} />)

      expect(container.firstChild).toBeNull()
    })

    it('returns null when missingCount is undefined', () => {
      const { container } = render(
        <MissingCogsAlert {...createMockProps({ missingCount: undefined })} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when missingCount is negative', () => {
      const { container } = render(<MissingCogsAlert {...createMockProps({ missingCount: -5 })} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('alert structure', () => {
    it('renders AlertTriangle icon', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('renders dismiss button', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      expect(screen.getByRole('button', { name: /закрыть уведомление/i })).toBeInTheDocument()
    })

    it('renders action link to COGS page', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', expect.stringContaining('has_cogs=false'))
    })

    it('displays title text', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      expect(screen.getByText('Товары без себестоимости')).toBeInTheDocument()
    })

    it('displays description text', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      expect(screen.getByText(/без назначенной себестоимости/)).toBeInTheDocument()
    })
  })

  describe('pluralizeProduct', () => {
    it('returns "товар" for count 1', () => {
      expect(pluralizeProduct(1)).toBe('товар')
    })

    it('returns "товар" for count 21', () => {
      expect(pluralizeProduct(21)).toBe('товар')
    })

    it('returns "товар" for count 101', () => {
      expect(pluralizeProduct(101)).toBe('товар')
    })

    it('returns "товара" for count 2', () => {
      expect(pluralizeProduct(2)).toBe('товара')
    })

    it('returns "товара" for count 3', () => {
      expect(pluralizeProduct(3)).toBe('товара')
    })

    it('returns "товара" for count 4', () => {
      expect(pluralizeProduct(4)).toBe('товара')
    })

    it('returns "товара" for count 22', () => {
      expect(pluralizeProduct(22)).toBe('товара')
    })

    it('returns "товаров" for count 5', () => {
      expect(pluralizeProduct(5)).toBe('товаров')
    })

    it('returns "товаров" for count 11', () => {
      expect(pluralizeProduct(11)).toBe('товаров')
    })

    it('returns "товаров" for count 14', () => {
      expect(pluralizeProduct(14)).toBe('товаров')
    })

    it('returns "товаров" for count 20', () => {
      expect(pluralizeProduct(20)).toBe('товаров')
    })

    it('returns "товаров" for count 111', () => {
      expect(pluralizeProduct(111)).toBe('товаров')
    })

    it('returns "товаров" for count 45', () => {
      expect(pluralizeProduct(45)).toBe('товаров')
    })

    it('handles negative counts with absolute value', () => {
      expect(pluralizeProduct(-1)).toBe('товар')
      expect(pluralizeProduct(-2)).toBe('товара')
      expect(pluralizeProduct(-5)).toBe('товаров')
    })
  })

  describe('count badge display', () => {
    it('displays count with singular for 1', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 1 })} />)

      expect(screen.getByText('1 товар')).toBeInTheDocument()
    })

    it('displays count with plural for 45', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 45 })} />)

      expect(screen.getByText('45 товаров')).toBeInTheDocument()
    })

    it('displays count with genitive for 3', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 3 })} />)

      expect(screen.getByText('3 товара')).toBeInTheDocument()
    })
  })

  describe('dismiss behavior', () => {
    it('hides alert when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)

      const dismissButton = screen.getByRole('button', {
        name: /закрыть уведомление/i,
      })
      await user.click(dismissButton)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('calls onDismiss callback when dismissed', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()
      render(<MissingCogsAlert {...createMockProps({ onDismiss })} />)

      const dismissButton = screen.getByRole('button', {
        name: /закрыть уведомление/i,
      })
      await user.click(dismissButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('works without onDismiss callback', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps({ onDismiss: undefined })} />)

      const dismissButton = screen.getByRole('button', {
        name: /закрыть уведомление/i,
      })
      await user.click(dismissButton)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('tooltip product preview', () => {
    it('renders product IDs in tooltip content', () => {
      const { container } = render(<MissingCogsAlert {...createMockProps()} />)

      // Radix UI TooltipContent renders inside the DOM — check via container
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBeGreaterThanOrEqual(5)
    })

    it('renders 6th+ product as "and X more" in tooltip', () => {
      const { container } = render(
        <MissingCogsAlert
          {...createMockProps({
            missingProducts: [...defaultProducts, '678901', '789012'],
          })}
        />
      )

      // The component renders "и ещё {remainingInList}..." inside the tooltip
      expect(container.textContent).toContain('и ещё')
    })

    it('renders total note when missingCount exceeds list length', () => {
      const { container } = render(<MissingCogsAlert {...createMockProps()} />)

      // Total note: "Всего: 45 / показаны первые 5"
      expect(container.textContent).toContain('Всего:')
      expect(container.textContent).toContain('показаны первые')
    })

    it('renders "Список недоступен" when no products provided', () => {
      const { container } = render(
        <MissingCogsAlert {...createMockProps({ missingProducts: [] })} />
      )

      expect(container.textContent).toContain('Список недоступен')
    })

    it('does not render total note when all products fit', () => {
      const { container } = render(
        <MissingCogsAlert
          {...createMockProps({
            missingCount: 3,
            missingProducts: ['111', '222', '333'],
          })}
        />
      )

      expect(container.textContent).not.toContain('Всего:')
    })
  })

  describe('CSS and styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <MissingCogsAlert {...createMockProps({ className: 'custom-class' })} />
      )

      const alert = container.querySelector('.custom-class')
      expect(alert).toBeInTheDocument()
    })

    it('badge has warning color classes', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      const badge = screen.getByText('45 товаров')
      expect(badge.className).toContain('border-yellow-500')
      expect(badge.className).toContain('text-yellow-700')
    })
  })

  describe('accessibility', () => {
    it('has role="alert" on the container', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('dismiss button has descriptive aria-label', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      expect(screen.getByRole('button', { name: /закрыть уведомление/i })).toBeInTheDocument()
    })

    it('badge has tabIndex=0 for keyboard accessibility', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      const badge = screen.getByText('45 товаров')
      expect(badge).toHaveAttribute('tabindex', '0')
    })

    it('action link is keyboard accessible', () => {
      render(<MissingCogsAlert {...createMockProps()} />)

      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link).toBeInTheDocument()
    })
  })
})
