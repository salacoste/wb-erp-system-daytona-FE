/**
 * Unit tests for TwoLevelPriceHeader component
 * Story 44.22-FE: Hero Price Display Enhancement
 *
 * Tests visual enhancement features:
 * - Gradient background
 * - Ring effect styling
 * - Price gap indicator color coding (Green/Yellow/Red)
 * - Visual hierarchy (minimum/recommended/customer prices)
 * - Responsive font sizing
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TwoLevelPriceHeader } from '../TwoLevelPriceHeader'

describe('TwoLevelPriceHeader', () => {
  const defaultProps = {
    minimumPrice: 903.23,
    recommendedPrice: 1217.39,
    priceGap: { rub: 314.16, pct: 34.78 },
  }

  describe('Story 44.22-FE: Hero Price Display Enhancement', () => {
    describe('AC1: Enhanced Recommended Price Visual', () => {
      it('renders gradient background on hero section', () => {
        const { container } = render(<TwoLevelPriceHeader {...defaultProps} />)

        // Find the hero section (recommended price container)
        const heroSection = container.querySelector('.bg-gradient-to-br')
        expect(heroSection).toBeInTheDocument()
        expect(heroSection).toHaveClass('from-primary/10')
        expect(heroSection).toHaveClass('via-primary/5')
        expect(heroSection).toHaveClass('to-background')
      })

      it('renders ring effect on hero section', () => {
        const { container } = render(<TwoLevelPriceHeader {...defaultProps} />)

        const heroSection = container.querySelector('.ring-2')
        expect(heroSection).toBeInTheDocument()
        expect(heroSection).toHaveClass('ring-primary/20')
        expect(heroSection).toHaveClass('ring-offset-2')
      })

      it('renders shadow-lg on hero section', () => {
        const { container } = render(<TwoLevelPriceHeader {...defaultProps} />)

        const heroSection = container.querySelector('.shadow-lg')
        expect(heroSection).toBeInTheDocument()
      })

      it('renders responsive font sizes', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        const priceElement = screen.getByTestId('recommended-price')
        expect(priceElement).toHaveClass('text-4xl')
        expect(priceElement).toHaveClass('md:text-5xl')
      })

      it('renders drop-shadow on price text', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        const priceElement = screen.getByTestId('recommended-price')
        expect(priceElement).toHaveClass('drop-shadow-sm')
      })

      it('renders transition for animation', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        const priceElement = screen.getByTestId('recommended-price')
        expect(priceElement).toHaveClass('transition-all')
        expect(priceElement).toHaveClass('duration-300')
      })
    })

    describe('AC2: Price Value Emphasis', () => {
      it('renders currency symbol with lighter styling', () => {
        const { container } = render(<TwoLevelPriceHeader {...defaultProps} />)

        // Find the currency symbol span
        const currencySymbol = container.querySelector('.text-primary\\/70')
        expect(currencySymbol).toBeInTheDocument()
        expect(currencySymbol).toHaveClass('text-2xl')
        expect(currencySymbol).toHaveClass('font-normal')
      })

      it('renders "Целевая" badge on recommended price', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        expect(screen.getByText('Целевая')).toBeInTheDocument()
      })
    })

    describe('AC3: Price Gap Indicator Colors', () => {
      it('shows green indicator when gap > 20%', () => {
        const props = {
          ...defaultProps,
          priceGap: { rub: 314.16, pct: 25 },
        }
        const { container } = render(<TwoLevelPriceHeader {...props} />)

        const indicator = container.querySelector('[data-testid="price-gap-indicator"]')
        expect(indicator).toHaveClass('bg-green-50')
        expect(indicator).toHaveClass('text-green-700')
        expect(indicator).toHaveClass('border-green-200')
      })

      it('shows yellow indicator when gap is 10-20%', () => {
        const props = {
          ...defaultProps,
          priceGap: { rub: 150, pct: 15 },
        }
        const { container } = render(<TwoLevelPriceHeader {...props} />)

        const indicator = container.querySelector('[data-testid="price-gap-indicator"]')
        expect(indicator).toHaveClass('bg-yellow-50')
        expect(indicator).toHaveClass('text-yellow-700')
        expect(indicator).toHaveClass('border-yellow-200')
      })

      it('shows red indicator when gap < 10%', () => {
        const props = {
          ...defaultProps,
          priceGap: { rub: 50, pct: 5 },
        }
        const { container } = render(<TwoLevelPriceHeader {...props} />)

        const indicator = container.querySelector('[data-testid="price-gap-indicator"]')
        expect(indicator).toHaveClass('bg-red-50')
        expect(indicator).toHaveClass('text-red-700')
        expect(indicator).toHaveClass('border-red-200')
      })

      it('shows TrendingUp icon for gap > 10%', () => {
        const props = {
          ...defaultProps,
          priceGap: { rub: 200, pct: 20 },
        }
        const { container } = render(<TwoLevelPriceHeader {...props} />)

        // TrendingUp icon has lucide-trending-up class
        const icon = container.querySelector('.lucide-trending-up')
        expect(icon).toBeInTheDocument()
      })

      it('shows AlertTriangle icon for gap < 10%', () => {
        const props = {
          ...defaultProps,
          priceGap: { rub: 50, pct: 5 },
        }
        const { container } = render(<TwoLevelPriceHeader {...props} />)

        // AlertTriangle icon has lucide-triangle-alert class
        const icon = container.querySelector('.lucide-triangle-alert')
        expect(icon).toBeInTheDocument()
      })

      it('shows tight margin warning for gap < 10%', () => {
        const props = {
          ...defaultProps,
          priceGap: { rub: 50, pct: 5 },
        }
        render(<TwoLevelPriceHeader {...props} />)

        expect(screen.getByText(/низкий запас прибыльности/i)).toBeInTheDocument()
      })

      it('does not show tight margin warning for gap >= 10%', () => {
        const props = {
          ...defaultProps,
          priceGap: { rub: 200, pct: 15 },
        }
        render(<TwoLevelPriceHeader {...props} />)

        expect(screen.queryByText(/низкий запас прибыльности/i)).not.toBeInTheDocument()
      })
    })

    describe('AC4: Visual Hierarchy', () => {
      it('renders minimum price with muted styling', () => {
        const { container } = render(<TwoLevelPriceHeader {...defaultProps} />)

        const minPriceSection = container.querySelector('.bg-muted\\/30')
        expect(minPriceSection).toBeInTheDocument()
      })

      it('renders minimum price label', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        expect(screen.getByText('Минимальная цена')).toBeInTheDocument()
      })

      it('renders recommended price label', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        expect(screen.getByText('Рекомендуемая цена')).toBeInTheDocument()
      })

      it('renders minimum price value', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        const minPrice = screen.getByTestId('minimum-price')
        expect(minPrice).toHaveClass('text-2xl')
        expect(minPrice).toHaveClass('font-bold')
      })

      it('renders recommended price larger than minimum', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        const minPrice = screen.getByTestId('minimum-price')
        const recPrice = screen.getByTestId('recommended-price')

        // Recommended price should have larger font
        expect(recPrice).toHaveClass('text-4xl')
        expect(minPrice).toHaveClass('text-2xl')
      })
    })

    describe('AC5: Customer Price Display', () => {
      it('renders customer price when SPP > 0', () => {
        const props = {
          ...defaultProps,
          customerPrice: 1095.65,
          sppPct: 10,
        }
        render(<TwoLevelPriceHeader {...props} />)

        expect(screen.getByTestId('customer-price')).toBeInTheDocument()
        expect(screen.getByText('Цена для покупателя')).toBeInTheDocument()
        expect(screen.getByText('СПП -10%')).toBeInTheDocument()
      })

      it('does not render customer price when SPP = 0', () => {
        const props = {
          ...defaultProps,
          customerPrice: 1217.39,
          sppPct: 0,
        }
        render(<TwoLevelPriceHeader {...props} />)

        expect(screen.queryByTestId('customer-price')).not.toBeInTheDocument()
      })

      it('does not render customer price when not provided', () => {
        render(<TwoLevelPriceHeader {...defaultProps} />)

        expect(screen.queryByTestId('customer-price')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper data-testid attributes', () => {
      render(<TwoLevelPriceHeader {...defaultProps} />)

      expect(screen.getByTestId('two-level-price-header')).toBeInTheDocument()
      expect(screen.getByTestId('minimum-price')).toBeInTheDocument()
      expect(screen.getByTestId('recommended-price')).toBeInTheDocument()
      expect(screen.getByTestId('price-gap-indicator')).toBeInTheDocument()
    })

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<TwoLevelPriceHeader {...defaultProps} />)

      const icons = container.querySelectorAll('[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})
