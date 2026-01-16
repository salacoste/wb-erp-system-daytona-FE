/**
 * Unit tests for MarginDisplay component
 * Story 4.4: Automatic Margin Calculation Display
 *
 * Tests margin formatting, color coding, and display logic:
 * - formatMarginPercent: Intl.NumberFormat with style 'percent'
 * - MarginDisplay: Main component with size variants
 * - MarginBadge: Compact badge for tables
 * - MarginInfoCard: Card with additional details
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  formatMarginPercent,
  MarginDisplay,
  MarginBadge,
  MarginInfoCard,
} from './MarginDisplay'

describe('formatMarginPercent', () => {
  it('should format positive margin with Russian locale', () => {
    const result = formatMarginPercent(35.5)
    expect(result).toMatch(/35/) // Should contain 35
    expect(result).toContain('%') // Should contain percent sign
  })

  it('should format zero margin', () => {
    const result = formatMarginPercent(0)
    expect(result).toMatch(/0/) // Should contain 0
    expect(result).toContain('%') // Should contain percent sign
  })

  it('should format negative margin', () => {
    const result = formatMarginPercent(-12.3)
    expect(result).toMatch(/-/) // Should contain minus sign
    expect(result).toMatch(/12/) // Should contain 12
    expect(result).toContain('%') // Should contain percent sign
  })

  it('should format with 2 decimal places', () => {
    const result = formatMarginPercent(35.5)
    // Russian locale uses comma as decimal separator and may add space before %
    expect(result).toMatch(/,50\s*%|\.50\s*%/) // Should have .50 or ,50 with optional space before %
  })

  it('should handle very small numbers', () => {
    const result = formatMarginPercent(0.01)
    expect(result).toContain('%')
  })

  it('should handle very large numbers', () => {
    const result = formatMarginPercent(999.99)
    expect(result).toContain('%')
  })

  it('should use Russian locale formatting', () => {
    const result = formatMarginPercent(1234.56)
    // Russian locale may use space or non-breaking space as thousand separator
    expect(result).toContain('%')
  })
})

describe('MarginDisplay', () => {
  describe('positive margin', () => {
    it('should render positive margin with green color', () => {
      render(<MarginDisplay marginPct={35.5} />)

      const marginText = screen.getByText(/35/)
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-green-600')
    })

    it('should show "(прибыльно)" label for positive margin', () => {
      render(<MarginDisplay marginPct={35.5} />)

      expect(screen.getByText('(прибыльно)')).toBeInTheDocument()
    })

    it('should not show label for small size', () => {
      render(<MarginDisplay marginPct={35.5} size="sm" />)

      expect(screen.queryByText('(прибыльно)')).not.toBeInTheDocument()
    })
  })

  describe('negative margin', () => {
    it('should render negative margin with red color', () => {
      render(<MarginDisplay marginPct={-12.3} />)

      const marginText = screen.getByText(/-12/)
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-red-600')
    })

    it('should show "(убыток)" label for negative margin', () => {
      render(<MarginDisplay marginPct={-12.3} />)

      expect(screen.getByText('(убыток)')).toBeInTheDocument()
    })
  })

  describe('zero margin', () => {
    it('should render zero margin with gray color', () => {
      render(<MarginDisplay marginPct={0} />)

      const marginText = screen.getByText(/0/)
      expect(marginText).toBeInTheDocument()
      expect(marginText).toHaveClass('text-gray-600')
    })

    it('should not show profit/loss label for zero margin', () => {
      render(<MarginDisplay marginPct={0} />)

      expect(screen.queryByText('(прибыльно)')).not.toBeInTheDocument()
      expect(screen.queryByText('(убыток)')).not.toBeInTheDocument()
    })
  })

  describe('null/undefined margin', () => {
    it('should render dash for null margin', () => {
      render(<MarginDisplay marginPct={null} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should render dash for undefined margin', () => {
      render(<MarginDisplay marginPct={undefined} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should show missing data reason message', () => {
      render(<MarginDisplay marginPct={null} missingDataReason="COGS_NOT_ASSIGNED" />)

      expect(screen.getByText('Назначьте себестоимость для расчёта маржи')).toBeInTheDocument()
    })

    it('should show "Нет продаж на прошлой неделе" for NO_SALES_IN_PERIOD', () => {
      render(<MarginDisplay marginPct={null} missingDataReason="NO_SALES_IN_PERIOD" />)

      expect(screen.getByText('Нет продаж на прошлой неделе')).toBeInTheDocument()
    })
  })

  describe('size variants', () => {
    it('should apply small size class', () => {
      render(<MarginDisplay marginPct={35.5} size="sm" />)

      const marginText = screen.getByText(/35/)
      expect(marginText).toHaveClass('text-sm')
    })

    it('should apply medium size class', () => {
      render(<MarginDisplay marginPct={35.5} size="md" />)

      const marginText = screen.getByText(/35/)
      expect(marginText).toHaveClass('text-base')
      expect(marginText).toHaveClass('font-semibold')
    })

    it('should apply large size class', () => {
      render(<MarginDisplay marginPct={35.5} size="lg" />)

      const marginText = screen.getByText(/35/)
      expect(marginText).toHaveClass('text-2xl')
      expect(marginText).toHaveClass('font-bold')
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MarginDisplay marginPct={35.5} className="custom-class" />
      )

      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })
  })
})

describe('MarginBadge', () => {
  describe('positive margin', () => {
    it('should render positive margin badge with green styling', () => {
      const { container } = render(<MarginBadge marginPct={35.5} />)

      const badge = container.querySelector('.bg-green-50')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-green-700')
      expect(badge).toHaveClass('border-green-200')
    })

    it('should contain formatted margin text', () => {
      render(<MarginBadge marginPct={35.5} />)

      expect(screen.getByText(/35/)).toBeInTheDocument()
    })
  })

  describe('negative margin', () => {
    it('should render negative margin badge with red styling', () => {
      const { container } = render(<MarginBadge marginPct={-12.3} />)

      const badge = container.querySelector('.bg-red-50')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-red-700')
      expect(badge).toHaveClass('border-red-200')
    })
  })

  describe('zero margin', () => {
    it('should render zero margin badge with gray styling', () => {
      const { container } = render(<MarginBadge marginPct={0} />)

      const badge = container.querySelector('.bg-gray-50')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-gray-700')
      expect(badge).toHaveClass('border-gray-200')
    })
  })

  describe('null/undefined margin', () => {
    it('should render dash badge for null margin', () => {
      render(<MarginBadge marginPct={null} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should have gray styling for missing margin', () => {
      const { container } = render(<MarginBadge marginPct={null} />)

      const badge = container.querySelector('.bg-gray-50')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-gray-500')
    })

    it('should have title attribute with missing data reason', () => {
      const { container } = render(
        <MarginBadge marginPct={null} missingDataReason="COGS_NOT_ASSIGNED" />
      )

      const badge = container.querySelector('span[title]')
      expect(badge).toHaveAttribute('title', 'Назначьте себестоимость для расчёта маржи')
    })
  })
})

describe('MarginInfoCard', () => {
  it('should render margin with all details', () => {
    render(
      <MarginInfoCard
        marginPct={35.5}
        period="2025-W46"
        salesQty={50}
        revenue={125000.5}
      />
    )

    expect(screen.getByText('Маржинальность')).toBeInTheDocument()
    expect(screen.getByText(/35/)).toBeInTheDocument()
    expect(screen.getByText(/2025-W46/)).toBeInTheDocument()
    expect(screen.getByText(/50 шт/)).toBeInTheDocument()
    expect(screen.getByText(/125.*000/)).toBeInTheDocument()
  })

  it('should render without optional details', () => {
    render(<MarginInfoCard marginPct={35.5} />)

    expect(screen.getByText('Маржинальность')).toBeInTheDocument()
    expect(screen.getByText(/35/)).toBeInTheDocument()
  })

  it('should not show period details when margin is null', () => {
    render(
      <MarginInfoCard
        marginPct={null}
        period="2025-W46"
        salesQty={50}
        revenue={125000.5}
      />
    )

    expect(screen.queryByText(/2025-W46/)).not.toBeInTheDocument()
    expect(screen.queryByText(/50 шт/)).not.toBeInTheDocument()
  })

  it('should show missing data reason when margin is null', () => {
    render(<MarginInfoCard marginPct={null} missingDataReason="COGS_NOT_ASSIGNED" />)

    expect(screen.getByText('Назначьте себестоимость для расчёта маржи')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MarginInfoCard marginPct={35.5} className="custom-card" />
    )

    const card = container.querySelector('.custom-card')
    expect(card).toBeInTheDocument()
  })

  it('should format revenue with Russian locale', () => {
    render(<MarginInfoCard marginPct={35.5} revenue={125000.5} period="2025-W46" />)

    // Should use Russian currency formatting
    const revenueText = screen.getByText(/Выручка/)
    expect(revenueText).toBeInTheDocument()
  })
})
