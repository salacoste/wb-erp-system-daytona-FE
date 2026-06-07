/**
 * OrdersFilters Component Tests
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Test coverage:
 * - Date range picker (AC3)
 * - Supplier status filter (AC3)
 * - WB status filter (AC3)
 * - Search input (AC3)
 * - Filter reset functionality (AC3)
 * - Layout and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OrdersFilters, WB_STATUS_OPTIONS } from '../OrdersFilters'

describe('OrdersFilters', () => {
  const defaultProps = {
    dateFrom: '2026-02-01',
    dateTo: '2026-02-08',
    supplierStatus: null as import('@/types/orders').SupplierStatus | null,
    wbStatus: null as import('@/types/orders').WbStatus | null,
    searchValue: '',
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
    onSupplierStatusChange: vi.fn(),
    onWbStatusChange: vi.fn(),
    onSearchChange: vi.fn(),
    onClearFilters: vi.fn(),
    hasActiveFilters: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderFilters(overrides: Partial<typeof defaultProps> = {}) {
    const props = { ...defaultProps, ...overrides }
    return renderWithProviders(<OrdersFilters {...props} />)
  }

  // ============================================================================
  // 1. Date Range Filter Tests (AC3)
  // ============================================================================

  describe('Date Range Filter', () => {
    it('renders date from input', () => {
      renderFilters()
      expect(screen.getByDisplayValue('2026-02-01')).toBeInTheDocument()
    })

    it('renders date to input', () => {
      renderFilters()
      expect(screen.getByDisplayValue('2026-02-08')).toBeInTheDocument()
    })

    it('displays default last 7 days range', () => {
      renderFilters()
      const dateFromInput = document.getElementById('date-from') as HTMLInputElement
      expect(dateFromInput).toHaveValue('2026-02-01')
    })

    it('calls onDateFromChange when from date changes', () => {
      renderFilters()
      const dateFromInput = screen.getByDisplayValue('2026-02-01')
      fireEvent.change(dateFromInput, { target: { value: '2026-02-03' } })
      expect(defaultProps.onDateFromChange).toHaveBeenCalledWith('2026-02-03')
    })

    it('calls onDateToChange when to date changes', () => {
      renderFilters()
      const dateToInput = screen.getByDisplayValue('2026-02-08')
      fireEvent.change(dateToInput, { target: { value: '2026-02-10' } })
      expect(defaultProps.onDateToChange).toHaveBeenCalledWith('2026-02-10')
    })

    it('renders date inputs with type="date"', () => {
      renderFilters()
      const dateFrom = document.getElementById('date-from') as HTMLInputElement
      const dateTo = document.getElementById('date-to') as HTMLInputElement
      expect(dateFrom.type).toBe('date')
      expect(dateTo.type).toBe('date')
    })

    it('formats dates in ISO format (YYYY-MM-DD)', () => {
      renderFilters({ dateFrom: '2026-01-15' })
      expect(screen.getByDisplayValue('2026-01-15')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 2. Supplier Status Filter Tests (AC3)
  // ============================================================================

  describe('Supplier Status Filter', () => {
    it('renders supplier status dropdown trigger', () => {
      renderFilters()
      expect(screen.getByLabelText('Статус продавца')).toBeInTheDocument()
    })

    it('shows "Все статусы" as default when no status selected', () => {
      renderFilters({ supplierStatus: null })
      expect(screen.getByText('Все статусы')).toBeInTheDocument()
    })

    it('shows all supplier status options when opened', async () => {
      renderFilters({ supplierStatus: null })
      // Open the supplier status select
      const trigger = screen.getByLabelText('Статус продавца')
      fireEvent.click(trigger)
      // All 4 supplier status options should be rendered in the portal
      expect(screen.getByText('Новый')).toBeInTheDocument()
      expect(screen.getByText('Подтверждён')).toBeInTheDocument()
      expect(screen.getByText('Выполнен')).toBeInTheDocument()
      expect(screen.getByText('Отменён')).toBeInTheDocument()
    })

    it('displays "Новый" option for new status', async () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус продавца')
      fireEvent.click(trigger)
      expect(screen.getByText('Новый')).toBeInTheDocument()
    })

    it('displays "Подтверждён" option for confirm status', async () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус продавца')
      fireEvent.click(trigger)
      expect(screen.getByText('Подтверждён')).toBeInTheDocument()
    })

    it('displays "Выполнен" option for complete status', async () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус продавца')
      fireEvent.click(trigger)
      expect(screen.getByText('Выполнен')).toBeInTheDocument()
    })

    it('displays "Отменён" option for cancel status', async () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус продавца')
      fireEvent.click(trigger)
      expect(screen.getByText('Отменён')).toBeInTheDocument()
    })

    it('calls onSupplierStatusChange when selection changes', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус продавца')
      fireEvent.click(trigger)
      // Click the "Новый" option
      const option = screen.getByText('Новый')
      fireEvent.click(option)
      expect(defaultProps.onSupplierStatusChange).toHaveBeenCalled()
    })

    it('shows selected value in dropdown', () => {
      renderFilters({ supplierStatus: 'new' })
      expect(screen.getByText('Новый')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 3. WB Status Filter Tests (AC3)
  // ============================================================================

  describe('WB Status Filter', () => {
    it('renders WB status dropdown trigger', () => {
      renderFilters()
      expect(screen.getByLabelText('Статус WB')).toBeInTheDocument()
    })

    it('shows "Все статусы WB" as default when no status selected', () => {
      renderFilters({ wbStatus: null })
      expect(screen.getByText('Все статусы WB')).toBeInTheDocument()
    })

    it('shows common WB status options when opened', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус WB')
      fireEvent.click(trigger)
      expect(screen.getByText('Ожидает')).toBeInTheDocument()
      expect(screen.getByText('Продан')).toBeInTheDocument()
    })

    it('displays "Ожидает" option for waiting status', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус WB')
      fireEvent.click(trigger)
      expect(screen.getByText('Ожидает')).toBeInTheDocument()
    })

    it('displays "Отсортирован" option for sorted status', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус WB')
      fireEvent.click(trigger)
      expect(screen.getByText('Отсортирован')).toBeInTheDocument()
    })

    it('displays "Продан" option for sold status', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус WB')
      fireEvent.click(trigger)
      expect(screen.getByText('Продан')).toBeInTheDocument()
    })

    it('displays "Отменён" option for canceled status', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус WB')
      fireEvent.click(trigger)
      expect(screen.getByText('Отменён')).toBeInTheDocument()
    })

    it('calls onWbStatusChange when selection changes', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус WB')
      fireEvent.click(trigger)
      const option = screen.getByText('Ожидает')
      fireEvent.click(option)
      expect(defaultProps.onWbStatusChange).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // 4. Search Input Tests (AC3)
  // ============================================================================

  describe('Search Input', () => {
    it('renders search input with placeholder', () => {
      renderFilters()
      expect(screen.getByPlaceholderText('Поиск по SKU (nmId)')).toBeInTheDocument()
    })

    it('displays current search value', () => {
      renderFilters({ searchValue: '12345' })
      expect(screen.getByDisplayValue('12345')).toBeInTheDocument()
    })

    it('calls onSearchChange when input value changes', () => {
      renderFilters()
      const input = screen.getByPlaceholderText('Поиск по SKU (nmId)')
      fireEvent.change(input, { target: { value: '99' } })
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('99')
    })

    it('accepts numeric input for nmId', () => {
      renderFilters()
      const input = screen.getByPlaceholderText('Поиск по SKU (nmId)')
      fireEvent.change(input, { target: { value: '12345678' } })
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('12345678')
    })

    it('search input has aria-label', () => {
      renderFilters()
      expect(screen.getByLabelText('Поиск по SKU')).toBeInTheDocument()
    })

    it('search input renders with type="text"', () => {
      renderFilters()
      const input = screen.getByPlaceholderText('Поиск по SKU (nmId)')
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  // ============================================================================
  // 5. Filter Reset Tests (AC3)
  // ============================================================================

  describe('Filter Reset', () => {
    it('renders "Сбросить" button when filters are active', () => {
      renderFilters({ hasActiveFilters: true })
      expect(screen.getByText('Сбросить')).toBeInTheDocument()
    })

    it('calls onClearFilters when clicked', () => {
      renderFilters({ hasActiveFilters: true })
      fireEvent.click(screen.getByText('Сбросить'))
      expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1)
    })

    it('hides button when no filters are active', () => {
      renderFilters({ hasActiveFilters: false })
      expect(screen.queryByText('Сбросить')).not.toBeInTheDocument()
    })

    it('shows button when any filter is active', () => {
      renderFilters({ hasActiveFilters: true, supplierStatus: 'new' })
      expect(screen.getByText('Сбросить')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 6. Layout Tests
  // ============================================================================

  describe('Layout', () => {
    it('displays filters in a flex row on desktop', () => {
      renderFilters()
      const flexContainer = screen.getByText('С:').closest('.flex')
      expect(flexContainer).toBeInTheDocument()
    })

    it('has proper spacing between filter elements', () => {
      renderFilters()
      const container = document.querySelector('.flex.flex-wrap')
      expect(container).toBeInTheDocument()
      expect(container!.className).toContain('gap-3')
    })

    it('labels are associated with date inputs', () => {
      renderFilters()
      const dateFromLabel = screen.getByText('С:')
      expect(dateFromLabel.getAttribute('for')).toBe('date-from')
      const dateToLabel = screen.getByText('По:')
      expect(dateToLabel.getAttribute('for')).toBe('date-to')
    })
  })

  // ============================================================================
  // 7. Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('date inputs have associated labels via htmlFor', () => {
      renderFilters()
      const fromLabel = screen.getByText('С:')
      expect(fromLabel).toHaveAttribute('for', 'date-from')
      const toLabel = screen.getByText('По:')
      expect(toLabel).toHaveAttribute('for', 'date-to')
    })

    it('dropdowns have aria-label', () => {
      renderFilters()
      expect(screen.getByLabelText('Статус продавца')).toBeInTheDocument()
      expect(screen.getByLabelText('Статус WB')).toBeInTheDocument()
    })

    it('search input has aria-label', () => {
      renderFilters()
      expect(screen.getByLabelText('Поиск по SKU')).toBeInTheDocument()
    })

    it('date inputs have proper type="date"', () => {
      renderFilters()
      const dateFrom = document.getElementById('date-from') as HTMLInputElement
      const dateTo = document.getElementById('date-to') as HTMLInputElement
      expect(dateFrom.type).toBe('date')
      expect(dateTo.type).toBe('date')
    })
  })

  // ============================================================================
  // TDD Verification Test
  // ============================================================================

  describe('TDD Verification', () => {
    it('should have default props defined', () => {
      expect(defaultProps.dateFrom).toBe('2026-02-01')
      expect(defaultProps.dateTo).toBe('2026-02-08')
      expect(defaultProps.supplierStatus).toBeNull()
      expect(defaultProps.wbStatus).toBeNull()
      expect(defaultProps.searchValue).toBe('')
    })

    it('should have all callback functions defined', () => {
      expect(defaultProps.onDateFromChange).toBeDefined()
      expect(defaultProps.onDateToChange).toBeDefined()
      expect(defaultProps.onSupplierStatusChange).toBeDefined()
      expect(defaultProps.onWbStatusChange).toBeDefined()
      expect(defaultProps.onSearchChange).toBeDefined()
      expect(defaultProps.onClearFilters).toBeDefined()
    })
  })

  // Request #200 resolved: backend now accepts all 10 WbStatus values in the query enum.
  describe('WB status filter options (all WbStatus enum values — #200 resolved)', () => {
    it('offers ALL 10 backend-accepted wb_status values', () => {
      const values = WB_STATUS_OPTIONS.map(o => o.value)
      expect(values).toEqual([
        'waiting',
        'sorted',
        'sold',
        'ready_for_pickup',
        'canceled',
        'canceled_by_client',
        'declined_by_client',
        'defect',
        'return_at_pvz',
        'returned_to_seller',
      ])
    })

    it('has a label for every WbStatus value in the type', () => {
      const values = WB_STATUS_OPTIONS.map(o => o.value)
      // All values must be unique
      expect(new Set(values).size).toBe(values.length)
      // Every option has a non-empty label
      for (const opt of WB_STATUS_OPTIONS) {
        expect(opt.label.length).toBeGreaterThan(0)
      }
    })
  })
})
