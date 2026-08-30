import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxLineTable, boxLineTableContract } from '../BoxLineTable'
import type { BoxLine } from '@/types/shipment-cost'

const mockRemoveAsync = vi.fn()
const mockAddAsync = vi.fn()
const mockUpdateAsync = vi.fn()

vi.mock('@/hooks/use-box-lines', () => ({
  useAddBoxLine: () => ({
    mutateAsync: mockAddAsync,
    isPending: false,
  }),
  useUpdateBoxLine: () => ({
    mutateAsync: mockUpdateAsync,
    isPending: false,
  }),
  useRemoveBoxLine: () => ({
    mutateAsync: mockRemoveAsync,
  }),
}))

vi.mock('@/hooks/use-sku-packaging', () => ({
  useSkuPackagingByNmId: () => ({ isError: false, isFetched: false }),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ data: null, isFetched: false }),
}))

vi.mock('@/components/custom/sku-packaging/ProductCombobox', () => ({
  ProductCombobox: ({ onChange }: { onChange: (id: number | null) => void }) => (
    <button type="button" role="combobox" onClick={() => onChange(999)}>
      Select Product
    </button>
  ),
}))

const mockLine: BoxLine = {
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

const mockLine2: BoxLine = { ...mockLine, id: 'bl-2', nmId: 789012, boxCount: 3, totalUnits: null }

describe('BoxLineTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no box lines', () => {
    renderWithProviders(<BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[]} isDraft />)
    expect(screen.getByText('Товары ещё не добавлены')).toBeInTheDocument()
  })

  it('renders box lines in table with correct data', () => {
    renderWithProviders(
      <BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[mockLine, mockLine2]} isDraft />
    )
    expect(screen.getByText('123456')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('789012')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument() // null totalUnits
    expect(screen.getByRole('table', { name: 'Товары паллеты' })).toHaveAttribute(
      'data-narrow-strategy',
      'horizontal-scroll'
    )
    expect(screen.getByRole('region', { name: 'Таблица товаров паллеты' })).toHaveAttribute(
      'tabindex',
      '0'
    )
  })

  it('shows add button for DRAFT shipments', () => {
    renderWithProviders(<BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[]} isDraft />)
    expect(screen.getByText('Добавить товар')).toBeInTheDocument()
  })

  it('hides add button and actions for CONFIRMED shipments', () => {
    renderWithProviders(
      <BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[mockLine]} isDraft={false} />
    )
    expect(screen.queryByText('Добавить товар')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Редактировать товар 123456')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Удалить товар 123456')).not.toBeInTheDocument()
  })

  it('keeps row-action metadata aligned with DRAFT and CONFIRMED DOM schemas', () => {
    expect(boxLineTableContract(false, true).rowActions).toEqual({
      kind: 'caller-rendered',
      accessibleNamePattern: 'Действия для товара {entityId}',
    })
    expect(boxLineTableContract(true, false).rowActions).toEqual({ kind: 'none' })
  })

  it('shows edit and remove actions for DRAFT', () => {
    renderWithProviders(
      <BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[mockLine]} isDraft />
    )
    expect(screen.getByLabelText('Редактировать товар 123456')).toBeInTheDocument()
    expect(screen.getByLabelText('Удалить товар 123456')).toBeInTheDocument()
  })

  it('calls removeAsync when delete is confirmed', async () => {
    const user = userEvent.setup()
    mockRemoveAsync.mockResolvedValueOnce(undefined)
    renderWithProviders(
      <BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[mockLine]} isDraft />
    )

    await user.click(screen.getByLabelText('Удалить товар 123456'))

    await waitFor(() => {
      expect(screen.getByText('Удалить товар 123456?')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    await waitFor(() => {
      expect(mockRemoveAsync).toHaveBeenCalledWith('bl-1')
      expect(screen.getByRole('status')).toHaveTextContent('Товарная строка удалена')
    })
  })

  it('announces remove pending and failure states', async () => {
    let rejectRemove!: (reason: Error) => void
    mockRemoveAsync.mockImplementationOnce(
      () => new Promise((_, reject) => (rejectRemove = reject as (reason: Error) => void))
    )
    const user = userEvent.setup()
    renderWithProviders(
      <BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[mockLine]} isDraft />
    )

    await user.click(screen.getByLabelText('Удалить товар 123456'))
    await user.click(screen.getByRole('button', { name: 'Удалить' }))
    expect(screen.getByRole('status')).toHaveTextContent('Удаляем товарную строку')

    rejectRemove(new Error('failed'))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Не удалось удалить товарную строку')
    )
  })

  it('opens add form when clicking add button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[]} isDraft />)

    await user.click(screen.getByText('Добавить товар'))

    await waitFor(() => {
      expect(screen.getByText('Выберите товар и укажите количество')).toBeInTheDocument()
    })
  })

  it('returns focus to the exact add trigger when the form is cancelled', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[]} isDraft />)
    const addTrigger = screen.getByRole('button', { name: 'Добавить товар' })

    await user.click(addTrigger)
    await user.click(screen.getByRole('button', { name: 'Отмена' }))

    await waitFor(() => expect(addTrigger).toHaveFocus())
  })

  it('returns focus to the exact row edit trigger when the form closes with Escape', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[mockLine]} isDraft />
    )
    const editTrigger = screen.getByLabelText('Редактировать товар 123456')

    await user.click(editTrigger)
    await user.keyboard('{Escape}')

    await waitFor(() => expect(editTrigger).toHaveFocus())
  })

  it('announces a successful box-line create after the dialog closes', async () => {
    mockAddAsync.mockResolvedValueOnce({ id: 'bl-new' })
    const user = userEvent.setup()
    renderWithProviders(<BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[]} isDraft />)

    await user.click(screen.getByRole('button', { name: 'Добавить товар' }))
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByLabelText('Количество коробок'), '3')
    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Товарная строка добавлена')
    )
  })

  it('announces a successful box-line update after the dialog closes', async () => {
    mockUpdateAsync.mockResolvedValueOnce({ id: 'bl-1' })
    const user = userEvent.setup()
    renderWithProviders(
      <BoxLineTable shipmentId="s-1" palletId="p-1" boxLines={[mockLine]} isDraft />
    )

    await user.click(screen.getByLabelText('Редактировать товар 123456'))
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Товарная строка обновлена')
    )
  })
})
