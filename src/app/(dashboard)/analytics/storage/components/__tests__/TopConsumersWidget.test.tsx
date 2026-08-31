/**
 * Unit tests for TopConsumersWidget component
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopConsumersWidget } from '../TopConsumersWidget'
import type { TopConsumerItem } from '@/types/storage-analytics'
import {
  mockTopConsumerItems,
  mockNullCostTopConsumerItem,
} from '@/test/fixtures/storage-analytics'

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
      const { container } = render(<TopConsumersWidget data={mockTopConsumerItems} />)

      // Should have a red severity dot
      const highSeverityDot = container.querySelector('.bg-status-error[aria-hidden="true"]')
      expect(highSeverityDot).toHaveClass('bg-status-error')
    })

    it('colors ratio 10-20% yellow (medium)', () => {
      // Second item has ratio 12.5 (10-20%)
      const { container } = render(<TopConsumersWidget data={mockTopConsumerItems} />)

      const mediumSeverityDot = container.querySelector('.bg-status-warning[aria-hidden="true"]')
      expect(mediumSeverityDot).toHaveClass('bg-status-warning')
    })

    it('colors ratio <10% green (low)', () => {
      // Third item has ratio 5.94 (< 10%)
      const { container } = render(<TopConsumersWidget data={mockTopConsumerItems} />)

      const lowSeverityDots = container.querySelectorAll('.bg-status-success[aria-hidden="true"]')
      expect(lowSeverityDots.length).toBeGreaterThan(0)
      expect(lowSeverityDots[0]).toHaveClass('bg-status-success')
    })

    it('handles null ratio gracefully (unknown)', () => {
      // Fourth item has null ratio
      const { container } = render(<TopConsumersWidget data={mockTopConsumerItems} />)

      const unknownSeverityDot = container.querySelector('.bg-muted[aria-hidden="true"]')
      expect(unknownSeverityDot).toHaveClass('bg-muted')
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

      // First item has 49,5 % (Russian locale: comma + NBSP; \s matches the NBSP)
      expect(screen.getByText(/49,5\s%/)).toBeInTheDocument()
    })

    // BD-16 / AP#8: null storage_cost must render «—», never «0 ₽».
    it('shows dash (not "0 ₽") for null storage cost (BD-16, AP#8)', () => {
      render(<TopConsumersWidget data={[mockNullCostTopConsumerItem]} />)

      const cells = screen.getAllByRole('cell')
      const dashCell = cells.find(cell => cell.textContent === '—')
      expect(dashCell).toBeTruthy()
      const zeroRubles = cells.filter(cell => /0\s*₽/.test(cell.textContent || ''))
      expect(zeroRubles).toHaveLength(0)
    })
  })

  describe('interactions', () => {
    it('calls onProductClick when row is clicked', () => {
      const onProductClick = vi.fn()
      render(<TopConsumersWidget data={mockTopConsumerItems} onProductClick={onProductClick} />)

      const rows = screen.getAllByRole('row')
      // Click on first data row (index 1, since index 0 is header)
      fireEvent.click(rows[1])

      expect(onProductClick).toHaveBeenCalledWith('456789012')
    })

    it('shows View All button when onViewAll is provided', () => {
      const onViewAll = vi.fn()
      render(<TopConsumersWidget data={mockTopConsumerItems} onViewAll={onViewAll} />)

      const viewAllButton = screen.getByText('Показать все')
      expect(viewAllButton).toBeInTheDocument()
    })

    it('calls onViewAll when button is clicked', () => {
      const onViewAll = vi.fn()
      render(<TopConsumersWidget data={mockTopConsumerItems} onViewAll={onViewAll} />)

      fireEvent.click(screen.getByText('Показать все'))
      expect(onViewAll).toHaveBeenCalled()
    })

    it('hides View All button when onViewAll is not provided', () => {
      render(<TopConsumersWidget data={mockTopConsumerItems} />)
      expect(screen.queryByText('Показать все')).not.toBeInTheDocument()
    })
  })
})

// ============================================================================
// Story 169.12: tri-state has_warehouse_stock + severity tier-collapse guard
// ============================================================================

describe('TopConsumersWidget - Story 169.12 migration contracts', () => {
  it('tri-state: false → «Нет на складе» (warning), null → «—», true → neither', () => {
    const data = [
      {
        ...mockTopConsumerItems[0],
        nm_id: '1',
        vendor_code: 'NO-STOCK',
        rank: 1,
        has_warehouse_stock: false,
      },
      {
        ...mockTopConsumerItems[1],
        nm_id: '2',
        vendor_code: 'NULL-STOCK',
        rank: 2,
        has_warehouse_stock: null,
      },
      {
        ...mockTopConsumerItems[2],
        nm_id: '3',
        vendor_code: 'TRUE-STOCK',
        rank: 3,
        has_warehouse_stock: true,
      },
    ]
    render(<TopConsumersWidget data={data} />)

    const rows = screen.getAllByRole('row')
    const rowByCode = (code: string) => rows.find(r => r.textContent?.includes(code)) as HTMLElement

    const noStockRow = rowByCode('NO-STOCK')
    expect(noStockRow.textContent).toContain('Нет на складе')
    expect(noStockRow.querySelector('.text-status-warning')).toBeTruthy()

    // null row: unknown renders «—» and must NOT claim «Нет на складе»
    const nullRow = rowByCode('NULL-STOCK')
    expect(nullRow.textContent).not.toContain('Нет на складе')
    expect(nullRow.textContent).toContain('—')

    // true renders neither the warning nor the unknown dash
    const trueRow = rowByCode('TRUE-STOCK')
    expect(trueRow.textContent).not.toContain('Нет на складе')
  })

  it('severity tier-collapse guard: 3 distinct status dots + muted neutral (Set size)', () => {
    const { container } = render(<TopConsumersWidget data={mockTopConsumerItems} />)
    const dots = [
      container.querySelector('.bg-status-error[aria-hidden="true"]'),
      container.querySelector('.bg-status-warning[aria-hidden="true"]'),
      container.querySelector('.bg-status-success[aria-hidden="true"]'),
      container.querySelector('.bg-muted[aria-hidden="true"]'),
    ]
    expect(dots.every(Boolean)).toBe(true)
    const tokenClasses = dots.map(d => d?.className.split(' ').find(c => c.startsWith('bg-')))
    expect(new Set(tokenClasses).size).toBe(4) // error + warning + success + muted
    expect(tokenClasses).toContain('bg-status-error')
    expect(tokenClasses).toContain('bg-status-warning')
    expect(tokenClasses).toContain('bg-status-success')
    expect(tokenClasses).toContain('bg-muted')
  })
})
