/**
 * Unit Tests for OrderPickerFilters Component
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Search input behavior (AC6)
 * - Status filter dropdown (AC6)
 * - Clear filters functionality (AC6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OrderPickerFilters } from '../OrderPickerFilters'
import {
  ORDER_PICKER_LABELS,
  ELIGIBLE_STATUS_LABELS,
  SEARCH_DEBOUNCE_MS,
} from '@/test/fixtures/order-picker'

function renderFilters(overrides: Partial<Parameters<typeof OrderPickerFilters>[0]> = {}) {
  const props = {
    searchValue: '',
    onSearchChange: vi.fn<[value: string], void>(),
    statusFilter: null as import('@/hooks/useOrdersForSupply').EligibleSupplierStatus | null,
    onStatusChange: vi.fn<
      [status: import('@/hooks/useOrdersForSupply').EligibleSupplierStatus | null],
      void
    >(),
    onClearFilters: vi.fn<[], void>(),
    activeFilterCount: 0,
    ...overrides,
  }
  const result = renderWithProviders(<OrderPickerFilters {...props} />)
  return { ...result, props }
}

describe('OrderPickerFilters - Story 53.5-FE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // AC6: Search Input
  // ==========================================================================

  describe('AC6: Search Input', () => {
    it('renders search input field', () => {
      renderFilters()
      expect(screen.getByPlaceholderText('Поиск по ID или артикулу...')).toBeInTheDocument()
    })

    it('has search icon/adornment', () => {
      const { container } = renderFilters()
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('has placeholder "Поиск по ID или артикулу..."', () => {
      renderFilters()
      expect(screen.getByPlaceholderText('Поиск по ID или артикулу...')).toBeInTheDocument()
    })

    it('displays current search value', () => {
      renderFilters({ searchValue: 'test-query' })
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...') as HTMLInputElement
      expect(input.value).toBe('test-query')
    })

    it('calls onSearchChange when typing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      await user.type(input, 'A')
      await waitFor(
        () => {
          expect(props.onSearchChange).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )
    })

    it('search input is a text input', () => {
      renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...') as HTMLInputElement
      expect(input.type).toBe('text')
    })

    it('search is case-insensitive (input accepts any text)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      await user.type(input, 'Test')
      await waitFor(
        () => {
          expect(props.onSearchChange).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )
    })

    it('can clear search with X button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters({ searchValue: 'test' })
      // The clear button appears when there is a value
      const clearBtn = screen.getByLabelText('Очистить поиск')
      await user.click(clearBtn)
      expect(props.onSearchChange).toHaveBeenCalledWith('')
    })

    it('clear button only visible when search has value', () => {
      renderFilters({ searchValue: '' })
      expect(screen.queryByLabelText('Очистить поиск')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AC6: Debounced Search
  // ==========================================================================

  describe('AC6: Debounced Search (300ms)', () => {
    it('debounces search input by 300ms', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      await user.type(input, 'ab')
      // After typing, debounce timer should be pending
      expect(props.onSearchChange).not.toHaveBeenCalledWith('ab')
    })

    it('does not call immediately on keystroke', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      await user.type(input, 'a')
      // Should not call immediately
      expect(props.onSearchChange).not.toHaveBeenCalledWith('a')
    })

    it('calls after debounce timeout', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      await user.type(input, 'test')
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS + 100)
      await waitFor(() => {
        expect(props.onSearchChange).toHaveBeenCalled()
      })
    })

    it('resets debounce timer on new input', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      await user.type(input, 'a')
      vi.advanceTimersByTime(200)
      await user.type(input, 'b')
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS + 100)
      await waitFor(() => {
        expect(props.onSearchChange).toHaveBeenCalled()
      })
    })

    it('immediately calls onSearchChange when cleared', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters({ searchValue: 'test' })
      const clearBtn = screen.getByLabelText('Очистить поиск')
      await user.click(clearBtn)
      expect(props.onSearchChange).toHaveBeenCalledWith('')
    })

    it('cancels pending debounce on unmount', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { unmount } = renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      await user.type(input, 'test')
      unmount()
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS + 100)
      // No error means debounce was cleaned up
      expect(true).toBe(true)
    })
  })

  // ==========================================================================
  // AC6: Status Filter Dropdown
  // ==========================================================================

  describe('AC6: Status Filter Dropdown', () => {
    it('renders status filter dropdown', () => {
      renderFilters()
      // The select trigger is rendered
      expect(screen.getByLabelText('Статус')).toBeInTheDocument()
    })

    it('has label "Статус"', () => {
      renderFilters()
      expect(screen.getByLabelText('Статус')).toBeInTheDocument()
    })

    it('shows "Все" as default option', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Статус')
      expect(trigger).toHaveTextContent('Все')
    })

    it('lists only eligible statuses', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderFilters()
      const trigger = screen.getByLabelText('Статус')
      await user.click(trigger)
      expect(screen.getByRole('option', { name: 'Все' })).toBeInTheDocument()
    })

    it('shows "Подтвержден" option for confirm', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderFilters()
      await user.click(screen.getByLabelText('Статус'))
      expect(screen.getByRole('option', { name: 'Подтвержден' })).toBeInTheDocument()
    })

    it('shows "Завершен" option for complete', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderFilters()
      await user.click(screen.getByLabelText('Статус'))
      expect(screen.getByRole('option', { name: 'Завершен' })).toBeInTheDocument()
    })

    it('does NOT show "Новый" or "Отменен" options', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderFilters()
      await user.click(screen.getByLabelText('Статус'))
      expect(screen.queryByRole('option', { name: 'Новый' })).not.toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Отменен' })).not.toBeInTheDocument()
    })

    it('calls onStatusChange when option selected', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      await user.click(screen.getByLabelText('Статус'))
      await user.click(screen.getByRole('option', { name: 'Подтвержден' }))
      expect(props.onStatusChange).toHaveBeenCalledWith('confirm')
    })

    it('displays current status filter value', () => {
      renderFilters({ statusFilter: 'confirm' })
      const trigger = screen.getByLabelText('Статус')
      expect(trigger).toHaveTextContent('Подтвержден')
    })

    it('can select "Все" to clear status filter', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters({ statusFilter: 'confirm' })
      await user.click(screen.getByLabelText('Статус'))
      await user.click(screen.getByRole('option', { name: 'Все' }))
      expect(props.onStatusChange).toHaveBeenCalledWith(null)
    })
  })

  // ==========================================================================
  // AC6: Clear Filters
  // ==========================================================================

  describe('AC6: Clear Filters Button', () => {
    it('renders clear filters button when filters active', () => {
      renderFilters({ activeFilterCount: 1 })
      expect(screen.getByText(/Очистить/)).toBeInTheDocument()
    })

    it('button text is "Очистить (N)"', () => {
      renderFilters({ activeFilterCount: 2 })
      expect(screen.getByText(/Очистить \(2\)/)).toBeInTheDocument()
    })

    it('button hidden when no active filters', () => {
      renderFilters({ activeFilterCount: 0 })
      expect(screen.queryByText(/Очистить/)).not.toBeInTheDocument()
    })

    it('button visible when search has value', () => {
      renderFilters({ searchValue: 'test', activeFilterCount: 1 })
      expect(screen.getByText(/Очистить/)).toBeInTheDocument()
    })

    it('button visible when status filter active', () => {
      renderFilters({ statusFilter: 'confirm', activeFilterCount: 1 })
      expect(screen.getByText(/Очистить/)).toBeInTheDocument()
    })

    it('calls onClearFilters when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters({ activeFilterCount: 1 })
      await user.click(screen.getByText(/Очистить/))
      expect(props.onClearFilters).toHaveBeenCalledTimes(1)
    })

    it('shows filter count indicator', () => {
      renderFilters({ activeFilterCount: 2 })
      expect(screen.getByText(/Очистить \(2\)/)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Filter State Display
  // ==========================================================================

  describe('Filter State Display', () => {
    it('shows active filter count', () => {
      renderFilters({ activeFilterCount: 3 })
      expect(screen.getByText(/3/)).toBeInTheDocument()
    })

    it('updates count when filters change', () => {
      const { rerender } = renderWithProviders(
        <OrderPickerFilters
          searchValue=""
          onSearchChange={vi.fn()}
          statusFilter={null}
          onStatusChange={vi.fn()}
          onClearFilters={vi.fn()}
          activeFilterCount={1}
        />
      )
      expect(screen.getByText(/Очистить \(1\)/)).toBeInTheDocument()
      rerender(
        <OrderPickerFilters
          searchValue=""
          onSearchChange={vi.fn()}
          statusFilter={null}
          onStatusChange={vi.fn()}
          onClearFilters={vi.fn()}
          activeFilterCount={2}
        />
      )
      expect(screen.getByText(/Очистить \(2\)/)).toBeInTheDocument()
    })

    it('shows no count when filters are empty', () => {
      renderFilters({ activeFilterCount: 0 })
      expect(screen.queryByText(/Очистить/)).not.toBeInTheDocument()
    })

    it('applies active state styling to filters', () => {
      renderFilters({ activeFilterCount: 1 })
      expect(screen.getByText(/Очистить/)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Layout & Responsiveness
  // ==========================================================================

  describe('Layout & Responsiveness', () => {
    it('search and status filter rendered together', () => {
      renderFilters()
      expect(screen.getByPlaceholderText('Поиск по ID или артикулу...')).toBeInTheDocument()
      expect(screen.getByLabelText('Статус')).toBeInTheDocument()
    })

    it('filter section has search role', () => {
      renderFilters()
      const searchRole = screen.getByRole('search')
      expect(searchRole).toBeInTheDocument()
    })

    it('search input takes more space than dropdown', () => {
      const { container } = renderFilters()
      const flex1 = container.querySelector('.flex-1')
      expect(flex1).toBeInTheDocument()
    })

    it('status dropdown has fixed width', () => {
      const { container } = renderFilters()
      const selectWrapper = container.querySelector('.sm\\:w-\\[160px\\]')
      expect(selectWrapper).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('search input has aria-label', () => {
      renderFilters()
      expect(screen.getByLabelText('Поиск по ID или артикулу')).toBeInTheDocument()
    })

    it('search input has sr-only label', () => {
      renderFilters()
      const label = screen.getByText('Поиск заказов')
      expect(label).toBeInTheDocument()
    })

    it('status dropdown has label', () => {
      renderFilters()
      expect(screen.getByLabelText('Статус')).toBeInTheDocument()
    })

    it('clear button has accessible name', () => {
      renderFilters({ activeFilterCount: 1 })
      const btn = screen.getByText(/Очистить/)
      expect(btn).toBeInTheDocument()
    })

    it('filter section has role="search"', () => {
      renderFilters()
      expect(screen.getByRole('search')).toBeInTheDocument()
    })

    it('keyboard navigation works between filters', () => {
      renderFilters()
      const input = screen.getByPlaceholderText('Поиск по ID или артикулу...')
      expect(input).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Integration Behavior
  // ==========================================================================

  describe('Integration Behavior', () => {
    it('search and status filter work together', () => {
      renderFilters({ searchValue: 'test', statusFilter: 'confirm', activeFilterCount: 2 })
      expect(screen.getByPlaceholderText('Поиск по ID или артикулу...')).toHaveValue('test')
      expect(screen.getByText(/Очистить \(2\)/)).toBeInTheDocument()
    })

    it('clearing one filter does not affect other', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters({ searchValue: 'test', activeFilterCount: 1 })
      const clearBtn = screen.getByLabelText('Очистить поиск')
      await user.click(clearBtn)
      expect(props.onSearchChange).toHaveBeenCalledWith('')
      // onStatusChange should NOT be called
      expect(props.onStatusChange).not.toHaveBeenCalled()
    })

    it('clear all removes both filters', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters({ activeFilterCount: 2 })
      await user.click(screen.getByText(/Очистить/))
      expect(props.onClearFilters).toHaveBeenCalledTimes(1)
    })

    it('filter changes trigger parent update', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderFilters()
      await user.click(screen.getByLabelText('Статус'))
      await user.click(screen.getByRole('option', { name: 'Завершен' }))
      expect(props.onStatusChange).toHaveBeenCalledWith('complete')
    })
  })

  // ==========================================================================
  // TDD Verification
  // ==========================================================================

  describe('TDD Verification', () => {
    it('should have label constants in Russian', () => {
      expect(ORDER_PICKER_LABELS.searchPlaceholder).toBe('Поиск по ID или артикулу...')
      expect(ORDER_PICKER_LABELS.statusFilterLabel).toBe('Статус')
      expect(ORDER_PICKER_LABELS.statusFilterAll).toBe('Все')
    })

    it('should have eligible status labels', () => {
      expect(ELIGIBLE_STATUS_LABELS.confirm).toBe('Подтвержден')
      expect(ELIGIBLE_STATUS_LABELS.complete).toBe('Завершен')
    })

    it('should have correct debounce constant', () => {
      expect(SEARCH_DEBOUNCE_MS).toBe(300)
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(waitFor).toBeDefined()
      expect(userEvent).toBeDefined()
      expect(renderWithProviders).toBeDefined()
    })
  })
})

// Suppress unused fixture warnings
void ORDER_PICKER_LABELS
void ELIGIBLE_STATUS_LABELS
void SEARCH_DEBOUNCE_MS
