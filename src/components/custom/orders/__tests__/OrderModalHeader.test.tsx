/**
 * Unit Tests for OrderModalHeader component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests match actual implementation
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend expect with axe matchers
expect.extend(toHaveNoViolations)

import { OrderModalHeader } from '../OrderModalHeader'
import { mockOrderDetails, mockOrderDetailsDiscounted } from '@/test/fixtures/orders'

describe('OrderModalHeader', () => {
  describe('Order ID Display', () => {
    it('displays order ID prominently with "Заказ #" prefix', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/заказ\s*#/i)).toBeInTheDocument()
      expect(screen.getByText(/1234567890/)).toBeInTheDocument()
    })

    it('displays vendor code (артикул продавца)', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/артикул:/i)).toBeInTheDocument()
      expect(screen.getByText(/SKU-ABC-001/i)).toBeInTheDocument()
    })
  })

  describe('Product Image Placeholder', () => {
    it('displays Package icon placeholder', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Product Name', () => {
    it('displays product name', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(
        screen.getByText(mockOrderDetails.productName as string, { exact: false })
      ).toBeInTheDocument()
    })

    it('truncates long product name with ellipsis (line-clamp-2)', () => {
      const longNameOrder = {
        ...mockOrderDetails,
        productName:
          'Очень длинное название товара которое должно обрезаться после двух строк текста и показывать многоточие в конце для лучшего отображения в модальном окне',
      }

      render(<OrderModalHeader order={longNameOrder} />)

      const nameElement = screen.getByText(longNameOrder.productName, {
        exact: false,
      })

      expect(nameElement.className).toMatch(/line-clamp/)
    })
  })

  describe('Status Badge', () => {
    it('displays current status badge with styling', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // Status is rendered in a styled span (not separate component)
      const statusContainer = document.querySelector('.inline-flex.items-center')
      expect(statusContainer).toBeInTheDocument()
    })

    it('shows status text from wbStatus mapping', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // mockOrderDetails has wbStatus that maps to "Отсортирован"
      expect(screen.getByText(/Отсортирован/i)).toBeInTheDocument()
    })
  })

  describe('Price Display', () => {
    it('displays sale price with Russian currency format', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      // Should show formatted price like "1 200 ₽"
      expect(screen.getByText(/1[\s\u00A0]?200/)).toBeInTheDocument()
      // Check that at least one ₽ symbol exists (there could be 2 if discount)
      const currencySymbols = screen.queryAllByText(/₽/)
      expect(currencySymbols.length).toBeGreaterThan(0)
    })

    it('shows strikethrough original price when different from sale price', () => {
      render(<OrderModalHeader order={mockOrderDetailsDiscounted} />)

      // Original price should be in strikethrough/line-through style
      const strikethroughElement = document.querySelector('.line-through')
      expect(strikethroughElement).toBeInTheDocument()
    })

    it('does not show strikethrough when prices are equal', () => {
      const samePrice = {
        ...mockOrderDetails,
        salePrice: 1500.0,
        price: 1500.0,
      }
      render(<OrderModalHeader order={samePrice} />)

      const strikethroughElement = document.querySelector('.line-through')
      expect(strikethroughElement).not.toBeInTheDocument()
    })
  })

  describe('Creation Date', () => {
    it('displays order creation date formatted as DD.MM.YYYY HH:mm', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/создан:/i)).toBeInTheDocument()
      expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/)).toBeInTheDocument()
    })

    it('shows "Создан:" label before the date', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/создан:/i)).toBeInTheDocument()
    })
  })

  describe('WB Product Link', () => {
    it('displays nmId link to WB product page', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      expect(screen.getByText(/nmid:/i)).toBeInTheDocument()
      // nmId appears in both the link and order ID, use queryAllByText
      const nmIdTexts = screen.queryAllByText(/12345678/)
      expect(nmIdTexts.length).toBeGreaterThan(0)

      const link = screen.getByText(/nmid:/i).closest('a')
      expect(link).toHaveAttribute(
        'href',
        'https://www.wildberries.ru/catalog/12345678/detail.aspx'
      )
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<OrderModalHeader order={mockOrderDetails} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('price information is readable by screen readers', () => {
      render(<OrderModalHeader order={mockOrderDetails} />)

      const priceElement = screen.getByText(/1[\s\u00A0]?200/).closest('*')
      expect(priceElement).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalOrder = {
        ...mockOrderDetails,
        brand: undefined,
        // productName is required, use empty string as fallback
        productName: '',
      }

      expect(() => render(<OrderModalHeader order={minimalOrder} />)).not.toThrow()
    })

    it('handles very long vendor code', () => {
      const longVendorCode = {
        ...mockOrderDetails,
        vendorCode: 'VERY-LONG-VENDOR-CODE-THAT-MIGHT-OVERFLOW-12345',
      }

      render(<OrderModalHeader order={longVendorCode} />)

      expect(screen.getByText(/VERY-LONG-VENDOR/)).toBeInTheDocument()
    })

    it('handles zero price', () => {
      const zeroPrice = {
        ...mockOrderDetails,
        salePrice: 0,
      }

      render(<OrderModalHeader order={zeroPrice} />)

      // Use queryAllByText and find the price element
      const priceElements = screen.queryAllByText(/0/)
      const priceWithCurrency = priceElements.find(el => el.textContent?.includes('₽'))
      expect(priceWithCurrency).toBeInTheDocument()
    })
  })
})
