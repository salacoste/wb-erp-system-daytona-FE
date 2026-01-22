/**
 * Unit tests for CustomerPriceDisplay component
 * Story 44.19-FE: SPP Display (Customer Price)
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CustomerPriceDisplay } from '../CustomerPriceDisplay'

describe('CustomerPriceDisplay', () => {
  describe('Visibility', () => {
    it('should render when SPP > 0', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      expect(screen.getByTestId('customer-price-display')).toBeInTheDocument()
    })

    it('should not render when SPP = 0', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={0} />)

      expect(
        screen.queryByTestId('customer-price-display')
      ).not.toBeInTheDocument()
    })

    it('should not render when SPP < 0', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={-5} />)

      expect(
        screen.queryByTestId('customer-price-display')
      ).not.toBeInTheDocument()
    })

    it('should not render when recommended price is 0', () => {
      render(<CustomerPriceDisplay recommendedPrice={0} sppPct={10} />)

      expect(
        screen.queryByTestId('customer-price-display')
      ).not.toBeInTheDocument()
    })
  })

  describe('Price Calculations', () => {
    it('should calculate customer price correctly with 10% SPP', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      // customerPrice = 4057.87 * (1 - 0.10) = 3652.083
      const customerPrice = screen.getByTestId('customer-price')
      expect(customerPrice).toBeInTheDocument()
      expect(customerPrice.textContent).toMatch(/3[\s ]?652/)
    })

    it('should calculate customer price correctly with 30% SPP', () => {
      render(<CustomerPriceDisplay recommendedPrice={1000} sppPct={30} />)

      // customerPrice = 1000 * (1 - 0.30) = 700
      const customerPrice = screen.getByTestId('customer-price')
      expect(customerPrice.textContent).toMatch(/700/)
    })

    it('should display seller price (recommended price)', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      const sellerPrice = screen.getByTestId('seller-price')
      expect(sellerPrice).toBeInTheDocument()
      expect(sellerPrice.textContent).toMatch(/4[\s ]?057/)
    })

    it('should display WB discount amount', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      // discountAmount = 4057.87 - 3652.083 = 405.787
      const discountAmount = screen.getByTestId('wb-discount-amount')
      expect(discountAmount).toBeInTheDocument()
      expect(discountAmount.textContent).toMatch(/-.*405/)
    })
  })

  describe('Labels', () => {
    it('should display seller price label in Russian', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      expect(
        screen.getByText('Ваша цена (получаете вы):')
      ).toBeInTheDocument()
    })

    it('should display customer price label in Russian', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      expect(screen.getByText('Цена для покупателя:')).toBeInTheDocument()
    })

    it('should display WB discount label with percentage', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      expect(screen.getByText('Скидка WB (-10%):')).toBeInTheDocument()
    })

    it('should display SPP explanation note', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      expect(
        screen.getByText(/СПП — скидка WB за их счёт/i)
      ).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply green color to WB discount amount', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      const discountAmount = screen.getByTestId('wb-discount-amount')
      expect(discountAmount).toHaveClass('text-green-600')
    })

    it('should highlight customer price with primary color', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      const customerPrice = screen.getByTestId('customer-price')
      expect(customerPrice).toHaveClass('text-primary')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small prices', () => {
      render(<CustomerPriceDisplay recommendedPrice={10} sppPct={5} />)

      // customerPrice = 10 * 0.95 = 9.5
      const customerPrice = screen.getByTestId('customer-price')
      expect(customerPrice).toBeInTheDocument()
    })

    it('should handle very large prices', () => {
      render(<CustomerPriceDisplay recommendedPrice={999999.99} sppPct={15} />)

      const customerPrice = screen.getByTestId('customer-price')
      expect(customerPrice).toBeInTheDocument()
    })

    it('should handle 1% SPP', () => {
      render(<CustomerPriceDisplay recommendedPrice={1000} sppPct={1} />)

      // customerPrice = 1000 * 0.99 = 990
      const customerPrice = screen.getByTestId('customer-price')
      expect(customerPrice.textContent).toMatch(/990/)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-hidden on decorative icons', () => {
      render(<CustomerPriceDisplay recommendedPrice={4057.87} sppPct={10} />)

      // Icons should be marked as decorative
      const icons = document.querySelectorAll('[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <CustomerPriceDisplay
          recommendedPrice={4057.87}
          sppPct={10}
          className="custom-class"
        />
      )

      const card = screen.getByTestId('customer-price-display')
      expect(card).toHaveClass('custom-class')
    })
  })
})
