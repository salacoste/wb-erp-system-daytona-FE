/**
 * SuppliesTable Component Tests
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Table columns render correctly (AC4)
 * - Sorting by different columns (AC5)
 * - Row click navigates to detail (AC7)
 * - Status badges display correctly (AC8)
 * - Empty state display
 * - Accessibility requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  mockSupplyListItemOpen,
  mockSupplyListItemClosed,
  mockSupplyListItemDelivering,
  mockSupplyListItemDelivered,
  mockSupplyListItemCancelled,
} from '@/test/fixtures/supplies'
import { SuppliesTable } from '../SuppliesTable'
import type { SupplyListItem } from '@/types/supplies'

const mockSuppliesList: SupplyListItem[] = [
  mockSupplyListItemOpen,
  mockSupplyListItemClosed,
  mockSupplyListItemDelivering,
  mockSupplyListItemDelivered,
  mockSupplyListItemCancelled,
]

/** Helper: render table with default props */
function renderTable(overrides: Partial<Parameters<typeof SuppliesTable>[0]> = {}) {
  const props = {
    supplies: mockSuppliesList,
    onRowClick: vi.fn(),
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const,
    onSortChange: vi.fn(),
    ...overrides,
  }
  const result = renderWithProviders(<SuppliesTable {...props} />)
  return { ...result, props }
}

/** Helper: get the thead element */
function getTableHead() {
  return screen.getByRole('table').querySelector('thead')!
}

/** Helper: find a column header <th> by its text label */
function getColumnHeader(label: string) {
  const thead = getTableHead()
  const headers = within(thead).getAllByRole('columnheader')
  return headers.find(th => th.textContent?.includes(label))!
}

/** Helper: create a supply with a long name for truncation tests */
function supplyWithLongName(): SupplyListItem {
  return {
    ...mockSupplyListItemOpen,
    id: 'supply-long-name',
    name: 'Очень длинное название поставки которое превышает сорок символов и должно обрезаться',
  }
}

