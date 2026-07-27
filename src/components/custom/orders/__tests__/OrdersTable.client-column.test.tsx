/**
 * OrdersTable — Client column rendering tests (Story 86.2)
 * Covers AC #1 (column visible for Owner), AC #2 (hidden for non-Owner),
 * AC #3 (graceful "—" for missing PII), and tel: link with stopPropagation.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrdersTable } from '../OrdersTable'
import type { OrderFbsItem } from '@/types/orders'
import type { ClientInfoMap } from '@/types/orders-client-info'

const baseOrder: OrderFbsItem = {
  id: '00000000-0000-0000-0000-000000000100',
  orderId: '100',
  orderUid: 'uid-100',
  nmId: 12345,
  vendorCode: 'TEST-001',
  productName: 'Test Product',
  price: 1000,
  salePrice: 800,
  supplierStatus: 'new',
  wbStatus: 'waiting',
  warehouseId: 1,
  deliveryType: 'fbs',
  isB2B: false,
  cargoType: null,
  createdAt: '2026-04-06T10:00:00Z',
  statusUpdatedAt: '2026-04-06T11:00:00Z',
  operationalStatus: 'NEW',
  operationalStatusUpdatedAt: null,
}

const orders: OrderFbsItem[] = [
  baseOrder,
  { ...baseOrder, orderId: '200', nmId: 22222, productName: 'Product B' },
  { ...baseOrder, orderId: '300', nmId: 33333, productName: 'Product C' },
]

const baseProps = {
  orders,
  sortBy: 'created_at' as const,
  sortOrder: 'desc' as const,
  onSortChange: vi.fn(),
  onRowClick: vi.fn(),
}

describe('OrdersTable — Client column (Story 86.2)', () => {
  describe('AC #1 — Owner role: column visible', () => {
    it('renders the "Клиент" column header when showClientColumn is true', () => {
      render(<OrdersTable {...baseProps} showClientColumn />)
      expect(screen.getByRole('columnheader', { name: /клиент/i })).toBeInTheDocument()
    })

    it('renders client name and phone when present in map', () => {
      const clientInfoMap: ClientInfoMap = {
        '100': { orderId: 100, clientName: 'Иван И.', clientPhone: '+7999***1234' },
      }
      render(<OrdersTable {...baseProps} showClientColumn clientInfoMap={clientInfoMap} />)
      expect(screen.getByText('Иван И.')).toBeInTheDocument()
      expect(screen.getByText('+7999***1234')).toBeInTheDocument()
    })

    it('renders phone as a tel: link with aria-label and click-to-call', () => {
      const clientInfoMap: ClientInfoMap = {
        '100': { orderId: 100, clientName: 'Иван И.', clientPhone: '+79991234567' },
      }
      render(<OrdersTable {...baseProps} showClientColumn clientInfoMap={clientInfoMap} />)
      const link = screen.getByRole('link', { name: /позвонить клиенту/i })
      expect(link).toHaveAttribute('href', 'tel:+79991234567')
    })

    it('clicking the phone link does NOT trigger row onClick (stopPropagation)', () => {
      const onRowClick = vi.fn()
      const clientInfoMap: ClientInfoMap = {
        '100': { orderId: 100, clientName: 'Иван И.', clientPhone: '+79991234567' },
      }
      render(
        <OrdersTable
          {...baseProps}
          onRowClick={onRowClick}
          showClientColumn
          clientInfoMap={clientInfoMap}
        />
      )
      const link = screen.getByRole('link', { name: /позвонить клиенту/i })
      // jsdom schedules navigation for real anchor clicks unless the default action is cancelled.
      // Keep the component's React handler responsible for stopPropagation while preventing only
      // the unsupported test-environment navigation side effect.
      link.addEventListener('click', event => event.preventDefault())
      fireEvent.click(link)
      expect(onRowClick).not.toHaveBeenCalled()
    })
  })

  describe('AC #2 — non-Owner role: column hidden', () => {
    it('does NOT render the "Клиент" column header when showClientColumn is false', () => {
      render(<OrdersTable {...baseProps} showClientColumn={false} />)
      expect(screen.queryByRole('columnheader', { name: /клиент/i })).not.toBeInTheDocument()
    })

    it('does NOT render the "Клиент" column header by default (omitted prop)', () => {
      render(<OrdersTable {...baseProps} />)
      expect(screen.queryByRole('columnheader', { name: /клиент/i })).not.toBeInTheDocument()
    })

    it('does NOT render any client name/phone even if clientInfoMap is provided', () => {
      const clientInfoMap: ClientInfoMap = {
        '100': { orderId: 100, clientName: 'LEAKED_NAME', clientPhone: 'LEAKED_PHONE' },
      }
      render(<OrdersTable {...baseProps} showClientColumn={false} clientInfoMap={clientInfoMap} />)
      expect(screen.queryByText('LEAKED_NAME')).not.toBeInTheDocument()
      expect(screen.queryByText('LEAKED_PHONE')).not.toBeInTheDocument()
    })
  })

  describe('AC #3 — partial data graceful handling', () => {
    it('renders "—" for orders missing from the client info map', () => {
      const clientInfoMap: ClientInfoMap = {
        '100': { orderId: 100, clientName: 'Иван И.', clientPhone: '+71' },
        // 200 and 300 missing → both should show "—"
      }
      render(<OrdersTable {...baseProps} showClientColumn clientInfoMap={clientInfoMap} />)
      // Two orders have no client info → at least 2 dashes in client cells
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThanOrEqual(2)
    })

    it('renders "—" when ClientInfoItem exists but both name and phone are absent', () => {
      const clientInfoMap: ClientInfoMap = {
        '100': { orderId: 100 }, // no name, no phone
        '200': { orderId: 200 }, // no name, no phone
        '300': { orderId: 300 }, // no name, no phone
      }
      render(<OrdersTable {...baseProps} showClientColumn clientInfoMap={clientInfoMap} />)
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThanOrEqual(3)
    })

    it('renders only the available field when one of name/phone is missing', () => {
      const clientInfoMap: ClientInfoMap = {
        '100': { orderId: 100, clientName: 'Иван И.' }, // name only
        '200': { orderId: 200, clientPhone: '+79991234567' }, // phone only
      }
      render(<OrdersTable {...baseProps} showClientColumn clientInfoMap={clientInfoMap} />)
      expect(screen.getByText('Иван И.')).toBeInTheDocument()
      expect(screen.getByText('+79991234567')).toBeInTheDocument()
    })

    it('renders gracefully when clientInfoMap is undefined', () => {
      render(<OrdersTable {...baseProps} showClientColumn />)
      // Header still rendered
      expect(screen.getByRole('columnheader', { name: /клиент/i })).toBeInTheDocument()
      // All 3 rows show "—"
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThanOrEqual(3)
    })
  })
})
