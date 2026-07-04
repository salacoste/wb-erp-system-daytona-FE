/**
 * OrdersTable Component Tests
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Test coverage:
 * - Table columns render correctly (AC4)
 * - Sorting by different columns (AC5)
 * - Row click triggers callback (AC7)
 * - Status badges display correctly (AC8)
 * - Mobile responsive behavior (AC10)
 * - Accessibility requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OrdersTable } from '../OrdersTable'
import {
  mockOrderFbsItem,
  mockOrderFbsItemConfirmed,
  mockOrderFbsItemCompleted,
} from '@/test/fixtures/orders'

const mockOrdersList = [mockOrderFbsItem, mockOrderFbsItemConfirmed, mockOrderFbsItemCompleted]

describe('OrdersTable', () => {
  const defaultProps = {
    orders: mockOrdersList,
    onRowClick: vi.fn(),
    sortBy: 'created_at' as import('../OrdersTable').SortField,
    sortOrder: 'desc' as import('../OrdersTable').SortOrder,
    onSortChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  type TableProps = {
    orders: import('@/types/orders').OrderFbsItem[]
    onRowClick: (order: import('@/types/orders').OrderFbsItem) => void
    sortBy: import('../OrdersTable').SortField
    sortOrder: import('../OrdersTable').SortOrder
    onSortChange: (field: import('../OrdersTable').SortField) => void
    hasFilters?: boolean
    onClearFilters?: () => void
  }

  function renderTable(overrides: Partial<TableProps> = {}) {
    const props = { ...defaultProps, ...overrides }
    return renderWithProviders(<OrdersTable {...props} />)
  }

  // ============================================================================
  // 1. Column Rendering Tests (AC4)
  // ============================================================================

  describe('Column Headers', () => {
    it('renders Order ID column header', () => {
      renderTable()
      expect(screen.getByText('ID заказа')).toBeInTheDocument()
    })

    it('renders Product column header', () => {
      renderTable()
      expect(screen.getByText('Товар')).toBeInTheDocument()
    })

    it('renders Price column header', () => {
      renderTable()
      expect(screen.getByText('Цена')).toBeInTheDocument()
    })

    it('renders Sale Price column header', () => {
      renderTable()
      expect(screen.getByText('Цена продажи')).toBeInTheDocument()
    })

    it('renders Supplier Status column header', () => {
      renderTable()
      expect(screen.getByText('Статус')).toBeInTheDocument()
    })

    it('renders WB Status column header', () => {
      renderTable()
      expect(screen.getByText('Статус WB')).toBeInTheDocument()
    })

    it('renders Created At column header', () => {
      renderTable()
      expect(screen.getByText('Создан')).toBeInTheDocument()
    })

    it('renders Updated At column header', () => {
      renderTable()
      expect(screen.getByText('Обновлён')).toBeInTheDocument()
    })
  })

  describe('Column Data', () => {
    it('displays order ID in first column', () => {
      renderTable()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
    })

    it('displays nmId (SKU) with link to /cogs page', () => {
      renderTable()
      // All 3 orders share nmId 12345678 (spread from base fixture)
      const links = screen.getAllByText('12345678')
      expect(links.length).toBeGreaterThan(0)
      expect(links[0].tagName).toBe('A')
      expect(links[0]).toHaveAttribute('href', '/cogs?search=12345678')
    })

    it('displays vendorCode', () => {
      renderTable()
      // All 3 orders share the same vendorCode
      const codes = screen.getAllByText('SKU-ABC-001')
      expect(codes.length).toBeGreaterThan(0)
    })

    it('displays product name for short names', () => {
      renderTable()
      // All 3 orders share the same productName
      const names = screen.getAllByText('Test Product Name')
      expect(names.length).toBeGreaterThan(0)
    })

    it('formats price with currency', () => {
      renderTable()
      // formatCurrency renders Russian locale: "1 500 ₽"
      const cells = screen.getAllByText(/1\s*500/)
      expect(cells.length).toBeGreaterThan(0)
    })

    it('formats sale price with currency', () => {
      renderTable()
      // formatCurrency renders Russian locale: "1 200 ₽"
      const cells = screen.getAllByText(/1\s*200/)
      expect(cells.length).toBeGreaterThan(0)
    })

    it('formats created date', () => {
      renderTable()
      // formatDateTime uses ru-RU locale with Moscow timezone
      const dateCells = screen.getAllByText(/04\.01\.2026/)
      expect(dateCells.length).toBeGreaterThan(0)
    })

    it('formats updated date', () => {
      renderTable()
      const dateCells = screen.getAllByText(/04\.01\.2026/)
      expect(dateCells.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // 2. Sorting Tests (AC5)
  // ============================================================================

  describe('Sorting', () => {
    it('shows sort indicator on created_at column by default', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      const createdHeader = screen.getByText('Создан').closest('th')
      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('shows descending sort when sortOrder is desc', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      const createdHeader = screen.getByText('Создан').closest('th')
      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('shows ascending sort when sortOrder is asc', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'asc' })
      const createdHeader = screen.getByText('Создан').closest('th')
      expect(createdHeader).toHaveAttribute('aria-sort', 'ascending')
    })

    it('calls onSortChange when clicking sortable column header', () => {
      renderTable()
      fireEvent.click(screen.getByText('Цена'))
      expect(defaultProps.onSortChange).toHaveBeenCalledWith('price')
    })

    it('calls onSortChange when clicking same column (toggle)', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      fireEvent.click(screen.getByText('Создан'))
      expect(defaultProps.onSortChange).toHaveBeenCalledWith('created_at')
    })

    it('calls onSortChange when clicking different column', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      fireEvent.click(screen.getByText('Цена'))
      expect(defaultProps.onSortChange).toHaveBeenCalledWith('price')
    })

    it('does not set aria-sort on non-sortable columns', () => {
      renderTable()
      const productHeader = screen.getByText('Товар').closest('th')
      expect(productHeader).not.toHaveAttribute('aria-sort')
    })

    describe('Sortable columns', () => {
      it('created_at column is sortable — has cursor-pointer', () => {
        renderTable()
        const header = screen.getByText('Создан').closest('th')
        expect(header!.className).toContain('cursor-pointer')
      })

      it('status_updated_at column is sortable — has cursor-pointer', () => {
        renderTable()
        const header = screen.getByText('Обновлён').closest('th')
        expect(header!.className).toContain('cursor-pointer')
      })

      it('price column is sortable — has cursor-pointer', () => {
        renderTable()
        const header = screen.getByText('Цена').closest('th')
        expect(header!.className).toContain('cursor-pointer')
      })

      it('sale_price column is sortable — has cursor-pointer', () => {
        renderTable()
        const header = screen.getByText('Цена продажи').closest('th')
        expect(header!.className).toContain('cursor-pointer')
      })
    })

    describe('Non-sortable columns', () => {
      it('orderId column is not sortable', () => {
        renderTable()
        const header = screen.getByText('ID заказа').closest('th')
        expect(header!.className).not.toContain('cursor-pointer')
      })

      it('product column is not sortable', () => {
        renderTable()
        const header = screen.getByText('Товар').closest('th')
        expect(header!.className).not.toContain('cursor-pointer')
      })

      it('supplierStatus column is not sortable', () => {
        renderTable()
        const header = screen.getByText('Статус').closest('th')
        expect(header!.className).not.toContain('cursor-pointer')
      })

      it('wbStatus column is not sortable', () => {
        renderTable()
        const header = screen.getByText('Статус WB').closest('th')
        expect(header!.className).not.toContain('cursor-pointer')
      })
    })
  })

  // ============================================================================
  // 3. Row Interaction Tests (AC7)
  // ============================================================================

  describe('Row Interaction', () => {
    it('renders rows with hover styling', () => {
      renderTable()
      const firstRow = screen.getByText('1234567890').closest('tr')
      expect(firstRow).toHaveClass('hover:bg-muted/50')
    })

    it('calls onRowClick with order data when clicking row', () => {
      renderTable()
      const firstRow = screen.getByText('1234567890').closest('tr')!
      fireEvent.click(firstRow)
      expect(defaultProps.onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: '1234567890' })
      )
    })

    it('calls onRowClick when activating the accessible open button with Enter', async () => {
      const user = userEvent.setup()
      renderTable()
      const openButton = screen.getByRole('button', { name: /Открыть заказ 1234567890/ })

      openButton.focus()
      await user.keyboard('{Enter}')

      expect(defaultProps.onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: '1234567890' })
      )
    })

    it('does not make data rows interactive containers with nested links', () => {
      renderTable()
      const firstRow = screen.getByText('1234567890').closest('tr')!
      expect(firstRow).not.toHaveAttribute('role', 'button')
      expect(firstRow).not.toHaveAttribute('tabindex')
    })

    it('has cursor pointer on rows', () => {
      renderTable()
      const firstRow = screen.getByText('1234567890').closest('tr')
      expect(firstRow).toHaveClass('cursor-pointer')
    })
  })

  // ============================================================================
  // 4. Status Badges Tests (AC8)
  // ============================================================================

  describe('Status Badges', () => {
    it('renders OrderStatusBadge for supplier status', () => {
      renderTable()
      // "Новый" is the label for supplierStatus='new'. The operational-status
      // badge (NEW) also renders "Новый" (Story O1), so scope to the supplier
      // badge via its yellow color class.
      const supplierBadges = screen
        .getAllByText('Новый')
        .filter(el => el.className.includes('text-yellow-700'))
      expect(supplierBadges).toHaveLength(1)
    })

    it('renders WB status badge', () => {
      renderTable()
      // "Ожидает сборки" is the label for wbStatus='waiting'
      expect(screen.getByText('Ожидает сборки')).toBeInTheDocument()
    })

    it('displays correct color for new supplier status (yellow)', () => {
      renderTable()
      // Story O1: operational NEW badge also shows "Новый"; filter by color.
      const badge = screen
        .getAllByText('Новый')
        .find(el => el.className.includes('text-yellow-700'))
      expect(badge?.className).toContain('text-yellow-700')
    })

    it('displays correct color for confirm supplier status (blue)', () => {
      renderTable()
      const badge = screen.getByText('Подтверждён')
      expect(badge.className).toContain('text-blue-700')
    })

    it('displays correct color for complete supplier status (green)', () => {
      renderTable()
      const badge = screen.getByText('Выполнен')
      expect(badge.className).toContain('text-green-700')
    })

    it('renders all three order rows', () => {
      renderTable()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('1234567891')).toBeInTheDocument()
      expect(screen.getByText('1234567892')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 5. Mobile Responsive Tests (AC10)
  // ============================================================================

  describe('Mobile Responsive', () => {
    it('enables horizontal scroll via overflow-x-auto', () => {
      renderTable()
      const scrollContainer = document.querySelector('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('applies minimum width to product column', () => {
      renderTable()
      const productHeader = screen.getByText('Товар').closest('th')
      expect(productHeader!.className).toContain('min-w-[200px]')
    })

    it('applies width classes to columns', () => {
      renderTable()
      const orderIdHeader = screen.getByText('ID заказа').closest('th')
      expect(orderIdHeader!.className).toContain('w-24')
    })

    it('table is wrapped in border container', () => {
      renderTable()
      const wrapper = document.querySelector('.rounded-md.border')
      expect(wrapper).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 6. Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('table has proper role="table"', () => {
      renderTable()
      expect(
        document.querySelector('[role="table"]') || document.querySelector('table')
      ).toBeInTheDocument()
    })

    it('column headers have scope="col"', () => {
      renderTable()
      const headers = document.querySelectorAll('th')
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })

    it('sortable headers have aria-sort attribute', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      const createdHeader = screen.getByText('Создан').closest('th')
      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('provides visible accessible buttons for opening order details', () => {
      renderTable()
      const openButton = screen.getByRole('button', { name: /Открыть заказ 1234567890/ })
      expect(openButton).toBeInTheDocument()
      expect(openButton).toBeVisible()
      expect(openButton).toHaveTextContent('Открыть')
    })

    it('keeps rows semantic to avoid nested-interactive violations', () => {
      renderTable()
      const row = screen.getByText('1234567890').closest('tr')!
      expect(row).not.toHaveAttribute('role', 'button')
      expect(row.querySelector('a[href="/cogs?search=12345678"]')).toBeInTheDocument()
    })

    it('sortable headers respond to click for sorting', () => {
      renderTable()
      const priceHeader = screen.getByText('Цена').closest('th')
      expect(priceHeader!.className).toContain('cursor-pointer')
    })
  })

  // ============================================================================
  // 7. Empty State
  // ============================================================================

  describe('Empty State', () => {
    it('renders empty state when no orders', () => {
      renderTable({ orders: [] })
      expect(screen.getByText('Нет заказов')).toBeInTheDocument()
    })

    it('shows filter clear button in empty state when hasFilters is true', () => {
      const onClearFilters = vi.fn()
      renderTable({ orders: [], hasFilters: true, onClearFilters })
      expect(screen.getByText('Сбросить фильтры')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // TDD Verification Test
  // ============================================================================

  describe('TDD Verification', () => {
    it('should have test fixtures ready', () => {
      expect(mockOrdersList).toBeDefined()
      expect(mockOrdersList.length).toBeGreaterThan(0)
      expect(mockOrdersList[0]).toHaveProperty('orderId')
      expect(mockOrdersList[0]).toHaveProperty('supplierStatus')
      expect(mockOrdersList[0]).toHaveProperty('wbStatus')
    })

    it('should have default props defined', () => {
      expect(defaultProps.orders).toBeDefined()
      expect(defaultProps.onRowClick).toBeDefined()
      expect(defaultProps.sortBy).toBe('created_at')
      expect(defaultProps.sortOrder).toBe('desc')
    })
  })
})