describe('SuppliesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes the live table with a stable accessible name', () => {
    renderTable()
    expect(screen.getByRole('table', { name: 'Поставки FBS' })).toBeInTheDocument()
  })

  // ============================================================================
  // 1. Column Headers Tests (AC4)
  // ============================================================================

  describe('Column Headers', () => {
    it('renders WB ID column header', () => {
      renderTable()
      expect(getColumnHeader('WB ID')).toBeInTheDocument()
    })

    it('renders Название column header', () => {
      renderTable()
      expect(getColumnHeader('Название')).toBeInTheDocument()
    })

    it('renders Статус column header', () => {
      renderTable()
      expect(getColumnHeader('Статус')).toBeInTheDocument()
    })

    it('renders Заказы column header', () => {
      renderTable()
      expect(getColumnHeader('Заказы')).toBeInTheDocument()
    })

    it('renders Сумма column header', () => {
      renderTable()
      expect(getColumnHeader('Сумма')).toBeInTheDocument()
    })

    it('renders Создана column header', () => {
      renderTable()
      expect(getColumnHeader('Создана')).toBeInTheDocument()
    })

    it('renders Закрыта column header', () => {
      renderTable()
      expect(getColumnHeader('Закрыта')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 2. Column Data Tests (AC4)
  // ============================================================================

  describe('Column Data', () => {
    it('displays WB Supply ID in first column', () => {
      renderTable()
      expect(screen.getByText('WB-SUPPLY-12345')).toBeInTheDocument()
    })

    it('WB Supply ID has monospace font', () => {
      renderTable()
      const cell = screen.getByText('WB-SUPPLY-12345')
      expect(cell.className).toContain('font-mono')
    })

    it('displays supply name in Name column', () => {
      renderTable()
      expect(screen.getByText('Поставка январь')).toBeInTheDocument()
    })

    it('truncates name at 40 characters', () => {
      const longNameSupply = supplyWithLongName()
      renderTable({ supplies: [longNameSupply] })
      const truncated = longNameSupply.name!.slice(0, 40) + '...'
      // Truncated text visible as clickable element
      expect(screen.getByText(truncated)).toBeInTheDocument()
    })

    it('renders tooltip trigger for truncated names', () => {
      const longNameSupply = supplyWithLongName()
      renderTable({ supplies: [longNameSupply] })
      const truncated = longNameSupply.name!.slice(0, 40) + '...'
      // The truncated text sits inside a <span class="cursor-help"> (tooltip trigger)
      const trigger = screen.getByText(truncated)
      expect(trigger.className).toContain('cursor-help')
    })

    it('displays "—" for null names', () => {
      renderTable({ supplies: [mockSupplyListItemDelivering] })
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12347/ })
      const cells = within(row).getAllByRole('cell')
      expect(cells[1].textContent).toBe('—')
    })

    it('displays status badge in Status column', () => {
      renderTable()
      expect(screen.getByText('Открыта')).toBeInTheDocument()
      // "Закрыта" appears as both header and badge; verify badge exists in tbody
      const tbody = screen.getByRole('table').querySelector('tbody')!
      expect(within(tbody as HTMLElement).getByText('Закрыта')).toBeInTheDocument()
    })

    it('displays orders count right-aligned', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      const cells = within(row).getAllByRole('cell')
      expect(cells[3].textContent).toBe('5')
      expect(cells[3].className).toContain('text-right')
    })

    it('displays total value formatted as currency', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      const cells = within(row).getAllByRole('cell')
      // formatCurrency(15000) produces "15 000 ₽" or similar with thin/narrow space
      expect(cells[4].textContent).toMatch(/15[\s   ]000/)
    })

    it('displays "—" when totalValue is undefined', () => {
      const noValueSupply: SupplyListItem = {
        ...mockSupplyListItemOpen,
        totalValue: undefined,
      }
      renderTable({ supplies: [noValueSupply] })
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      const cells = within(row).getAllByRole('cell')
      expect(cells[4].textContent).toBe('—')
    })

    it('displays created date in "dd.MM.yyyy HH:mm" format', () => {
      renderTable()
      // createdAt: '2026-01-15T08:00:00.000Z' → formatted via date-fns
      // Multiple rows may share date patterns; verify at least one exists
      const dateCells = screen.getAllByText(/15\.01\.2026/)
      expect(dateCells.length).toBeGreaterThanOrEqual(1)
    })

    it('displays closed date in "dd.MM.yyyy HH:mm" format', () => {
      renderTable()
      // CLOSED supply has closedAt: '2026-01-14T18:00:00.000Z'
      const dateCells = screen.getAllByText(/14\.01\.2026/)
      expect(dateCells.length).toBeGreaterThanOrEqual(1)
    })

    it('displays "—" for null closedAt', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      const cells = within(row).getAllByRole('cell')
      // closedAt is last cell (index 6), OPEN supply has closedAt: null
      expect(cells[6].textContent).toBe('—')
    })
  })

  // ============================================================================
  // 3. Sorting Tests (AC5)
  // ============================================================================

  describe('Sorting', () => {
    it('shows sort indicator on currently sorted column', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      const createdHeader = getColumnHeader('Создана')
      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('shows descending chevron when sortOrder is desc', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      const createdHeader = getColumnHeader('Создана')
      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('shows ascending chevron when sortOrder is asc', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'asc' })
      const createdHeader = getColumnHeader('Создана')
      expect(createdHeader).toHaveAttribute('aria-sort', 'ascending')
    })

    it('calls onSortChange when clicking sortable column header', async () => {
      const onSortChange = vi.fn()
      renderTable({ onSortChange })
      const user = userEvent.setup()

      await user.click(getColumnHeader('Создана'))
      expect(onSortChange).toHaveBeenCalledWith('created_at')
    })

    it('toggles sort order when clicking same column', async () => {
      const onSortChange = vi.fn()
      renderTable({ sortBy: 'created_at', sortOrder: 'desc', onSortChange })
      const user = userEvent.setup()

      await user.click(getColumnHeader('Создана'))
      expect(onSortChange).toHaveBeenCalledTimes(1)
      expect(onSortChange).toHaveBeenCalledWith('created_at')
    })

    it('changes sort column when clicking different column', async () => {
      const onSortChange = vi.fn()
      renderTable({ sortBy: 'created_at', sortOrder: 'desc', onSortChange })
      const user = userEvent.setup()

      await user.click(getColumnHeader('Заказы'))
      expect(onSortChange).toHaveBeenCalledWith('orders_count')
    })

    it('does not show sort indicator on non-sortable columns', () => {
      renderTable()
      const wbIdHeader = getColumnHeader('WB ID')
      expect(wbIdHeader).not.toHaveAttribute('aria-sort')
    })

    describe('Sortable columns', () => {
      it('created_at column is sortable', async () => {
        const onSortChange = vi.fn()
        renderTable({ onSortChange })
        const user = userEvent.setup()

        await user.click(getColumnHeader('Создана'))
        expect(onSortChange).toHaveBeenCalledWith('created_at')
      })

      it('closed_at column is sortable', async () => {
        const onSortChange = vi.fn()
        renderTable({ onSortChange })
        const user = userEvent.setup()

        await user.click(getColumnHeader('Закрыта'))
        expect(onSortChange).toHaveBeenCalledWith('closed_at')
      })

      it('orders_count column is sortable', async () => {
        const onSortChange = vi.fn()
        renderTable({ onSortChange })
        const user = userEvent.setup()

        await user.click(getColumnHeader('Заказы'))
        expect(onSortChange).toHaveBeenCalledWith('orders_count')
      })
    })

    describe('Non-sortable columns', () => {
      it('wbSupplyId column is not sortable', () => {
        renderTable()
        const header = getColumnHeader('WB ID')
        expect(header).not.toHaveAttribute('aria-sort')
        expect(header.className).not.toContain('cursor-pointer')
      })

      it('name column is not sortable', () => {
        renderTable()
        const header = getColumnHeader('Название')
        expect(header).not.toHaveAttribute('aria-sort')
      })

      it('status column is not sortable', () => {
        renderTable()
        const header = getColumnHeader('Статус')
        expect(header).not.toHaveAttribute('aria-sort')
      })

      it('totalValue column is not sortable', () => {
        renderTable()
        const header = getColumnHeader('Сумма')
        expect(header).not.toHaveAttribute('aria-sort')
      })
    })
  })

  // ============================================================================
  // 4. Row Interaction Tests (AC7)
  // ============================================================================

  describe('Row Interaction', () => {
    it('shows hover state on row', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      expect(row.className).toContain('hover:bg-muted/50')
    })

    it('calls onRowClick with supply id when clicking row', async () => {
      const onRowClick = vi.fn()
      renderTable({ onRowClick })
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /WB-SUPPLY-12345/ }))
      expect(onRowClick).toHaveBeenCalledWith(mockSupplyListItemOpen)
    })

    it('calls onRowClick when pressing Enter on focused row', () => {
      const onRowClick = vi.fn()
      renderTable({ onRowClick })

      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      fireEvent.keyDown(row, { key: 'Enter' })
      expect(onRowClick).toHaveBeenCalledWith(mockSupplyListItemOpen)
    })

    it('calls onRowClick when pressing Space on focused row', () => {
      const onRowClick = vi.fn()
      renderTable({ onRowClick })

      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      fireEvent.keyDown(row, { key: ' ' })
      expect(onRowClick).toHaveBeenCalledWith(mockSupplyListItemOpen)
    })

    it('makes rows focusable with tabindex', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      expect(row).toHaveAttribute('tabindex', '0')
    })

    it('has cursor pointer on rows', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      expect(row.className).toContain('cursor-pointer')
    })

    it('renders all supplies as rows', () => {
      renderTable()
      const rows = screen.getAllByRole('button')
      expect(rows).toHaveLength(5)
    })
  })

  // ============================================================================
  // 5. Status Badges Tests (AC8)
  // ============================================================================

  describe('Status Badges', () => {
    it('renders SupplyStatusBadge for each row', () => {
      renderTable()
      const tbody = screen.getByRole('table').querySelector('tbody')!
      expect(within(tbody as HTMLElement).getByText('Открыта')).toBeInTheDocument()
      expect(within(tbody as HTMLElement).getByText('Закрыта')).toBeInTheDocument()
      expect(within(tbody as HTMLElement).getByText('В пути')).toBeInTheDocument()
      expect(within(tbody as HTMLElement).getByText('Доставлена')).toBeInTheDocument()
      expect(within(tbody as HTMLElement).getByText('Отменена')).toBeInTheDocument()
    })

    it('displays correct status label in Russian', () => {
      renderTable({ supplies: [mockSupplyListItemOpen] })
      expect(screen.getByText('Открыта')).toBeInTheDocument()
    })

    it('applies correct color classes for OPEN status', () => {
      renderTable({ supplies: [mockSupplyListItemOpen] })
      const label = screen.getByText('Открыта')
      // Badge renders as <div class="...bg-status-information/10..."><Icon /><span>Открыта</span></div>
      const badge = label.parentElement!
      expect(badge.className).toContain('bg-status-information/10')
    })

    it('applies correct color classes for CLOSED status', () => {
      renderTable({ supplies: [mockSupplyListItemClosed] })
      // "Закрыта" appears in both header and badge — scope to tbody
      const tbody = screen.getByRole('table').querySelector('tbody')!
      const label = within(tbody as HTMLElement).getByText('Закрыта')
      const badge = label.parentElement!
      expect(badge.className).toContain('bg-status-warning')
    })

    it('applies correct color classes for DELIVERING status', () => {
      renderTable({ supplies: [mockSupplyListItemDelivering] })
      const label = screen.getByText('В пути')
      const badge = label.parentElement!
      expect(badge.className).toContain('bg-status-pending/10')
    })

    it('applies correct color classes for DELIVERED status', () => {
      renderTable({ supplies: [mockSupplyListItemDelivered] })
      const label = screen.getByText('Доставлена')
      const badge = label.parentElement!
      expect(badge.className).toContain('bg-status-success/10')
    })

    it('applies correct color classes for CANCELLED status', () => {
      renderTable({ supplies: [mockSupplyListItemCancelled] })
      const label = screen.getByText('Отменена')
      const badge = label.parentElement!
      expect(badge.className).toContain('bg-status-error/10')
    })

    it('displays icon for each status', () => {
      renderTable({ supplies: [mockSupplyListItemOpen] })
      const label = screen.getByText('Открыта')
      const badge = label.parentElement!
      const icon = badge.querySelector('svg[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 6. Mobile Responsive Tests (AC10)
  // ============================================================================

  describe('Mobile Responsive', () => {
    it('enables horizontal scroll on mobile viewport', () => {
      renderTable()
      const scrollContainer = screen.getByRole('table').closest('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('applies min-width to Name column', () => {
      renderTable()
      const nameHeader = getColumnHeader('Название')
      expect(nameHeader.className).toContain('min-w-[160px]')
    })

    it('wraps table in rounded border container', () => {
      renderTable()
      const container = screen.getByRole('table').closest('.rounded-md')
      expect(container).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 7. Empty State
  // ============================================================================

  describe('Empty State', () => {
    it('shows empty message when supplies array is empty', () => {
      renderTable({ supplies: [] })
      expect(screen.getByText('Нет поставок')).toBeInTheDocument()
    })

    it('hides table body when empty', () => {
      renderTable({ supplies: [] })
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('shows filtered empty message when hasFilters is true', () => {
      renderTable({ supplies: [], hasFilters: true })
      expect(screen.getByText('Нет поставок за выбранный период')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // 8. Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('table has proper role="table"', () => {
      renderTable()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('column headers have scope="col"', () => {
      renderTable()
      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBe(7)
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })

    it('sortable headers have aria-sort attribute', () => {
      renderTable({ sortBy: 'created_at', sortOrder: 'desc' })
      const createdHeader = getColumnHeader('Создана')
      expect(createdHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('rows have aria-label describing supply', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /Поставка WB-SUPPLY-12345/ })
      expect(row).toHaveAttribute('aria-label', 'Поставка WB-SUPPLY-12345')
    })

    it('rows are keyboard navigable', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      expect(row).toHaveAttribute('tabindex', '0')
      expect(row).toHaveAttribute('role', 'button')
    })

    it('focus is visible on focused rows', () => {
      renderTable()
      const row = screen.getByRole('button', { name: /WB-SUPPLY-12345/ })
      row.focus()
      expect(row).toHaveFocus()
    })
  })

  // ============================================================================
  // TDD Verification Test
  // ============================================================================

  describe('TDD Verification', () => {
    it('should have test fixtures ready', () => {
      expect(mockSuppliesList).toBeDefined()
      expect(mockSuppliesList.length).toBe(5)
      expect(mockSuppliesList[0]).toHaveProperty('id')
      expect(mockSuppliesList[0]).toHaveProperty('wbSupplyId')
      expect(mockSuppliesList[0]).toHaveProperty('status')
      expect(mockSuppliesList[0]).toHaveProperty('ordersCount')
    })

    it('should have all status types covered', () => {
      const statuses = mockSuppliesList.map(s => s.status)
      expect(statuses).toContain('OPEN')
      expect(statuses).toContain('CLOSED')
      expect(statuses).toContain('DELIVERING')
      expect(statuses).toContain('DELIVERED')
      expect(statuses).toContain('CANCELLED')
    })
  })
})
