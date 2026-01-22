/**
 * Unit tests for PriceSummaryFooter component
 * Story 44.20-FE: Two-Level Pricing Display
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceSummaryFooter } from '../PriceSummaryFooter'

describe('PriceSummaryFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    minimumPrice: 903.23,
    recommendedPrice: 1217.39,
  }

  describe('Rendering', () => {
    it('should render minimum price label in Russian', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      expect(
        screen.getByText('МИНИМАЛЬНАЯ ЦЕНА (пол)')
      ).toBeInTheDocument()
    })

    it('should render recommended price label in Russian', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      expect(screen.getByText('РЕКОМЕНДУЕМАЯ ЦЕНА')).toBeInTheDocument()
    })

    it('should render minimum price value', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      const priceElement = screen.getByTestId('summary-minimum-price')
      expect(priceElement).toBeInTheDocument()
    })

    it('should render recommended price value', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      const priceElement = screen.getByTestId('summary-recommended-price')
      expect(priceElement).toBeInTheDocument()
    })

    it('should render copy buttons', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      // Copy buttons have aria-label
      const copyButtons = screen.getAllByRole('button')
      expect(copyButtons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Customer Price Display', () => {
    it('should render customer price when SPP > 0', () => {
      render(
        <PriceSummaryFooter
          {...defaultProps}
          customerPrice={1095.65}
          sppPct={10}
        />
      )

      expect(
        screen.getByText(/ЦЕНА ДЛЯ ПОКУПАТЕЛЯ/)
      ).toBeInTheDocument()
      expect(screen.getByTestId('summary-customer-price')).toBeInTheDocument()
    })

    it('should NOT render customer price when SPP = 0', () => {
      render(
        <PriceSummaryFooter
          {...defaultProps}
          customerPrice={1217.39}
          sppPct={0}
        />
      )

      expect(
        screen.queryByText(/ЦЕНА ДЛЯ ПОКУПАТЕЛЯ/)
      ).not.toBeInTheDocument()
    })

    it('should NOT render customer price when customerPrice is not provided', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      expect(
        screen.queryByText(/ЦЕНА ДЛЯ ПОКУПАТЕЛЯ/)
      ).not.toBeInTheDocument()
    })

    it('should display SPP percentage in customer price label', () => {
      render(
        <PriceSummaryFooter
          {...defaultProps}
          customerPrice={1095.65}
          sppPct={10}
        />
      )

      expect(
        screen.getByText(/СПП 10%/)
      ).toBeInTheDocument()
    })
  })

  describe('Copy Buttons', () => {
    it('should render copy button for minimum price', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      const copyButton = screen.getByRole('button', {
        name: 'Копировать минимальную цену',
      })
      expect(copyButton).toBeInTheDocument()
    })

    it('should render copy button for recommended price', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      const copyButton = screen.getByRole('button', {
        name: 'Копировать рекомендуемую цену',
      })
      expect(copyButton).toBeInTheDocument()
    })

    it('should render copy button for customer price when SPP > 0', () => {
      render(
        <PriceSummaryFooter
          {...defaultProps}
          customerPrice={1095.65}
          sppPct={10}
        />
      )

      const copyButton = screen.getByRole('button', {
        name: 'Копировать цену для покупателя',
      })
      expect(copyButton).toBeInTheDocument()
    })

    it('should render copy icon by default', () => {
      const { container } = render(<PriceSummaryFooter {...defaultProps} />)

      const copyIcons = container.querySelectorAll('.lucide-copy')
      expect(copyIcons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Styling', () => {
    it('should have data-testid attribute', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      expect(screen.getByTestId('price-summary-footer')).toBeInTheDocument()
    })

    it('should have double border on top', () => {
      const { container } = render(
        <PriceSummaryFooter {...defaultProps} />
      )

      const footer = container.querySelector('.border-double')
      expect(footer).toBeInTheDocument()
    })

    it('should highlight recommended price with primary color', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      const recPrice = screen.getByTestId('summary-recommended-price')
      expect(recPrice).toHaveClass('text-primary')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on copy buttons', () => {
      render(<PriceSummaryFooter {...defaultProps} />)

      const copyButtons = screen.getAllByRole('button')
      copyButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label')
      })
    })
  })
})
