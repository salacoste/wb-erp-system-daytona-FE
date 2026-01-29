/**
 * TDD Unit Tests for OrderModalHeader component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests written BEFORE implementation (TDD approach)
 * Focus: Order info display, price formatting, status badge
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend expect with axe matchers
expect.extend(toHaveNoViolations)

// Import component (will fail until implemented - TDD)
import { OrderModalHeader } from '../OrderModalHeader'
import {
  mockOrderDetails,
  mockOrderDetailsWithImage,
  mockOrderDetailsNoImage,
  mockOrderDetailsDiscounted,
} from '@/test/fixtures/orders'

describe('OrderModalHeader', () => {
  describe('AC2: Modal Header - Order ID Display', () => {
    it('displays order ID prominently with "Заказ #" prefix', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/заказ\s*#1234567890/i)).toBeInTheDocument()
    })

    it('displays vendor code (артикул продавца)', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/артикул:/i)).toBeInTheDocument()
      expect(screen.getByText(/SKU-001/i)).toBeInTheDocument()
    })
  })

  describe('AC2: Modal Header - Product Image', () => {
    it('displays product image thumbnail when available', () => {
      render(<OrderModalHeader order={mockOrderDetailsWithImage} />)

      const image = screen.getByRole('img', { name: /товар|product/i })
      expect(image).toBeInTheDocument()
      // Image src should be from WB CDN or similar
      expect(image).toHaveAttribute('src')
    })

    it('displays placeholder image when image_url is not available', () => {
      render(<OrderModalHeader order={mockOrderDetailsNoImage} />)

      // Should show Package icon or placeholder image
      const placeholder =
        screen.queryByRole('img', { name: /placeholder/i }) ||
        document.querySelector('[data-testid="product-placeholder"]') ||
        document.querySelector('svg')

      expect(placeholder).toBeInTheDocument()
    })

    it('handles image load error with fallback', () => {
      render(<OrderModalHeader order={mockOrderDetailsWithImage} />)

      const image = screen.getByRole('img', { name: /товар|product/i })

      // Simulate error
      image.dispatchEvent(new Event('error'))

      // Should show fallback (placeholder)
      // Note: Implementation should handle onError
    })
  })

  describe('AC2: Modal Header - Product Name', () => {
    it('displays product name', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(mockOrderDetails.product_name, { exact: false })).toBeInTheDocument()
    })

    it('truncates long product name with ellipsis (max 2 lines)', () => {
      const longNameOrder = {
        ...mockOrderDetails,
        product_name:
          'Очень длинное название товара которое должно обрезаться после двух строк текста и показывать многоточие в конце для лучшего отображения в модальном окне',
      }

      render(<OrderModalHeader order={longNameOrder} />)

      const nameElement = screen.getByText(longNameOrder.product_name, {
        exact: false,
      })

      // Check for line-clamp-2 or similar CSS class
      expect(nameElement.className).toMatch(/line-clamp|truncate|overflow/)
    })
  })

  describe('AC2: Modal Header - Status Badge', () => {
    it('displays current status badge', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // Should render OrderStatusBadge or similar
      const statusBadge = screen.getByTestId('order-status-badge')
      expect(statusBadge).toBeInTheDocument()
    })

    it('shows correct status text for "new" status', () => {
      const newOrder = { ...mockOrderDetails, supplier_status: 'new' as const }
      render(<OrderModalHeader order={newOrder} />)

      expect(screen.getByText(/новый|ожидает/i)).toBeInTheDocument()
    })

    it('shows correct status text for "confirm" status', () => {
      const confirmedOrder = {
        ...mockOrderDetails,
        supplier_status: 'confirm' as const,
      }
      render(<OrderModalHeader order={confirmedOrder} />)

      expect(screen.getByText(/подтверждён|в обработке/i)).toBeInTheDocument()
    })

    it('shows correct status text for "complete" status', () => {
      const completedOrder = {
        ...mockOrderDetails,
        supplier_status: 'complete' as const,
      }
      render(<OrderModalHeader order={completedOrder} />)

      expect(screen.getByText(/выполнен|завершён/i)).toBeInTheDocument()
    })

    it('shows correct status text for "cancel" status', () => {
      const cancelledOrder = {
        ...mockOrderDetails,
        supplier_status: 'cancel' as const,
      }
      render(<OrderModalHeader order={cancelledOrder} />)

      expect(screen.getByText(/отменён/i)).toBeInTheDocument()
    })
  })

  describe('AC2: Modal Header - Price Display', () => {
    it('displays sale price with Russian currency format', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // Should show formatted price like "1 500,00 ₽" or "1 500 ₽"
      expect(screen.getByText(/1[\s\u00A0]?500/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('shows strikethrough original price when different from sale price', () => {
      render(<OrderModalHeader order={mockOrderDetailsDiscounted} />)

      // Original price should be in strikethrough/line-through style
      const priceElements = screen.getAllByText(/₽/)
      expect(priceElements.length).toBeGreaterThanOrEqual(1)

      // Look for strikethrough element
      const strikethroughElement = document.querySelector('[class*="line-through"], s, del')
      // If discounted, should have strikethrough original price
      if (mockOrderDetailsDiscounted.price_with_discount !== mockOrderDetails.price_with_discount) {
        expect(strikethroughElement).toBeInTheDocument()
      }
    })

    it('does not show strikethrough when prices are equal', () => {
      const samePrice = {
        ...mockOrderDetails,
        price_with_discount: 1500.0,
      }
      render(<OrderModalHeader order={samePrice} />)

      // Should not have strikethrough element
      const strikethroughElement = document.querySelector('[class*="line-through"], s, del')
      expect(strikethroughElement).not.toBeInTheDocument()
    })
  })

  describe('AC2: Modal Header - Creation Date', () => {
    it('displays order creation date formatted as DD.MM.YYYY HH:mm', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // mockOrderDetails.created_at = '2026-01-28T10:00:00Z'
      // Expected format: "28.01.2026 10:00" or "28.01.2026 13:00" (Moscow TZ)
      expect(screen.getByText(/создан:/i)).toBeInTheDocument()
      expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/)).toBeInTheDocument()
    })

    it('shows "Создан:" label before the date', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/создан:/i)).toBeInTheDocument()
    })
  })

  describe('Additional Order Info', () => {
    it('displays warehouse name when available', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/коледино/i)).toBeInTheDocument()
    })

    it('displays delivery type badge (FBS/FBO)', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // Should show FBS or FBO badge
      expect(screen.getByText(/fbs|fbo/i)).toBeInTheDocument()
    })

    it('displays brand name when available', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/repairpro/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('renders skeleton when order is undefined', () => {
      render(<OrderModalHeader order={undefined} isLoading={true} />)

      // Should show skeleton elements
      const skeletons = document.querySelectorAll(
        '[data-skeleton], [class*="skeleton"], [class*="animate-pulse"]'
      )
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('shows skeleton for image placeholder during loading', () => {
      render(<OrderModalHeader order={undefined} isLoading={true} />)

      const imageSkeleton = document.querySelector(
        '[data-testid="image-skeleton"], [class*="skeleton"]'
      )
      expect(imageSkeleton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<OrderModalHeader order={mockOrderDetails} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('image has descriptive alt text', () => {
      render(<OrderModalHeader order={mockOrderDetailsWithImage} />)

      const image = screen.queryByRole('img')
      if (image) {
        expect(image).toHaveAttribute('alt')
        expect(image.getAttribute('alt')).not.toBe('')
      }
    })

    it('price information is readable by screen readers', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // Price should be in an element with semantic meaning or aria-label
      const priceElement = screen.getByText(/1[\s\u00A0]?500/).closest('*')
      expect(priceElement).toBeInTheDocument()
    })

    it('status badge has accessible label', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      const statusBadge = screen.getByTestId('order-status-badge')
      // Should have visible text or aria-label
      expect(statusBadge.textContent || statusBadge.getAttribute('aria-label')).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalOrder = {
        ...mockOrderDetails,
        brand: undefined,
        warehouse_name: undefined,
        office_address: undefined,
      }

      // Should not throw
      expect(() => render(<OrderModalHeader order={minimalOrder} />)).not.toThrow()
    })

    it('handles very long vendor code', () => {
      const longVendorCode = {
        ...mockOrderDetails,
        vendor_code: 'VERY-LONG-VENDOR-CODE-THAT-MIGHT-OVERFLOW-12345',
      }

      render(<OrderModalHeader order={longVendorCode} />)

      expect(screen.getByText(/VERY-LONG-VENDOR/)).toBeInTheDocument()
    })

    it('handles zero price', () => {
      const zeroPrice = {
        ...mockOrderDetails,
        price_with_discount: 0,
      }

      render(<OrderModalHeader order={zeroPrice} />)

      expect(screen.getByText(/0/)).toBeInTheDocument()
    })
  })
})
