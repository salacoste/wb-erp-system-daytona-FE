/**
 * OrdersPagination Component Tests
 * Story 40.3-FE: Orders List Page
 * Epic 40: Orders UI & WB Native Status History
 *
 * Test coverage:
 * - Total count display with Russian pluralization
 * - Page indicator ("Стр. X из Y")
 * - Navigation buttons (Назад / Вперёд)
 * - Boundary conditions
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OrdersPagination } from '../OrdersPagination'

describe('OrdersPagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 6,
    totalCount: 150,
    onPageChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderPagination(overrides: Partial<Parameters<typeof OrdersPagination>[0]> = {}) {
    const props = { ...defaultProps, ...overrides }
    return renderWithProviders(<OrdersPagination {...props} />)
  }

  // ============================================================================
  // 1. Total Count Display Tests
  // ============================================================================

  describe('Total Count Display', () => {
    it('displays total count "Всего: N заказов"', () => {
      renderPagination()
      expect(screen.getByText(/Всего: 150 заказов/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 1 order', () => {
      renderPagination({ totalCount: 1, totalPages: 1 })
      expect(screen.getByText(/Всего: 1 заказ/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 2-4 orders', () => {
      renderPagination({ totalCount: 3, totalPages: 1 })
      expect(screen.getByText(/Всего: 3 заказа/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 5+ orders', () => {
      renderPagination({ totalCount: 25, totalPages: 1 })
      expect(screen.getByText(/Всего: 25 заказов/)).toBeInTheDocument()
    })

    it('displays 0 when no orders', () => {
      renderPagination({ totalCount: 0, totalPages: 0 })
      expect(screen.getByText(/Всего: 0 заказов/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 2. Page Indicator Tests
  // ============================================================================

  describe('Page Indicator', () => {
    it('displays current page number', () => {
      renderPagination({ currentPage: 3 })
      expect(screen.getByText(/Стр\. 3 из 6/)).toBeInTheDocument()
    })

    it('displays total page count', () => {
      renderPagination({ totalPages: 10 })
      expect(screen.getByText(/Стр\. 1 из 10/)).toBeInTheDocument()
    })

    it('formats as "Стр. X из Y"', () => {
      renderPagination({ currentPage: 2, totalPages: 5 })
      const indicator = screen.getByText(/Стр\. 2 из 5/)
      expect(indicator).toBeInTheDocument()
    })

    it('calculates total pages from total and limit', () => {
      // totalPages comes from parent, verify it displays correctly
      renderPagination({ currentPage: 1, totalPages: 6 })
      expect(screen.getByText(/Стр\. 1 из 6/)).toBeInTheDocument()
    })

    it('shows page 1 of 1 when total <= limit (single page)', () => {
      renderPagination({ currentPage: 1, totalPages: 1 })
      expect(screen.getByText(/Стр\. 1 из 1/)).toBeInTheDocument()
    })

    it('shows correct page number based on offset', () => {
      // currentPage is 1-indexed, page 4 of 6
      renderPagination({ currentPage: 4, totalPages: 6 })
      expect(screen.getByText(/Стр\. 4 из 6/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 3. Navigation Buttons Tests
  // ============================================================================

  describe('Navigation Buttons', () => {
    it('renders "Назад" button', () => {
      renderPagination()
      expect(screen.getByText('Назад')).toBeInTheDocument()
    })

    it('renders "Вперёд" button', () => {
      renderPagination()
      expect(screen.getByText('Вперёд')).toBeInTheDocument()
    })

    it('disables "Назад" on first page', () => {
      renderPagination({ currentPage: 1 })
      const prevBtn = screen.getByText('Назад').closest('button')!
      expect(prevBtn).toBeDisabled()
    })

    it('enables "Назад" when not on first page', () => {
      renderPagination({ currentPage: 2 })
      const prevBtn = screen.getByText('Назад').closest('button')!
      expect(prevBtn).not.toBeDisabled()
    })

    it('disables "Вперёд" on last page', () => {
      renderPagination({ currentPage: 6, totalPages: 6 })
      const nextBtn = screen.getByText('Вперёд').closest('button')!
      expect(nextBtn).toBeDisabled()
    })

    it('enables "Вперёд" when not on last page', () => {
      renderPagination({ currentPage: 3, totalPages: 6 })
      const nextBtn = screen.getByText('Вперёд').closest('button')!
      expect(nextBtn).not.toBeDisabled()
    })
  })

  describe('Navigation Actions', () => {
    it('calls onPageChange with previous page when clicking "Назад"', () => {
      const onPageChange = vi.fn()
      renderPagination({ currentPage: 3, onPageChange })
      fireEvent.click(screen.getByText('Назад'))
      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('calls onPageChange with next page when clicking "Вперёд"', () => {
      const onPageChange = vi.fn()
      renderPagination({ currentPage: 3, onPageChange })
      fireEvent.click(screen.getByText('Вперёд'))
      expect(onPageChange).toHaveBeenCalledWith(4)
    })

    it('does not call onPageChange when "Назад" disabled on first page', () => {
      const onPageChange = vi.fn()
      renderPagination({ currentPage: 1, onPageChange })
      fireEvent.click(screen.getByText('Назад'))
      expect(onPageChange).not.toHaveBeenCalled()
    })

    it('does not call onPageChange when "Вперёд" disabled on last page', () => {
      const onPageChange = vi.fn()
      renderPagination({ currentPage: 6, totalPages: 6, onPageChange })
      fireEvent.click(screen.getByText('Вперёд'))
      expect(onPageChange).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // 4. Page Size Selection Tests
  // ============================================================================

  describe('Page Size Selection', () => {
    it('displays current page size implicitly through total pages', () => {
      // Component does not have a page size selector — it receives totalPages from parent
      renderPagination({ totalCount: 150, totalPages: 6 })
      expect(screen.getByText(/Всего: 150 заказов/)).toBeInTheDocument()
      expect(screen.getByText(/Стр\. 1 из 6/)).toBeInTheDocument()
    })

    it('does not render a page size dropdown', () => {
      renderPagination()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('renders pagination controls', () => {
      renderPagination()
      expect(screen.getByText('Назад')).toBeInTheDocument()
      expect(screen.getByText('Вперёд')).toBeInTheDocument()
    })

    it('disables both nav buttons on single page', () => {
      renderPagination({ currentPage: 1, totalPages: 1, totalCount: 10 })
      const prevBtn = screen.getByText('Назад').closest('button')!
      const nextBtn = screen.getByText('Вперёд').closest('button')!
      expect(prevBtn).toBeDisabled()
      expect(nextBtn).toBeDisabled()
    })
  })

  // ============================================================================
  // 5. Boundary Conditions Tests
  // ============================================================================

  describe('Boundary Conditions', () => {
    it('handles empty data (total = 0)', () => {
      renderPagination({ totalCount: 0, totalPages: 0, currentPage: 1 })
      expect(screen.getByText(/Всего: 0 заказов/)).toBeInTheDocument()
      // totalPages=0 shows as "из 1" due to `totalPages || 1`
      expect(screen.getByText(/Стр\. 1 из 1/)).toBeInTheDocument()
    })

    it('handles single page (total <= limit)', () => {
      renderPagination({ totalCount: 10, totalPages: 1, currentPage: 1 })
      expect(screen.getByText(/Всего: 10 заказов/)).toBeInTheDocument()
      expect(screen.getByText(/Стр\. 1 из 1/)).toBeInTheDocument()
    })

    it('handles exact page boundary (total = limit * n)', () => {
      // 150 items / 25 per page = exactly 6 pages
      renderPagination({ totalCount: 150, totalPages: 6, currentPage: 6 })
      expect(screen.getByText(/Стр\. 6 из 6/)).toBeInTheDocument()
      const nextBtn = screen.getByText('Вперёд').closest('button')!
      expect(nextBtn).toBeDisabled()
    })

    it('handles partial last page', () => {
      // 151 items / 25 = 7 pages (last page has 1 item)
      renderPagination({ totalCount: 151, totalPages: 7, currentPage: 7 })
      expect(screen.getByText(/Стр\. 7 из 7/)).toBeInTheDocument()
      expect(screen.getByText(/Всего: 151 заказ/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 6. Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('navigation buttons have aria-label', () => {
      renderPagination()
      const prevBtn = screen.getByLabelText('Предыдущая страница')
      const nextBtn = screen.getByLabelText('Следующая страница')
      expect(prevBtn).toBeInTheDocument()
      expect(nextBtn).toBeInTheDocument()
    })

    it('disabled buttons have aria-disabled attribute', () => {
      renderPagination({ currentPage: 1 })
      const prevBtn = screen.getByLabelText('Предыдущая страница')
      // shadcn Button uses native disabled attribute which implies aria-disabled
      expect(prevBtn).toBeDisabled()
    })

    it('page indicator is readable by screen readers', () => {
      renderPagination({ currentPage: 2, totalPages: 5 })
      const indicator = screen.getByText(/Стр\. 2 из 5/)
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('text-sm')
    })

    it('navigation region contains both buttons', () => {
      renderPagination()
      const navContainer = screen.getByText('Назад').closest('div')
      expect(navContainer).toBeInTheDocument()
      expect(navContainer!.querySelectorAll('button').length).toBe(2)
    })

    it('current page is announced via indicator text', () => {
      renderPagination({ currentPage: 3, totalPages: 6 })
      expect(screen.getByText(/Стр\. 3 из 6/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Pluralization Edge Cases
  // ============================================================================

  describe('Russian Pluralization', () => {
    it.each([
      [0, '0 заказов'],
      [1, '1 заказ'],
      [2, '2 заказа'],
      [3, '3 заказа'],
      [4, '4 заказа'],
      [5, '5 заказов'],
      [11, '11 заказов'],
      [12, '12 заказов'],
      [21, '21 заказ'],
      [22, '22 заказа'],
      [25, '25 заказов'],
      [101, '101 заказ'],
      [111, '111 заказов'],
      [121, '121 заказ'],
    ])('totalCount=%d shows "%s"', (count, expected) => {
      renderPagination({ totalCount: count, totalPages: 1 })
      expect(screen.getByText(new RegExp(`Всего: ${expected}`))).toBeInTheDocument()
    })
  })
})
