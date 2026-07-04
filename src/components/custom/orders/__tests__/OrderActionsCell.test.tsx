/**
 * Story O2: OrderActionsCell component tests.
 * Verifies the confirm item is enabled only for NEW orders, fires onConfirm
 * with the order UUID, and the trigger disables while an action is pending.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OrderActionsCell } from '../OrderActionsCell'
import type { OrderFbsItem, OrderOperationalStatus } from '@/types/orders'

function makeOrder(operationalStatus: OrderOperationalStatus): OrderFbsItem {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    orderId: '12345',
    orderUid: 'order-uid-1',
    nmId: 10000001,
    vendorCode: 'VC-1',
    productName: 'Товар',
    price: 1000,
    salePrice: 900,
    supplierStatus: 'new',
    wbStatus: 'waiting',
    warehouseId: 1,
    deliveryType: 'fbs',
    isB2B: false,
    cargoType: 'MGT',
    createdAt: '2026-01-01T00:00:00Z',
    statusUpdatedAt: '2026-01-01T00:00:00Z',
    operationalStatus,
    operationalStatusUpdatedAt: null,
  }
}

describe('OrderActionsCell (Story O2)', () => {
  const onConfirm = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enables Подтвердить for a NEW order', async () => {
    const user = userEvent.setup()
    renderWithProviders(<OrderActionsCell order={makeOrder('NEW')} onConfirm={onConfirm} />)

    await user.click(screen.getByLabelText('Действия с заказом 12345'))
    expect(screen.getByTestId('order-confirm-12345')).not.toHaveAttribute('data-disabled')
  })

  it('disables Подтвердить for a non-NEW order (ASSEMBLED)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<OrderActionsCell order={makeOrder('ASSEMBLED')} onConfirm={onConfirm} />)

    await user.click(screen.getByLabelText('Действия с заказом 12345'))
    expect(screen.getByTestId('order-confirm-12345')).toHaveAttribute('data-disabled')
  })

  it('fires onConfirm with the order UUID when Подтвердить clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<OrderActionsCell order={makeOrder('NEW')} onConfirm={onConfirm} />)

    await user.click(screen.getByLabelText('Действия с заказом 12345'))
    await user.click(screen.getByText('Подтвердить'))

    expect(onConfirm).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })

  it('disables the trigger while an action is pending', () => {
    renderWithProviders(<OrderActionsCell order={makeOrder('NEW')} onConfirm={onConfirm} pending />)
    expect(screen.getByLabelText('Действия с заказом 12345')).toBeDisabled()
  })
})
