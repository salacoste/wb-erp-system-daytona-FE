/**
 * Unit Tests for SupplyOrdersTable component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Tests cover:
 * - Table structure and semantic elements
 * - Column headers
 * - Order data display (ID, product, price, status, date)
 * - Remove button visibility based on supply status
 * - Empty state rendering
 * - Row click and keyboard navigation
 * - Remove order dialog flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test/utils/test-utils'
import {
  mockSupplyOrder,
  mockSupplyOrder2,
  mockSupplyOrderNoName,
  createMockSupplyOrders,
} from '@/test/fixtures/supplies'

import { SupplyOrdersTable } from '../SupplyOrdersTable'

import type { SupplyOrder, SupplyStatus } from '@/types/supplies'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTable(
  overrides: Partial<{
    orders: SupplyOrder[]
    supplyId: string
    status: SupplyStatus
    onRemoveOrder: (ids: string[], onSuccess: () => void) => void
    onOrderClick: (order: SupplyOrder) => void
    isRemoving: boolean
  }> = {}
) {
  const props = {
    orders: [mockSupplyOrder, mockSupplyOrder2, mockSupplyOrderNoName],
    supplyId: 'supply-001',
    status: 'OPEN' as SupplyStatus,
    onRemoveOrder: vi.fn(),
    onOrderClick: vi.fn(),
    isRemoving: false,
    ...overrides,
  }
  return {
    ...renderWithProviders(<SupplyOrdersTable {...props} />),
    props,
  }
}

/** Query the rendered table element; returns null if empty state is shown. */
function getTable(): HTMLTableElement | null {
  return document.querySelector('table')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SupplyOrdersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // 1. Table Structure
  // ===========================================================================

  describe('Table Structure', () => {
    it('renders a table element when orders are present', () => {
      renderTable()
      const table = getTable()
      expect(table).toBeInTheDocument()
    })

    it('renders a table header row', () => {
      renderTable()
      const headerRows = within(getTable()!)
        .getAllByRole('row')
        .filter(row => row.querySelector('[scope]') !== null || row.closest('thead') !== null)
      expect(headerRows.length).toBeGreaterThanOrEqual(1)
    })

    it('renders correct number of data rows', () => {
      renderTable()
      const bodyRows = getTable()!.querySelectorAll('tbody tr')
      expect(bodyRows).toHaveLength(3)
    })

    it('table element exists with native <table> tag', () => {
      renderTable()
      const table = getTable()
      expect(table).toBeInTheDocument()
      expect(table!.tagName).toBe('TABLE')
    })

    it('column headers are rendered as <th> elements', () => {
      renderTable()
      const thElements = getTable()!.querySelectorAll('thead th')
      expect(thElements.length).toBeGreaterThanOrEqual(5)
    })
  })

  // ===========================================================================
  // 2. Column Headers
  // ===========================================================================

  describe('Column Headers', () => {
    it('renders "ID заказа" column header', () => {
      renderTable()
      expect(screen.getByText('ID заказа')).toBeInTheDocument()
    })

    it('renders "Товар" column header', () => {
      renderTable()
      expect(screen.getByText('Товар')).toBeInTheDocument()
    })

    it('renders "Цена" column header', () => {
      renderTable()
      expect(screen.getByText('Цена')).toBeInTheDocument()
    })

    it('renders "Статус" column header', () => {
      renderTable()
      expect(screen.getByText('Статус')).toBeInTheDocument()
    })

    it('renders "Добавлен" column header', () => {
      renderTable()
      expect(screen.getByText('Добавлен')).toBeInTheDocument()
    })

    it('renders empty action column header when status is OPEN', () => {
      renderTable({ status: 'OPEN' })
      const headers = within(getTable()!).getAllByRole('columnheader')
      // 5 named + 1 empty action = 6
      expect(headers).toHaveLength(6)
    })

    it('hides action column header for non-OPEN statuses', () => {
      renderTable({ status: 'CLOSED' })
      const headers = within(getTable()!).getAllByRole('columnheader')
      // 5 named columns only
      expect(headers).toHaveLength(5)
    })
  })

  // ===========================================================================
  // 3. Order Data Display
  // ===========================================================================

  describe('Order Data Display', () => {
    it('displays order ID in each row', () => {
      renderTable()
      expect(screen.getByText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('1234567891')).toBeInTheDocument()
      expect(screen.getByText('1234567892')).toBeInTheDocument()
    })

    it('displays vendorCode for each order', () => {
      renderTable()
      expect(screen.getByText('SKU-ABC-001')).toBeInTheDocument()
      expect(screen.getByText('SKU-DEF-002')).toBeInTheDocument()
      expect(screen.getByText('SKU-GHI-003')).toBeInTheDocument()
    })

    it('displays product name when present', () => {
      renderTable()
      expect(screen.getByText('Test Product Name')).toBeInTheDocument()
      expect(screen.getByText('Another Product')).toBeInTheDocument()
    })

    it('displays "—" when productName is null', () => {
      renderTable()
      // mockSupplyOrderNoName has productName: null
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('displays price formatted with currency', () => {
      renderTable()
      // formatCurrency(1200) contains "1 200" and "₽"
      const cells = screen.getAllByText(/₽/)
      expect(cells.length).toBeGreaterThanOrEqual(3)
    })

    it('displays supplier status badge with Russian label', () => {
      renderTable()
      // mockSupplyOrder + mockSupplyOrderNoName both inherit 'confirm' → 'Подтверждён'
      expect(screen.getAllByText('Подтверждён')).toHaveLength(2)
      expect(screen.getByText('Готов')).toBeInTheDocument()
    })

    it('displays addedAt date formatted', () => {
      renderTable()
      // formatDateTime renders a formatted date; verify the date cell is present
      const table = getTable()!
      const dateCells = within(table)
        .getAllByRole('cell')
        .filter(
          cell =>
            cell.textContent?.includes('.') && cell.classList.contains('text-muted-foreground')
        )
      expect(dateCells.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ===========================================================================
  // 4. Remove Button (OPEN Status)
  // ===========================================================================

  describe('Remove Button (OPEN Status)', () => {
    it('shows remove button per row when status is OPEN', () => {
      renderTable({ status: 'OPEN' })
      const removeButtons = screen.getAllByRole('button', { name: /Удалить заказ/ })
      expect(removeButtons).toHaveLength(3)
    })

    it('remove button has trash icon (svg)', () => {
      renderTable({ status: 'OPEN' })
      const btn = screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`)
      const svg = btn.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('remove button opens confirmation dialog on click', async () => {
      const user = userEvent.setup()
      renderTable({ status: 'OPEN' })
      const btn = screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`)
      await user.click(btn)
      expect(screen.getByText('Удалить заказ?')).toBeInTheDocument()
    })

    it('remove button is disabled while removal is pending', () => {
      renderTable({ status: 'OPEN', isRemoving: true })
      const btn = screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`)
      expect(btn).toBeDisabled()
    })

    it('all remove buttons are disabled while removal is pending', () => {
      renderTable({ status: 'OPEN', isRemoving: true })
      const buttons = screen.getAllByRole('button', { name: /Удалить заказ/ })
      buttons.forEach(btn => {
        expect(btn).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // 5. Remove Button Hidden (Non-OPEN Statuses)
  // ===========================================================================

  describe('Remove Button Hidden', () => {
    const nonOpenStatuses: SupplyStatus[] = ['CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED']

    nonOpenStatuses.forEach(status => {
      it(`hides remove button when status is ${status}`, () => {
        renderTable({ status })
        expect(screen.queryByRole('button', { name: /Удалить заказ/ })).not.toBeInTheDocument()
      })
    })

    it('action column not rendered for non-OPEN statuses', () => {
      renderTable({ status: 'CLOSED' })
      const headers = within(getTable()!).getAllByRole('columnheader')
      // 5 named columns only — no action column
      expect(headers).toHaveLength(5)
    })
  })

  // ===========================================================================
  // 6. Empty State
  // ===========================================================================

  describe('Empty State', () => {
    it('shows empty state when orders array is empty', () => {
      renderTable({ orders: [] })
      expect(getTable()).toBeNull()
      expect(screen.getByText('В поставке пока нет заказов')).toBeInTheDocument()
    })

    it('empty state has Package icon', () => {
      renderTable({ orders: [] })
      const icon = document.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('empty state container spans full width', () => {
      renderTable({ orders: [] })
      const container = screen.getByText('В поставке пока нет заказов').closest('.rounded-lg')
      expect(container).toBeInTheDocument()
    })

    it('shows helper text when status is OPEN and no orders', () => {
      renderTable({ orders: [], status: 'OPEN' })
      expect(screen.getByText('Добавьте заказы, чтобы начать сборку поставки')).toBeInTheDocument()
    })

    it('hides helper text when status is not OPEN and no orders', () => {
      renderTable({ orders: [], status: 'CLOSED' })
      expect(
        screen.queryByText('Добавьте заказы, чтобы начать сборку поставки')
      ).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 7. Order actions
  // ===========================================================================

  describe('Order actions', () => {
    it('clicking the named detail button calls onOrderClick exactly once', async () => {
      const user = userEvent.setup()
      const { props } = renderTable({ status: 'OPEN' })
      await user.click(
        screen.getByRole('button', { name: `Открыть заказ ${mockSupplyOrder.orderId}` })
      )
      expect(props.onOrderClick).toHaveBeenCalledTimes(1)
      expect(props.onOrderClick).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: mockSupplyOrder.orderId })
      )
    })

    it('keeps the native row non-interactive and ignores clicks outside named actions', async () => {
      const user = userEvent.setup()
      const { props } = renderTable()
      const row = screen.getByText(mockSupplyOrder.orderId).closest('tr')!

      expect(row).not.toHaveClass('cursor-pointer')
      await user.click(screen.getByText(mockSupplyOrder.productName!))
      expect(props.onOrderClick).not.toHaveBeenCalled()
    })

    it('clicking remove button does not trigger row click', async () => {
      const user = userEvent.setup()
      const { props } = renderTable({ status: 'OPEN' })
      const btn = screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`)
      await user.click(btn)
      // onOrderClick should NOT have been called
      expect(props.onOrderClick).not.toHaveBeenCalled()
    })

    it.each(['{Enter}', ' '])(
      'pressing %s on a remove button opens the dialog without row navigation',
      async key => {
        const user = userEvent.setup()
        const { props } = renderTable({ status: 'OPEN' })
        const button = screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`)

        button.focus()
        await user.keyboard(key)

        expect(screen.getByRole('alertdialog', { name: 'Удалить заказ?' })).toBeInTheDocument()
        expect(props.onOrderClick).not.toHaveBeenCalled()
      }
    )

    it('Enter on the native order-detail button triggers onOrderClick exactly once', async () => {
      const user = userEvent.setup()
      const { props } = renderTable({ status: 'OPEN' })
      const button = screen.getByRole('button', {
        name: `Открыть заказ ${mockSupplyOrder.orderId}`,
      })
      button.focus()
      await user.keyboard('{Enter}')
      expect(props.onOrderClick).toHaveBeenCalledTimes(1)
      expect(props.onOrderClick).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: mockSupplyOrder.orderId })
      )
    })

    it('Space on the native order-detail button triggers onOrderClick exactly once', async () => {
      const user = userEvent.setup()
      const { props } = renderTable({ status: 'OPEN' })
      const button = screen.getByRole('button', {
        name: `Открыть заказ ${mockSupplyOrder.orderId}`,
      })
      button.focus()
      await user.keyboard(' ')
      expect(props.onOrderClick).toHaveBeenCalledTimes(1)
      expect(props.onOrderClick).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: mockSupplyOrder.orderId })
      )
    })
  })

  // ===========================================================================
  // 8. Remove Order Dialog Flow
  // ===========================================================================

  describe('Remove Order Dialog Flow', () => {
    it('confirming removal passes the order ID and a success callback', async () => {
      const user = userEvent.setup()
      const { props } = renderTable({ status: 'OPEN' })
      // Open dialog
      await user.click(screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`))
      // Confirm
      const confirmBtn = screen.getByRole('button', { name: 'Удалить' })
      await user.click(confirmBtn)
      expect(props.onRemoveOrder).toHaveBeenCalledWith(
        [mockSupplyOrder.orderId],
        expect.any(Function)
      )
    })

    it('keeps pending feedback mounted and closes with focus return only on success', async () => {
      const user = userEvent.setup()
      const onRemoveOrder = vi.fn()
      const { props, rerender } = renderTable({ status: 'OPEN', onRemoveOrder })
      const trigger = screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`)

      await user.click(trigger)
      await user.click(screen.getByRole('button', { name: 'Удалить' }))
      const onSuccess = onRemoveOrder.mock.calls[0][1]

      rerender(<SupplyOrdersTable {...props} isRemoving />)
      expect(screen.getByRole('alertdialog', { name: 'Удалить заказ?' })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Заказ удаляется из поставки')

      rerender(<SupplyOrdersTable {...props} isRemoving={false} />)
      expect(screen.getByRole('alertdialog', { name: 'Удалить заказ?' })).toBeInTheDocument()

      act(() => onSuccess())
      await waitFor(() => {
        expect(
          screen.queryByRole('alertdialog', { name: 'Удалить заказ?' })
        ).not.toBeInTheDocument()
        expect(trigger).toHaveFocus()
      })
    })

    it('cancelling removal does not call onRemoveOrder', async () => {
      const user = userEvent.setup()
      const { props } = renderTable({ status: 'OPEN' })
      await user.click(screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`))
      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      await user.click(cancelBtn)
      expect(props.onRemoveOrder).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // 9. Unknown Supplier Status
  // ===========================================================================

  describe('Unknown Supplier Status', () => {
    it('displays raw status string when status is unknown', () => {
      const unknownOrder: SupplyOrder = {
        ...mockSupplyOrder,
        orderId: 'unknown-status-order',
        supplierStatus: 'some_unknown_status',
      }
      renderTable({ orders: [unknownOrder] })
      expect(screen.getByText('some_unknown_status')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 10. Single Order
  // ===========================================================================

  describe('Single Order', () => {
    it('renders correctly with a single order', () => {
      renderTable({ orders: [mockSupplyOrder] })
      const bodyRows = getTable()!.querySelectorAll('tbody tr')
      expect(bodyRows).toHaveLength(1)
      expect(screen.getByText(mockSupplyOrder.orderId)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 11. Large Order List
  // ===========================================================================

  describe('Large Order List', () => {
    it('renders all orders when many are provided', () => {
      const manyOrders = createMockSupplyOrders(50)
      renderTable({ orders: manyOrders })
      const bodyRows = getTable()!.querySelectorAll('tbody tr')
      expect(bodyRows).toHaveLength(50)
    })
  })

  // ===========================================================================
  // 12. Accessibility
  // ===========================================================================

  describe('Accessibility', () => {
    it('remove buttons have descriptive aria-label', () => {
      renderTable({ status: 'OPEN' })
      const btn = screen.getByLabelText(`Удалить заказ ${mockSupplyOrder.orderId}`)
      expect(btn).toHaveAttribute('aria-label', `Удалить заказ ${mockSupplyOrder.orderId}`)
    })

    it('keeps native rows non-interactive and exposes a named detail button', () => {
      renderTable()
      const row = screen.getByText(mockSupplyOrder.orderId).closest('tr')!
      expect(row).not.toHaveAttribute('tabindex')
      expect(row).not.toHaveAttribute('role')
      expect(row).not.toHaveClass('cursor-pointer')
      expect(
        screen.getByRole('button', { name: `Открыть заказ ${mockSupplyOrder.orderId}` })
      ).toBeInTheDocument()
    })

    it('Package icon in empty state has aria-hidden', () => {
      renderTable({ orders: [] })
      const svg = document.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // ===========================================================================
  // 13. onOrderClick Optional
  // ===========================================================================

  describe('onOrderClick optional', () => {
    it('renders without error when onOrderClick is not provided', () => {
      const props = {
        orders: [mockSupplyOrder],
        supplyId: 'supply-001',
        status: 'OPEN' as SupplyStatus,
        onRemoveOrder: vi.fn(),
      }
      expect(() => renderWithProviders(<SupplyOrdersTable {...props} />)).not.toThrow()
      expect(screen.queryByRole('button', { name: /Открыть заказ/ })).not.toBeInTheDocument()
    })
  })
})
