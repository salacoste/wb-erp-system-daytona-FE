/**
 * Tests for AdvertisingFilters Component
 * Story 33.2-FE: Date Range Selector with 90-day limit
 */

import { render, screen } from '@testing-library/react'
import { format, subDays } from 'date-fns'
import { AdvertisingFilters } from '../AdvertisingFilters'
import { describe, it, expect, vi } from 'vitest'

describe('AdvertisingFilters', () => {
  const mockOnDateRangeChange = vi.fn()
  const mockOnViewByChange = vi.fn()

  const defaultProps = {
    dateRange: {
      from: '2025-12-10',
      to: '2025-12-23',
    },
    onDateRangeChange: mockOnDateRangeChange,
    viewBy: 'sku' as const,
    onViewByChange: mockOnViewByChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('90-day limit validation', () => {
    it('shows warning when range exceeds 90 days', () => {
      const from100DaysAgo = format(subDays(new Date(), 100), 'yyyy-MM-dd')
      const today = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      render(
        <AdvertisingFilters
          {...defaultProps}
          dateRange={{ from: from100DaysAgo, to: today }}
        />
      )

      expect(screen.getByText('Максимум 90 дней')).toBeInTheDocument()
    })

    it('does not show warning when range is within 90 days', () => {
      render(<AdvertisingFilters {...defaultProps} />)

      expect(screen.queryByText('Максимум 90 дней')).not.toBeInTheDocument()
    })

    it('does not show warning for exactly 90 days', () => {
      const from90DaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd')
      const today = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      render(
        <AdvertisingFilters
          {...defaultProps}
          dateRange={{ from: from90DaysAgo, to: today }}
        />
      )

      expect(screen.queryByText('Максимум 90 дней')).not.toBeInTheDocument()
    })
  })

  describe('Date inputs rendering', () => {
    it('renders from and to date inputs with correct values', () => {
      render(<AdvertisingFilters {...defaultProps} />)

      const fromInput = screen.getByLabelText('Дата начала периода') as HTMLInputElement
      const toInput = screen.getByLabelText('Дата окончания периода') as HTMLInputElement

      expect(fromInput.value).toBe('2025-12-10')
      expect(toInput.value).toBe('2025-12-23')
    })

    it('sets max attribute on to input to yesterday', () => {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      render(<AdvertisingFilters {...defaultProps} />)

      const toInput = screen.getByLabelText('Дата окончания периода') as HTMLInputElement

      expect(toInput.max).toBe(yesterday)
    })
  })

  describe('View mode tabs', () => {
    it('renders all view mode options', () => {
      render(<AdvertisingFilters {...defaultProps} />)

      expect(screen.getByText('По товарам')).toBeInTheDocument()
      expect(screen.getByText('По кампаниям')).toBeInTheDocument()
      expect(screen.getByText('По брендам')).toBeInTheDocument()
      expect(screen.getByText('По категориям')).toBeInTheDocument()
    })
  })
})
