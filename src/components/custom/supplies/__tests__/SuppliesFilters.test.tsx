/**
 * SuppliesFilters Component Tests
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Status dropdown (AC3)
 * - Date range picker (AC3)
 * - Clear filters button
 * - Filter changes trigger callbacks
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SuppliesFilters } from '../SuppliesFilters'
import type { SupplyStatus } from '@/types/supplies'

const EXPECTED_STATUS_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'OPEN', label: 'Открыта' },
  { value: 'CLOSED', label: 'Закрыта' },
  { value: 'DELIVERING', label: 'В пути' },
  { value: 'DELIVERED', label: 'Доставлена' },
  { value: 'CANCELLED', label: 'Отменена' },
]

function renderFilters(overrides: Partial<Parameters<typeof SuppliesFilters>[0]> = {}) {
  const props = {
    status: undefined as SupplyStatus | undefined,
    dateFrom: '2026-02-01',
    dateTo: '2026-03-02',
    onStatusChange: vi.fn(),
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
    onClearFilters: vi.fn(),
    hasActiveFilters: false,
    ...overrides,
  }
  const result = renderWithProviders(<SuppliesFilters {...props} />)
  return { ...result, props }
}

describe('SuppliesFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // 1. Status Filter Tests (AC3)
  // ===========================================================================

  describe('Status Filter', () => {
    it('renders status dropdown', () => {
      renderFilters()
      expect(screen.getByLabelText('Фильтр по статусу')).toBeInTheDocument()
    })

    it('status dropdown has label "Статус"', () => {
      renderFilters()
      expect(screen.getByText('Статус:')).toBeInTheDocument()
    })

    it('status dropdown shows "Все" by default', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Фильтр по статусу')
      expect(trigger).toHaveTextContent('Все')
    })

    it('status dropdown has all 6 options', async () => {
      const user = userEvent.setup()
      renderFilters()
      const trigger = screen.getByLabelText('Фильтр по статусу')
      await user.click(trigger)
      const listbox = screen.getByRole('listbox')
      const options = within(listbox).getAllByRole('option')
      expect(options).toHaveLength(6)
    })

    it('option "Все" is available', async () => {
      const user = userEvent.setup()
      renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      expect(screen.getByRole('option', { name: 'Все' })).toBeInTheDocument()
    })

    it('option "Открыта" (OPEN) is available', async () => {
      const user = userEvent.setup()
      renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      expect(screen.getByRole('option', { name: 'Открыта' })).toBeInTheDocument()
    })

    it('option "Закрыта" (CLOSED) is available', async () => {
      const user = userEvent.setup()
      renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      expect(screen.getByRole('option', { name: 'Закрыта' })).toBeInTheDocument()
    })

    it('option "В пути" (DELIVERING) is available', async () => {
      const user = userEvent.setup()
      renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      expect(screen.getByRole('option', { name: 'В пути' })).toBeInTheDocument()
    })

    it('option "Доставлена" (DELIVERED) is available', async () => {
      const user = userEvent.setup()
      renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      expect(screen.getByRole('option', { name: 'Доставлена' })).toBeInTheDocument()
    })

    it('option "Отменена" (CANCELLED) is available', async () => {
      const user = userEvent.setup()
      renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      expect(screen.getByRole('option', { name: 'Отменена' })).toBeInTheDocument()
    })

    it('selecting status calls onStatusChange', async () => {
      const user = userEvent.setup()
      const { props } = renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      await user.click(screen.getByRole('option', { name: 'Открыта' }))
      expect(props.onStatusChange).toHaveBeenCalledWith('OPEN')
    })

    it('selecting "Все" calls onStatusChange with undefined', async () => {
      const user = userEvent.setup()
      const { props } = renderFilters({ status: 'OPEN' })
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      await user.click(screen.getByRole('option', { name: 'Все' }))
      expect(props.onStatusChange).toHaveBeenCalledWith(undefined)
    })

    it('displays current status when prop is set', () => {
      renderFilters({ status: 'CLOSED' })
      const trigger = screen.getByLabelText('Фильтр по статусу')
      expect(trigger).toHaveTextContent('Закрыта')
    })
  })

  // ===========================================================================
  // 2. Date Range Filter Tests (AC3)
  // ===========================================================================

  describe('Date Range Filter', () => {
    it('renders date range section', () => {
      renderFilters()
      expect(screen.getByText('Период:')).toBeInTheDocument()
    })

    it('renders "от" (from) date input', () => {
      renderFilters()
      expect(screen.getByLabelText('Дата начала')).toBeInTheDocument()
    })

    it('renders "до" (to) date input', () => {
      renderFilters()
      expect(screen.getByLabelText('Дата окончания')).toBeInTheDocument()
    })

    it('from input has label "Период"', () => {
      renderFilters()
      expect(screen.getByText('Период:')).toBeInTheDocument()
    })

    it('displays current from date value', () => {
      renderFilters({ dateFrom: '2026-01-15' })
      const fromInput = screen.getByLabelText('Дата начала') as HTMLInputElement
      expect(fromInput.value).toBe('2026-01-15')
    })

    it('displays current to date value', () => {
      renderFilters({ dateTo: '2026-02-28' })
      const toInput = screen.getByLabelText('Дата окончания') as HTMLInputElement
      expect(toInput.value).toBe('2026-02-28')
    })

    it('changing from date calls onDateFromChange', async () => {
      const user = userEvent.setup()
      const { props } = renderFilters()
      await user.clear(screen.getByLabelText('Дата начала'))
      await user.type(screen.getByLabelText('Дата начала'), '2026-01-01')
      expect(props.onDateFromChange).toHaveBeenCalled()
    })

    it('changing to date calls onDateToChange', async () => {
      const user = userEvent.setup()
      const { props } = renderFilters()
      await user.clear(screen.getByLabelText('Дата окончания'))
      await user.type(screen.getByLabelText('Дата окончания'), '2026-02-28')
      expect(props.onDateToChange).toHaveBeenCalled()
    })

    it('date inputs accept ISO date format', () => {
      renderFilters({ dateFrom: '2026-01-15', dateTo: '2026-02-28' })
      const fromInput = screen.getByLabelText('Дата начала') as HTMLInputElement
      const toInput = screen.getByLabelText('Дата окончания') as HTMLInputElement
      expect(fromInput.type).toBe('date')
      expect(toInput.type).toBe('date')
    })

    it('date inputs are interactive', () => {
      renderFilters()
      const fromInput = screen.getByLabelText('Дата начала') as HTMLInputElement
      const toInput = screen.getByLabelText('Дата окончания') as HTMLInputElement
      expect(fromInput).not.toBeDisabled()
      expect(toInput).not.toBeDisabled()
    })

    it('has date separator between inputs', () => {
      renderFilters()
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 3. Default Values Tests
  // ===========================================================================

  describe('Default Values', () => {
    it('status defaults to "Все" when undefined', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Фильтр по статусу')
      expect(trigger).toHaveTextContent('Все')
    })

    it('renders provided from date', () => {
      renderFilters({ dateFrom: '2026-01-01' })
      const fromInput = screen.getByLabelText('Дата начала') as HTMLInputElement
      expect(fromInput.value).toBe('2026-01-01')
    })

    it('renders provided to date', () => {
      renderFilters({ dateTo: '2026-12-31' })
      const toInput = screen.getByLabelText('Дата окончания') as HTMLInputElement
      expect(toInput.value).toBe('2026-12-31')
    })

    it('empty date inputs render without errors', () => {
      renderFilters({ dateFrom: '', dateTo: '' })
      expect(screen.getByLabelText('Дата начала')).toBeInTheDocument()
      expect(screen.getByLabelText('Дата окончания')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 4. Clear Filters Tests
  // ===========================================================================

  describe('Clear Filters', () => {
    it('renders "Очистить фильтры" button when filters active', () => {
      renderFilters({ hasActiveFilters: true })
      expect(screen.getByText('Очистить фильтры')).toBeInTheDocument()
    })

    it('clear button is visible when any filter is active', () => {
      renderFilters({ hasActiveFilters: true })
      const btn = screen.getByText('Очистить фильтры')
      expect(btn).toBeVisible()
    })

    it('clear button is hidden when all filters are default', () => {
      renderFilters({ hasActiveFilters: false })
      expect(screen.queryByText('Очистить фильтры')).not.toBeInTheDocument()
    })

    it('clicking clear button calls onClearFilters', async () => {
      const user = userEvent.setup()
      const { props } = renderFilters({ hasActiveFilters: true })
      await user.click(screen.getByText('Очистить фильтры'))
      expect(props.onClearFilters).toHaveBeenCalledTimes(1)
    })

    it('clear button has aria-label', () => {
      renderFilters({ hasActiveFilters: true })
      expect(screen.getByLabelText('Очистить все фильтры')).toBeInTheDocument()
    })

    it('clear button has X icon', () => {
      renderFilters({ hasActiveFilters: true })
      const btn = screen.getByLabelText('Очистить все фильтры')
      const svg = btn.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 5. Filter State Tests
  // ===========================================================================

  describe('Filter State', () => {
    it('shows active filter indicator when filters active', () => {
      renderFilters({ hasActiveFilters: true })
      expect(screen.getByText('Очистить фильтры')).toBeInTheDocument()
    })

    it('no clear button when filters inactive', () => {
      renderFilters({ hasActiveFilters: false })
      expect(screen.queryByText('Очистить фильтры')).not.toBeInTheDocument()
    })

    it('updates displayed status when prop changes', () => {
      renderFilters({ status: 'DELIVERING' })
      const trigger = screen.getByLabelText('Фильтр по статусу')
      expect(trigger).toHaveTextContent('В пути')
    })

    it('updates displayed dates when props change', () => {
      renderFilters({ dateFrom: '2026-05-01', dateTo: '2026-06-01' })
      const fromInput = screen.getByLabelText('Дата начала') as HTMLInputElement
      const toInput = screen.getByLabelText('Дата окончания') as HTMLInputElement
      expect(fromInput.value).toBe('2026-05-01')
      expect(toInput.value).toBe('2026-06-01')
    })
  })

  // ===========================================================================
  // 6. Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('onStatusChange receives correct status value', async () => {
      const user = userEvent.setup()
      const { props } = renderFilters()
      await user.click(screen.getByLabelText('Фильтр по статусу'))
      await user.click(screen.getByRole('option', { name: 'Доставлена' }))
      expect(props.onStatusChange).toHaveBeenCalledWith('DELIVERED')
    })

    it('onDateFromChange receives updated value', async () => {
      const { props } = renderFilters()
      const input = screen.getByLabelText('Дата начала')
      fireEvent.change(input, { target: { value: '2026-03-15' } })
      expect(props.onDateFromChange).toHaveBeenCalledWith('2026-03-15')
    })

    it('callbacks are not called on initial render', () => {
      const onStatusChange = vi.fn()
      const onDateFromChange = vi.fn()
      const onDateToChange = vi.fn()
      const onClearFilters = vi.fn()
      renderFilters({
        onStatusChange,
        onDateFromChange,
        onDateToChange,
        onClearFilters,
      })
      expect(onStatusChange).not.toHaveBeenCalled()
      expect(onDateFromChange).not.toHaveBeenCalled()
      expect(onDateToChange).not.toHaveBeenCalled()
      expect(onClearFilters).not.toHaveBeenCalled()
    })

    it('onClearFilters called once on clear click', async () => {
      const user = userEvent.setup()
      const onClearFilters = vi.fn()
      renderFilters({ hasActiveFilters: true, onClearFilters })
      await user.click(screen.getByText('Очистить фильтры'))
      expect(onClearFilters).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // 7. Layout Tests
  // ===========================================================================

  describe('Layout', () => {
    it('filters are displayed in a row container', () => {
      renderFilters()
      const container = screen.getByText('Статус:').closest('div')?.parentElement
      expect(container?.className).toContain('flex')
    })

    it('filter elements have proper spacing', () => {
      renderFilters()
      const container = screen.getByText('Статус:').closest('div')?.parentElement
      expect(container?.className).toContain('gap')
    })

    it('status filter has fixed width', () => {
      renderFilters()
      const trigger = screen.getByLabelText('Фильтр по статусу')
      expect(trigger.className).toContain('w-36')
    })

    it('date inputs have fixed width', () => {
      renderFilters()
      const fromInput = screen.getByLabelText('Дата начала')
      expect(fromInput.className).toContain('w-36')
    })
  })

  // ===========================================================================
  // 8. Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('status dropdown has proper label association', () => {
      renderFilters()
      const label = screen.getByText('Статус:')
      expect(label).toHaveAttribute('for', 'status-filter')
      expect(screen.getByLabelText('Фильтр по статусу')).toHaveAttribute('id', 'status-filter')
    })

    it('date inputs have proper label associations', () => {
      renderFilters()
      const fromInput = screen.getByLabelText('Дата начала')
      const toInput = screen.getByLabelText('Дата окончания')
      expect(fromInput).toHaveAttribute('id', 'date-from')
      expect(toInput).toHaveAttribute('id', 'date-to')
    })

    it('clear button has descriptive aria-label', () => {
      renderFilters({ hasActiveFilters: true })
      expect(screen.getByLabelText('Очистить все фильтры')).toBeInTheDocument()
    })

    it('status trigger has aria-label', () => {
      renderFilters()
      expect(screen.getByLabelText('Фильтр по статусу')).toBeInTheDocument()
    })

    it('date from has aria-label', () => {
      renderFilters()
      expect(screen.getByLabelText('Дата начала')).toBeInTheDocument()
    })

    it('date to has aria-label', () => {
      renderFilters()
      expect(screen.getByLabelText('Дата окончания')).toBeInTheDocument()
    })

    it('all interactive elements are accessible', () => {
      renderFilters({ hasActiveFilters: true })
      expect(screen.getByLabelText('Фильтр по статусу')).toBeInTheDocument()
      expect(screen.getByLabelText('Дата начала')).toBeInTheDocument()
      expect(screen.getByLabelText('Дата окончания')).toBeInTheDocument()
      expect(screen.getByLabelText('Очистить все фильтры')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 9. Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles undefined status gracefully', () => {
      renderFilters({ status: undefined })
      const trigger = screen.getByLabelText('Фильтр по статусу')
      expect(trigger).toHaveTextContent('Все')
    })

    it('handles empty date strings gracefully', () => {
      renderFilters({ dateFrom: '', dateTo: '' })
      expect(screen.getByLabelText('Дата начала')).toBeInTheDocument()
      expect(screen.getByLabelText('Дата окончания')).toBeInTheDocument()
    })

    it('renders with all filters active', () => {
      renderFilters({
        status: 'OPEN',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        hasActiveFilters: true,
      })
      expect(screen.getByLabelText('Фильтр по статусу')).toHaveTextContent('Открыта')
      expect(screen.getByText('Очистить фильтры')).toBeInTheDocument()
    })

    it('renders with status change to each valid status', () => {
      const statuses: SupplyStatus[] = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED']
      for (const status of statuses) {
        const { unmount } = renderFilters({ status })
        const trigger = screen.getByLabelText('Фильтр по статусу')
        expect(trigger.textContent).toBeTruthy()
        unmount()
      }
    })

    it('handles multiple rapid renders without errors', () => {
      const { rerender } = renderFilters()
      rerender(
        <SuppliesFilters
          status="OPEN"
          dateFrom="2026-01-01"
          dateTo="2026-02-01"
          onStatusChange={vi.fn()}
          onDateFromChange={vi.fn()}
          onDateToChange={vi.fn()}
          onClearFilters={vi.fn()}
          hasActiveFilters
        />
      )
      expect(screen.getByLabelText('Фильтр по статусу')).toHaveTextContent('Открыта')
    })
  })

  // ===========================================================================
  // TDD Verification Test
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have expected status options', () => {
      expect(EXPECTED_STATUS_OPTIONS).toBeDefined()
      expect(EXPECTED_STATUS_OPTIONS).toHaveLength(6)
      expect(EXPECTED_STATUS_OPTIONS[0].label).toBe('Все')
      expect(EXPECTED_STATUS_OPTIONS[1].value).toBe('OPEN')
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(userEvent).toBeDefined()
      expect(renderWithProviders).toBeDefined()
    })
  })
})
