/**
 * Story O4: EditOrderMetaDialog component tests.
 * Verifies validation (empty → save disabled), metaType select, and that save
 * fires onSave with the UUID + validated body.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { EditOrderMetaDialog } from '../EditOrderMetaDialog'
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

describe('EditOrderMetaDialog (Story O4)', () => {
  const onSave = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables Сохранить while the value is empty', () => {
    renderWithProviders(
      <EditOrderMetaDialog order={order} open onSave={onSave} onClose={onClose} />
    )
    expect(screen.getByTestId('order-meta-save')).toBeDisabled()
  })

  it('shows the empty-value validation message', () => {
    renderWithProviders(
      <EditOrderMetaDialog order={order} open onSave={onSave} onClose={onClose} />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Введите код маркировки')
  })

  it('enables Сохранить and fires onSave with UUID + body when a value is entered', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <EditOrderMetaDialog order={order} open onSave={onSave} onClose={onClose} />
    )

    await user.type(screen.getByTestId('order-meta-value'), '0123456789012345')
    await user.click(screen.getByTestId('order-meta-save'))

    expect(onSave).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', {
      metaType: 'IMEI',
      value: '0123456789012345',
    })
  })
})
