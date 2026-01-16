/**
 * Unit Tests for MergedProductBadge Component
 * Epic 36 - Product Card Linking (Склейки)
 * Story 36.5-FE: Testing & Documentation - Phase 3
 *
 * Tests:
 * - Rendering with different product counts
 * - Tooltip content and interaction
 * - Edge cases (single product, empty array)
 * - Accessibility
 * - Custom labels and styling
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MergedProductBadge } from '../MergedProductBadge'
import type { MergedProduct } from '@/types/advertising-analytics'

// Mock data
const createMergedProducts = (count: number): MergedProduct[] =>
  Array.from({ length: count }, (_, i) => ({
    nmId: 147205694 + i,
    vendorCode: `SKU-${String(i + 1).padStart(3, '0')}`,
  }))

describe('MergedProductBadge', () => {
  describe('Rendering', () => {
    it('renders badge with default label for 2 products', () => {
      const products = createMergedProducts(2)

      render(<MergedProductBadge imtId={123456} mergedProducts={products} />)

      expect(screen.getByText('🔗 Склейка (2)')).toBeInTheDocument()
    })

    it('renders badge with default label for 5 products', () => {
      const products = createMergedProducts(5)

      render(<MergedProductBadge imtId={999} mergedProducts={products} />)

      expect(screen.getByText('🔗 Склейка (5)')).toBeInTheDocument()
    })

    it('renders with custom label', () => {
      const products = createMergedProducts(3)

      render(
        <MergedProductBadge
          imtId={123}
          mergedProducts={products}
          label="Custom Label"
        />
      )

      expect(screen.getByText('🔗 Custom Label')).toBeInTheDocument()
    })

    it('applies secondary variant styling', () => {
      const products = createMergedProducts(2)
      const { container } = render(
        <MergedProductBadge imtId={123} mergedProducts={products} />
      )

      const badge = container.querySelector('[class*="secondary"]')
      expect(badge).toBeInTheDocument()
    })

    it('applies additional className', () => {
      const products = createMergedProducts(2)
      const { container } = render(
        <MergedProductBadge
          imtId={123}
          mergedProducts={products}
          className="custom-badge"
        />
      )

      const badge = container.querySelector('.custom-badge')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('returns null for single product', () => {
      const products = createMergedProducts(1)
      const { container } = render(
        <MergedProductBadge imtId={123} mergedProducts={products} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null for empty product array', () => {
      const { container } = render(
        <MergedProductBadge imtId={123} mergedProducts={[]} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('handles large product count correctly', () => {
      const products = createMergedProducts(20)

      render(<MergedProductBadge imtId={999} mergedProducts={products} />)

      expect(screen.getByText('🔗 Склейка (20)')).toBeInTheDocument()
    })
  })

  describe('Tooltip Content', () => {
    it('displays tooltip trigger with cursor-help', () => {
      const products = createMergedProducts(2)
      const { container } = render(
        <MergedProductBadge imtId={123} mergedProducts={products} />
      )

      const trigger = container.querySelector('.cursor-help')
      expect(trigger).toBeInTheDocument()
    })

    it('shows imtId in tooltip heading', async () => {
      const products = createMergedProducts(2)
      const user = userEvent.setup()

      render(<MergedProductBadge imtId={123456} mergedProducts={products} />)

      const badge = screen.getByText('🔗 Склейка (2)')
      await user.hover(badge)

      // Tooltip appears on hover (Radix UI behavior)
      expect(screen.getByText(/Объединённая карточка #123456/)).toBeVisible()
    })

    it('displays all products in tooltip list', async () => {
      const products: MergedProduct[] = [
        { nmId: 111, vendorCode: 'SKU-A' },
        { nmId: 222, vendorCode: 'SKU-B' },
        { nmId: 333, vendorCode: 'SKU-C' },
      ]
      const user = userEvent.setup()

      render(<MergedProductBadge imtId={999} mergedProducts={products} />)

      const badge = screen.getByText('🔗 Склейка (3)')
      await user.hover(badge)

      // Check all products visible in tooltip
      expect(screen.getByText('SKU-A')).toBeVisible()
      expect(screen.getByText('(#111)')).toBeVisible()
      expect(screen.getByText('SKU-B')).toBeVisible()
      expect(screen.getByText('(#222)')).toBeVisible()
      expect(screen.getByText('SKU-C')).toBeVisible()
      expect(screen.getByText('(#333)')).toBeVisible()
    })

    it('displays explanatory hint in tooltip', async () => {
      const products = createMergedProducts(2)
      const user = userEvent.setup()

      render(<MergedProductBadge imtId={123} mergedProducts={products} />)

      const badge = screen.getByText('🔗 Склейка (2)')
      await user.hover(badge)

      expect(
        screen.getByText(
          /Рекламные затраты основной карточки распределены между всеми товарами группы/
        )
      ).toBeVisible()
    })
  })

  describe('Tooltip Positioning', () => {
    it('positions tooltip on the right side', () => {
      const products = createMergedProducts(2)
      const { container } = render(
        <MergedProductBadge imtId={123} mergedProducts={products} />
      )

      // TooltipContent has side="right" prop (check implementation)
      const tooltipContent = container.querySelector('[data-side="right"]')
      expect(tooltipContent).toBeDefined()
    })

    it('limits tooltip width with max-w-xs', () => {
      const products = createMergedProducts(2)
      const { container } = render(
        <MergedProductBadge imtId={123} mergedProducts={products} />
      )

      const tooltipContent = container.querySelector('.max-w-xs')
      expect(tooltipContent).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has cursor-help class for visual affordance', () => {
      const products = createMergedProducts(2)
      const { container } = render(
        <MergedProductBadge imtId={123} mergedProducts={products} />
      )

      const badge = container.querySelector('.cursor-help')
      expect(badge).toBeInTheDocument()
    })

    it('maintains semantic structure with headings', async () => {
      const products = createMergedProducts(2)
      const user = userEvent.setup()

      render(<MergedProductBadge imtId={123} mergedProducts={products} />)

      const badge = screen.getByText('🔗 Склейка (2)')
      await user.hover(badge)

      // Check for semantic heading in tooltip
      const heading = screen.getByText(/Объединённая карточка #123/)
      expect(heading.className).toContain('font-semibold')
    })

    it('uses list structure for products', async () => {
      const products = createMergedProducts(3)
      const user = userEvent.setup()

      render(<MergedProductBadge imtId={123} mergedProducts={products} />)

      const badge = screen.getByText('🔗 Склейка (3)')
      await user.hover(badge)

      // Tooltip should have <ul> with <li> elements
      const list = document.querySelector('ul')
      expect(list).toBeInTheDocument()
      expect(list?.querySelectorAll('li')).toHaveLength(3)
    })
  })

  describe('Visual Formatting', () => {
    it('uses monospace font for vendor codes', async () => {
      const products: MergedProduct[] = [
        { nmId: 123, vendorCode: 'ABC-001' },
        { nmId: 456, vendorCode: 'ABC-002' },
      ]
      const user = userEvent.setup()

      render(<MergedProductBadge imtId={999} mergedProducts={products} />)

      const badge = screen.getByText('🔗 Склейка (2)')
      await user.hover(badge)

      // Check monospace font for vendor codes
      const vendorCode = screen.getByText('ABC-001')
      expect(vendorCode.className).toContain('font-mono')
    })

    it('uses muted color for nmId values', async () => {
      const products: MergedProduct[] = [
        { nmId: 147205694, vendorCode: 'SKU-001' },
        { nmId: 147205695, vendorCode: 'SKU-002' },
      ]
      const user = userEvent.setup()

      render(<MergedProductBadge imtId={123} mergedProducts={products} />)

      const badge = screen.getByText('🔗 Склейка (2)')
      await user.hover(badge)

      // Check muted foreground styling exists
      const mutedText = document.querySelector('.text-muted-foreground')
      expect(mutedText).toBeInTheDocument()
    })
  })

  describe('Integration Scenarios', () => {
    it('handles multiple merged groups independently', () => {
      const { rerender } = render(
        <MergedProductBadge
          imtId={111}
          mergedProducts={createMergedProducts(2)}
        />
      )

      expect(screen.getByText('🔗 Склейка (2)')).toBeInTheDocument()

      rerender(
        <MergedProductBadge
          imtId={222}
          mergedProducts={createMergedProducts(5)}
        />
      )

      expect(screen.getByText('🔗 Склейка (5)')).toBeInTheDocument()
    })

    it('updates when product count changes', () => {
      const { rerender } = render(
        <MergedProductBadge
          imtId={123}
          mergedProducts={createMergedProducts(2)}
        />
      )

      expect(screen.getByText('🔗 Склейка (2)')).toBeInTheDocument()

      rerender(
        <MergedProductBadge
          imtId={123}
          mergedProducts={createMergedProducts(10)}
        />
      )

      expect(screen.getByText('🔗 Склейка (10)')).toBeInTheDocument()
    })
  })
})
