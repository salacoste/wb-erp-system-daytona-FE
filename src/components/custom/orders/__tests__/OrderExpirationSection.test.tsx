import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/types/api'
import type { ExpirationMeta } from '@/types/orders'

const mutateAsync = vi.fn()
const autoFillMutateAsync = vi.fn()
const reconcileMutateAsync = vi.fn()
let isPending = false
let isAutoFillPending = false
let isReconcilePending = false

vi.mock('@/hooks/useOrders', () => ({
  useUpdateOrderExpiration: () => ({ mutateAsync, isPending }),
  useAutoFillOrderExpiration: () => ({
    mutateAsync: autoFillMutateAsync,
    isPending: isAutoFillPending,
  }),
  useReconcileOrderExpiration: () => ({
    mutateAsync: reconcileMutateAsync,
    isPending: isReconcilePending,
  }),
}))

import { OrderExpirationSection } from '../OrderExpirationSection'

const requiredMeta: ExpirationMeta = {
  requirement: 'required',
  value: null,
  decision: 'required',
  editable: true,
  manualEditable: true,
  fefoAvailable: true,
  reconciliationRequired: false,
  minimumDate: '2026-08-14',
}

function renderSection(expirationMeta: ExpirationMeta = requiredMeta) {
  return render(
    <OrderExpirationSection
      orderUuid="order-uuid"
      wbOrderId="1234567890"
      expirationMeta={expirationMeta}
    />
  )
}

describe('OrderExpirationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isPending = false
    isAutoFillPending = false
    isReconcilePending = false
  })

  it('shows backend capability, native minimum and immutable-delete warning', () => {
    renderSection()
    expect(screen.getByRole('heading', { name: 'Годен до' })).toBeInTheDocument()
    expect(screen.getByText('Обязательно')).toBeInTheDocument()
    expect(screen.getByText('Текущее значение: не указано')).toBeInTheDocument()
    expect(screen.getByLabelText('Дата срока годности')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Дата срока годности')).toHaveAttribute('min', '2026-08-14')
    expect(screen.getByText(/нельзя удалить/i)).toBeInTheDocument()
  })

  it('disables editing when the backend says editable=false', () => {
    renderSection({
      ...requiredMeta,
      requirement: 'optional',
      editable: false,
      manualEditable: false,
      fefoAvailable: false,
    })
    expect(screen.getByText('Опционально')).toBeInTheDocument()
    expect(screen.getByLabelText('Дата срока годности')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('disables save for empty, too-early, malformed and unchanged values', () => {
    renderSection({ ...requiredMeta, value: '2030-09-12', decision: 'filled' })
    const input = screen.getByLabelText('Дата срока годности')
    const save = screen.getByRole('button', { name: 'Сохранить' })
    expect(save).toBeDisabled()

    fireEvent.change(input, { target: { value: '' } })
    expect(save).toBeDisabled()
    fireEvent.change(input, { target: { value: '2026-08-13' } })
    expect(save).toBeDisabled()
    fireEvent.change(input, { target: { value: '2030-02-30' } })
    expect(save).toBeDisabled()
  })

  it('submits the UUID, WB order ID and ISO date', async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValue({
      updated: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
    })
    renderSection()

    fireEvent.change(screen.getByLabelText('Дата срока годности'), {
      target: { value: '2030-09-12' },
    })
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mutateAsync).toHaveBeenCalledWith({
      orderUuid: 'order-uuid',
      wbOrderId: '1234567890',
      expirationDate: '2030-09-12',
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled())
  })

  it('auto-fills from the reserved FEFO batch', async () => {
    const user = userEvent.setup()
    autoFillMutateAsync.mockResolvedValue({
      updated: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
      reservationId: 'reservation-1',
      batchId: 'batch-1',
    })
    renderSection()

    await user.click(screen.getByRole('button', { name: /заполнить по fefo/i }))

    expect(autoFillMutateAsync).toHaveBeenCalledWith({
      orderUuid: 'order-uuid',
      wbOrderId: '1234567890',
    })
    await waitFor(() =>
      expect(screen.getByLabelText('Дата срока годности')).toHaveValue('2030-09-12')
    )
  })

  it('offers an explicit read-only reconciliation for an unresolved WB write', async () => {
    const user = userEvent.setup()
    reconcileMutateAsync.mockResolvedValue({
      reconciled: true,
      verified: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
      outcome: 'verified',
    })
    renderSection({
      ...requiredMeta,
      editable: false,
      manualEditable: false,
      fefoAvailable: false,
      reconciliationRequired: true,
    })

    await user.click(screen.getByRole('button', { name: /проверить в wb/i }))

    expect(reconcileMutateAsync).toHaveBeenCalledWith({
      orderUuid: 'order-uuid',
      wbOrderId: '1234567890',
    })
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('keeps FEFO available while an active reservation blocks manual input', () => {
    renderSection({ ...requiredMeta, manualEditable: false, fefoAvailable: true })

    expect(screen.getByLabelText('Дата срока годности')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /заполнить по fefo/i })).toBeEnabled()
  })

  it('retains input and adopts the authoritative minimum on stale-min error', async () => {
    const user = userEvent.setup()
    mutateAsync.mockRejectedValue(
      new ApiError('Дата слишком ранняя', 400, {
        error: {
          code: 'ORDER_EXPIRATION_DATE_TOO_EARLY',
          details: { minimumDate: '2030-09-13' },
        },
      })
    )
    renderSection()
    const input = screen.getByLabelText('Дата срока годности')
    fireEvent.change(input, { target: { value: '2030-09-12' } })
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(screen.getByText('Минимальная дата: 2030-09-13')).toBeInTheDocument()
    )
    expect(input).toHaveValue('2030-09-12')
    expect(input).toHaveAttribute('min', '2030-09-13')
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('resets draft and stale authoritative minimum when switching orders', async () => {
    const user = userEvent.setup()
    mutateAsync.mockRejectedValue(
      new ApiError('Дата слишком ранняя', 400, {
        error: {
          code: 'ORDER_EXPIRATION_DATE_TOO_EARLY',
          details: { minimumDate: '2030-09-13' },
        },
      })
    )
    const { rerender } = renderSection()
    const input = screen.getByLabelText('Дата срока годности')
    fireEvent.change(input, { target: { value: '2030-09-12' } })
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    await screen.findByText('Минимальная дата: 2030-09-13')

    rerender(
      <OrderExpirationSection
        orderUuid="other-order-uuid"
        wbOrderId="9999999999"
        expirationMeta={requiredMeta}
      />
    )

    expect(screen.getByLabelText('Дата срока годности')).toHaveValue('')
    expect(screen.getByLabelText('Дата срока годности')).toHaveAttribute('min', '2026-08-14')
    expect(screen.queryByText('Минимальная дата: 2030-09-13')).not.toBeInTheDocument()
  })
})
