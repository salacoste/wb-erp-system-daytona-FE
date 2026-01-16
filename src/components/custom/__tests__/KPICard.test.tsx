/**
 * Unit tests for KPICard component
 * Story 6.4-FE: Cabinet Summary Dashboard
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KPICard } from '../KPICard'

describe('KPICard', () => {
  describe('Value formatting', () => {
    it('should format currency values correctly', () => {
      render(<KPICard title="Revenue" value={1234567} format="currency" />)

      expect(screen.getByText('Revenue')).toBeInTheDocument()
      // Russian currency format uses non-breaking spaces
      expect(screen.getByText(/1.*234.*567/)).toBeInTheDocument()
    })

    it('should format percent values correctly', () => {
      render(<KPICard title="Margin" value={45.67} format="percent" />)

      expect(screen.getByText('45.7%')).toBeInTheDocument()
    })

    it('should format number values correctly', () => {
      render(<KPICard title="Count" value={12345} format="number" />)

      expect(screen.getByText(/12.*345/)).toBeInTheDocument()
    })

    it('should show dash for null values', () => {
      render(<KPICard title="Empty" value={null} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should show dash for undefined values', () => {
      render(<KPICard title="Empty" value={undefined} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('Trend indicators', () => {
    it('should show up trend icon with green color', () => {
      render(<KPICard title="Revenue" value={1000} trend="up" />)

      const trendIndicator = screen.getByRole('img', { name: /тренд: up/i })
      expect(trendIndicator).toBeInTheDocument()
      expect(trendIndicator).toHaveClass('text-green-600')
    })

    it('should show down trend icon with red color', () => {
      render(<KPICard title="Revenue" value={1000} trend="down" />)

      const trendIndicator = screen.getByRole('img', { name: /тренд: down/i })
      expect(trendIndicator).toBeInTheDocument()
      expect(trendIndicator).toHaveClass('text-red-600')
    })

    it('should show stable trend icon with gray color', () => {
      render(<KPICard title="Revenue" value={1000} trend="stable" />)

      const trendIndicator = screen.getByRole('img', { name: /тренд: stable/i })
      expect(trendIndicator).toBeInTheDocument()
      expect(trendIndicator).toHaveClass('text-gray-400')
    })

    it('should not show trend icon when trend is undefined', () => {
      render(<KPICard title="Revenue" value={1000} />)

      const trendIndicator = screen.queryByRole('img')
      expect(trendIndicator).not.toBeInTheDocument()
    })
  })

  describe('Loading state', () => {
    it('should show skeleton when loading', () => {
      render(<KPICard title="Revenue" value={1000} isLoading={true} />)

      // Title should still be visible
      expect(screen.getByText('Revenue')).toBeInTheDocument()

      // Value should not be visible when loading
      expect(screen.queryByText(/1.*000/)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible title', () => {
      render(<KPICard title="Total Revenue" value={50000} />)

      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    })

    it('should have trend aria-label', () => {
      render(<KPICard title="Revenue" value={1000} trend="up" />)

      expect(screen.getByLabelText(/тренд: up/i)).toBeInTheDocument()
    })
  })
})
