/**
 * Story O3: CancelOrderDialog component tests.
 * Verifies the confirm gate: confirming fires onCancel(uuid); dismissing
 * calls onClose without firing onCancel.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { CancelOrderDialog } from '../CancelOrderDialog'
import type { OrderFbsItem } from '@/types/orders'

const order: OrderFbsItem = {
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
  operationalStatus: 'NEW',
  operationalStatusUpdatedAt: null,
}

describe('CancelOrderDialog (Story O3)', () => {
  const onCancel = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fires onCancel with the UUID when «Отменить заказ» confirmed', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CancelOrderDialog order={order} open onCancel={onCancel} onClose={onClose} />
    )

    await user.click(screen.getByTestId('cancel-order-confirm'))

    expect(onCancel).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })

  it('calls onClose (not onCancel) when «Не отменять» dismissed', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CancelOrderDialog order={order} open onCancel={onCancel} onClose={onClose} />
    )

    await user.click(screen.getByTestId('cancel-order-dismiss'))

    expect(onCancel).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('renders the destructive confirm button disabled while pending', () => {
    renderWithProviders(
      <CancelOrderDialog order={order} open pending onCancel={onCancel} onClose={onClose} />
    )
    expect(screen.getByTestId('cancel-order-confirm')).toBeDisabled()
  })
})
