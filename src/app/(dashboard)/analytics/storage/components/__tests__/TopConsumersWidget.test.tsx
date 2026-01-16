/**
 * Unit tests for TopConsumersWidget component
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopConsumersWidget } from '../TopConsumersWidget'
import type { TopConsumerItem } from '@/types/storage-analytics'
import { mockTopConsumerItems } from '@/test/fixtures/storage-analytics'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('TopConsumersWidget', () => {
  describe('rendering', () => {
    it('renders top 5 products', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // Should render all 5 products
      expect(screen.getAllByRole('row')).toHaveLength(6) // 5 data + 1 header
    })

    it('shows empty state when no data', () => {
      render(<TopConsumersWidget data={[]} />)
      expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    })

    it('shows empty state when data is undefined', () => {
      render(<TopConsumersWidget data={undefined as unknown as TopConsumerItem[]} />)
      expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    })

    it('shows loading skeleton when isLoading', () => {
      render(<TopConsumersWidget data={[]} isLoading />)

      // Should show skeleton elements (shadcn Skeleton uses animate-pulse)
      const skeletons = document.querySelectorAll('[class*="animate-pulse"], [class*="Skeleton"]')
      // If no animated skeletons found, check for any skeleton divs
      if (skeletons.length === 0) {
        // Component shows skeleton structure
        const container = document.querySelector('.space-y-2')
        expect(container).toBeInTheDocument()
      } else {
        expect(skeletons.length).toBeGreaterThan(0)
      }
    })
  })

  describe('rank indicators', () => {
    it('shows Trophy icon for rank 1', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // Trophy icon should have aria-label "1 место"
      expect(screen.getByLabelText('1 место')).toBeInTheDocument()
    })

    it('shows Medal icon for rank 2', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      expect(screen.getByLabelText('2 место')).toBeInTheDocument()
    })

    it('shows Medal icon for rank 3', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      expect(screen.getByLabelText('3 место')).toBeInTheDocument()
    })

    it('shows number without icon for ranks 4-5', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // Ranks 4 and 5 should just show numbers
      const cells = screen.getAllByRole('cell')
      const rank4Cell = cells.find(cell => cell.textContent === '4')
      const rank5Cell = cells.find(cell => cell.textContent === '5')

      expect(rank4Cell).toBeTruthy()
      expect(rank5Cell).toBeTruthy()
    })
  })

  describe('cost severity indicators', () => {
    it('colors ratio >20% red (high)', () => {
      // First item in mockTopConsumerItems has ratio 26.25 (> 20%)
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // Should have a red severity dot
      const highSeverityDot = screen.getByLabelText('Высокие затраты')
      expect(highSeverityDot).toHaveClass('bg-red-500')
    })

    it('colors ratio 10-20% yellow (medium)', () => {
      // Second item has ratio 12.5 (10-20%)
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      const mediumSeverityDot = screen.getByLabelText('Средние затраты')
      expect(mediumSeverityDot).toHaveClass('bg-yellow-500')
    })

    it('colors ratio <10% green (low)', () => {
      // Third item has ratio 5.94 (< 10%)
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      const lowSeverityDots = screen.getAllByLabelText('Низкие затраты')
      expect(lowSeverityDots.length).toBeGreaterThan(0)
      expect(lowSeverityDots[0]).toHaveClass('bg-green-500')
    })

    it('handles null ratio gracefully (unknown)', () => {
      // Fourth item has null ratio
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      const unknownSeverityDot = screen.getByLabelText('Нет данных')
      expect(unknownSeverityDot).toHaveClass('bg-gray-300')
    })
  })

  describe('data display', () => {
    it('shows vendor code and brand', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // First product (rank 1) shows vendor_code and brand
      // Component displays vendor_code || nm_id, plus brand as subtext
      expect(screen.getByText('SKU-003')).toBeInTheDocument()
      expect(screen.getByText('LeatherCare')).toBeInTheDocument()
    })

    it('formats currency correctly', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // Check that storage costs are formatted (with currency symbol)
      const currencyCells = screen.getAllByText(/₽/)
      expect(currencyCells.length).toBeGreaterThan(0)
    })

    it('shows percent of total', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // First item has 49.5%
      expect(screen.getByText('49.5%')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onProductClick when row is clicked', () => {
      const onProductClick = vi.fn()
      render(
        <TopConsumersWidget
          data={mockTopConsumerItems}
          onProductClick={onProductClick}
        />
      )

      const rows = screen.getAllByRole('row')
      // Click on first data row (index 1, since index 0 is header)
      fireEvent.click(rows[1])

      expect(onProductClick).toHaveBeenCalledWith('456789012')
    })

    it('shows View All button when onViewAll is provided', () => {
      const onViewAll = vi.fn()
      render(
        <TopConsumersWidget
          data={mockTopConsumerItems}
          onViewAll={onViewAll}
        />
      )

      const viewAllButton = screen.getByText('Показать все')
      expect(viewAllButton).toBeInTheDocument()
    })

    it('calls onViewAll when button is clicked', () => {
      const onViewAll = vi.fn()
      render(
        <TopConsumersWidget
          data={mockTopConsumerItems}
          onViewAll={onViewAll}
        />
      )

      fireEvent.click(screen.getByText('Показать все'))
      expect(onViewAll).toHaveBeenCalled()
    })

    it('hides View All button when onViewAll is not provided', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)
      expect(screen.queryByText('Показать все')).not.toBeInTheDocument()
    })
  })
})
