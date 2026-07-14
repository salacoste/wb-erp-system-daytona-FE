/**
 * Story O1: OperationalStatusSelect component tests.
 * Verifies allowed-transition filtering and absence for terminal statuses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OperationalStatusSelect } from '../OperationalStatusSelect'
import { ORDER_OPERATIONAL_STATUS_LABELS } from '@/types/orders'

describe('OperationalStatusSelect (Story O1)', () => {
  const onStatusChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing for terminal statuses (DELIVERED/CANCELLED/RETURNED)', () => {
    for (const status of ['DELIVERED', 'CANCELLED', 'RETURNED'] as const) {
      const { container } = renderWithProviders(
        <OperationalStatusSelect
          orderUuid="uuid-1"
          currentStatus={status}
          onStatusChange={onStatusChange}
        />
      )
      expect(container.querySelector('button')).toBeNull()
    }
  })

  it('shows only the allowed transitions for NEW (ASSEMBLED, CANCELLED)', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <OperationalStatusSelect
        orderUuid="uuid-new"
        currentStatus="NEW"
        onStatusChange={onStatusChange}
      />
    )

    const trigger = screen.getByLabelText('Сменить статус заказа uuid-new')
    await user.click(trigger)

    // Allowed options present
    expect(screen.getByText(ORDER_OPERATIONAL_STATUS_LABELS.ASSEMBLED)).toBeInTheDocument()
    expect(screen.getByText(ORDER_OPERATIONAL_STATUS_LABELS.CANCELLED)).toBeInTheDocument()
    // Disallowed options absent
    expect(screen.queryByText(ORDER_OPERATIONAL_STATUS_LABELS.PACKED)).toBeNull()
    expect(screen.queryByText(ORDER_OPERATIONAL_STATUS_LABELS.DELIVERED)).toBeNull()
    expect(screen.queryByText(ORDER_OPERATIONAL_STATUS_LABELS.SHIPPED)).toBeNull()
  })

  it('shows only SHIPPED for PACKED', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <OperationalStatusSelect
        orderUuid="uuid-packed"
        currentStatus="PACKED"
        onStatusChange={onStatusChange}
      />
    )

    await user.click(screen.getByLabelText('Сменить статус заказа uuid-packed'))
    expect(screen.getByText(ORDER_OPERATIONAL_STATUS_LABELS.SHIPPED)).toBeInTheDocument()
    expect(screen.queryByText(ORDER_OPERATIONAL_STATUS_LABELS.CANCELLED)).toBeNull()
  })

  it('fires onStatusChange with the chosen target status', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <OperationalStatusSelect
        orderUuid="uuid-new"
        currentStatus="NEW"
        onStatusChange={onStatusChange}
      />
    )

    await user.click(screen.getByLabelText('Сменить статус заказа uuid-new'))
    await user.click(screen.getByText(ORDER_OPERATIONAL_STATUS_LABELS.ASSEMBLED))

    expect(onStatusChange).toHaveBeenCalledWith('uuid-new', 'ASSEMBLED')
  })
})
