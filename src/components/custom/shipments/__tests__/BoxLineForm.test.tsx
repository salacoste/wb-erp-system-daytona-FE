import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxLineForm } from '../BoxLineForm'
import type { BoxLine } from '@/types/shipment-cost'
import { useRef, useState } from 'react'

const mockAddAsync = vi.fn()
const mockUpdateAsync = vi.fn()
let mockIsAdding = false
let mockIsUpdating = false

vi.mock('@/hooks/use-box-lines', () => ({
  useAddBoxLine: () => ({
    mutateAsync: mockAddAsync,
    get isPending() {
      return mockIsAdding
    },
  }),
  useUpdateBoxLine: () => ({
    mutateAsync: mockUpdateAsync,
    get isPending() {
      return mockIsUpdating
    },
  }),
}))

vi.mock('@/hooks/use-sku-packaging', () => ({
  useSkuPackagingByNmId: () => ({ isError: false, isFetched: false }),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ data: null, isFetched: false }),
}))

vi.mock('@/components/custom/sku-packaging/ProductCombobox', () => ({
  ProductCombobox: ({
    onChange,
    ...props
  }: {
    onChange: (id: number | null) => void
    'aria-invalid'?: boolean
  }) => (
    <button
      type="button"
      role="combobox"
      data-testid="mock-product-combobox"
      aria-invalid={props['aria-invalid']}
      onClick={() => onChange(999)}
    >
      Select Product
    </button>
  ),
}))

const editLine: BoxLine = {
  id: 'bl-1',
  palletId: 'p-1',
  nmId: 123456,
  boxCount: 5,
  totalUnits: 50,
  unitCostRub: null,
  boxVolume: null,
  totalVolume: null,
  volumeShare: null,
  allocatedDeliveryCost: null,
  deliveryCostPerUnit: null,
  finalCostPerUnit: null,
  finalCostLine: null,
  createdAt: '2026-03-11T10:00:00Z',
  updatedAt: '2026-03-11T10:00:00Z',
}

describe('BoxLineForm', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdding = false
    mockIsUpdating = false
  })

  it('renders create dialog with correct title when open', () => {
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={null} />
    )
    expect(screen.getByText('Добавить товар')).toBeInTheDocument()
    expect(screen.getByText('Выберите товар и укажите количество')).toBeInTheDocument()
  })

  it('renders edit dialog with pre-filled values', () => {
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={editLine} />
    )
    expect(screen.getByText('Редактировать товар')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })

  it('shows nmId as disabled input in edit mode', () => {
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={editLine} />
    )
    const nmIdInput = screen.getByDisplayValue('123456')
    expect(nmIdInput).toBeDisabled()
  })

  it('validates boxCount is required and positive', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={editLine} />
    )

    const countInput = screen.getByDisplayValue('5')
    await user.clear(countInput)

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(screen.getByText('Укажите целое число > 0')).toBeInTheDocument()
      expect(countInput).toHaveFocus()
    })
    expect(mockUpdateAsync).not.toHaveBeenCalled()
  })

  it('submits update when editing a box line', async () => {
    const user = userEvent.setup()
    mockUpdateAsync.mockResolvedValueOnce({ id: 'bl-1' })
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={editLine} />
    )

    const countInput = screen.getByDisplayValue('5')
    await user.clear(countInput)
    await user.type(countInput, '10')

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(mockUpdateAsync).toHaveBeenCalledWith({
        boxLineId: 'bl-1',
        data: { boxCount: 10, totalUnits: 50 },
      })
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error on submission failure', async () => {
    const user = userEvent.setup()
    mockUpdateAsync.mockRejectedValueOnce(new Error('Server error'))
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={editLine} />
    )

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(screen.getByText('Ошибка сохранения. Попробуйте ещё раз.')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent('Ошибка сохранения')
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('focuses the product combobox when it is the first invalid create field', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={null} />
    )

    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus())
  })

  it('exposes pending save through a polite status', () => {
    mockIsUpdating = true
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={editLine} />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Сохраняем изменения товарной строки')
  })

  it('exposes pending create through a polite status', () => {
    mockIsAdding = true
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={null} />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Добавляем товарную строку')
  })

  it('exposes a create failure as an alert', async () => {
    const user = userEvent.setup()
    mockAddAsync.mockRejectedValueOnce(new Error('Server error'))
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={null} />
    )

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByLabelText('Количество коробок'), '3')
    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Ошибка сохранения'))
  })

  it('restores focus to the invoking trigger after a successful save', async () => {
    const user = userEvent.setup()
    mockUpdateAsync.mockResolvedValueOnce({ id: 'bl-1' })
    renderWithProviders(<FocusReturnHarness />)
    const trigger = screen.getByText('Invoking edit trigger').closest('button')
    expect(trigger).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('submits create with nmId and boxCount', async () => {
    const user = userEvent.setup()
    mockAddAsync.mockResolvedValueOnce({ id: 'bl-new' })
    renderWithProviders(
      <BoxLineForm open onClose={onClose} shipmentId="s-1" palletId="p-1" editingLine={null} />
    )

    await user.click(screen.getByTestId('mock-product-combobox'))

    const countInput = screen.getByLabelText('Количество коробок')
    await user.type(countInput, '3')

    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() => {
      expect(mockAddAsync).toHaveBeenCalledWith({ nmId: 999, boxCount: 3 })
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    renderWithProviders(
      <BoxLineForm
        open={false}
        onClose={onClose}
        shipmentId="s-1"
        palletId="p-1"
        editingLine={null}
      />
    )
    expect(screen.queryByText('Добавить товар')).not.toBeInTheDocument()
  })
})

function FocusReturnHarness() {
  const [open, setOpen] = useState(true)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} type="button">
        Invoking edit trigger
      </button>
      <BoxLineForm
        open={open}
        onClose={() => setOpen(false)}
        shipmentId="s-1"
        palletId="p-1"
        editingLine={editLine}
        returnFocusRef={triggerRef}
      />
    </>
  )
}
