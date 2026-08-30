import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuPackagingFormDialog } from '../SkuPackagingFormDialog'
import { ApiError } from '@/types/api'
import type { SkuPackaging } from '@/types/shipment-cost'

const mockMutateAsync = vi.fn()
const mockRefetchProducts = vi.fn()
const mockRefetchBoxTypes = vi.fn()
let mockIsPending = false
let mockProductsError = false
let mockBoxTypesError = false

vi.mock('@/hooks/use-sku-packaging', () => ({
  useCreateSkuPackaging: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending
    },
  }),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    data: mockProductsError
      ? undefined
      : {
          products: [
            {
              nm_id: 987654321,
              sa_name: 'Кроссовки',
              brand: 'TestBrand',
              vendor_code: 'SHOE-001',
            },
          ],
        },
    isLoading: false,
    isError: mockProductsError,
    refetch: mockRefetchProducts,
  }),
}))

vi.mock('@/hooks/use-box-types', () => ({
  useBoxTypes: () => ({
    data: mockBoxTypesError
      ? undefined
      : [
          {
            id: 'bt-001',
            name: 'Коробка A',
            lengthCm: '60.00',
            widthCm: '40.00',
            heightCm: '30.00',
            volumeCm3: '72000.00',
            isActive: true,
          },
        ],
    isLoading: false,
    isError: mockBoxTypesError,
    refetch: mockRefetchBoxTypes,
  }),
}))

const mockItem: SkuPackaging = {
  nmId: 123456789,
  cabinetId: 'cab-001',
  boxTypeId: 'bt-001',
  unitsPerBox: 10,
  boxType: {
    id: 'bt-001',
    name: 'Коробка A',
    lengthCm: '60.00',
    widthCm: '40.00',
    heightCm: '30.00',
    volumeCm3: '72000.00',
    isActive: true,
  },
  product: {
    nmId: 123456789,
    vendorCode: 'ART-001',
    brand: 'TestBrand',
    subject: 'Футболка',
  },
  createdAt: '2026-03-10T00:00:00Z',
  updatedAt: '2026-03-10T00:00:00Z',
}

function FocusReturnHarness({ item }: { item: SkuPackaging | null }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)}>
        {item ? 'Открыть редактирование' : 'Открыть создание'}
      </button>
      <SkuPackagingFormDialog
        open={open}
        item={item}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
      />
    </>
  )
}

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Товар (nmId)' }))
  await user.click(await screen.findByRole('option', { name: /987654321/ }))
  await user.click(screen.getByRole('combobox', { name: 'Тип коробки' }))
  await user.click(await screen.findByRole('option', { name: /Коробка A/ }))
  await user.type(screen.getByLabelText('Штук в коробке'), '24')
}

describe('SkuPackagingFormDialog', () => {
  const defaultProps = {
    open: true,
    item: null as SkuPackaging | null,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
    mockProductsError = false
    mockBoxTypesError = false
  })

  describe('create mode', () => {
    it('shows "Добавить упаковку" title', () => {
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)
      expect(screen.getByText('Добавить упаковку')).toBeInTheDocument()
    })

    it('renders ProductCombobox and BoxTypeSelect', () => {
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)
      expect(screen.getByText('Выберите товар...')).toBeInTheDocument()
      expect(screen.getByText('Выберите тип коробки')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Товар (nmId)' })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Тип коробки' })).toBeInTheDocument()
    })

    it('shows a truthful product-query failure with retry instead of an empty result', async () => {
      const user = userEvent.setup()
      mockProductsError = true
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      await user.click(screen.getByRole('combobox', { name: 'Товар (nmId)' }))

      expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить товары.')
      expect(screen.queryByText('Товары не найдены')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Повторить' }))
      expect(mockRefetchProducts).toHaveBeenCalledTimes(1)
    })

    it('blocks package selection and exposes retry when box types fail', async () => {
      const user = userEvent.setup()
      mockBoxTypesError = true
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      expect(screen.getByRole('combobox', { name: 'Тип коробки' })).toBeDisabled()
      expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить типы коробок.')
      await user.click(screen.getByRole('button', { name: 'Повторить' }))
      expect(mockRefetchBoxTypes).toHaveBeenCalledTimes(1)
    })
  })

  describe('edit mode', () => {
    it('shows "Редактировать упаковку" title', () => {
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)
      expect(screen.getByText('Редактировать упаковку')).toBeInTheDocument()
    })

    it('shows nmId as disabled input', () => {
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)
      const nmIdInput = screen.getByDisplayValue('123456789')
      expect(nmIdInput).toBeDisabled()
      expect(nmIdInput).toHaveAccessibleName('Товар (nmId)')
    })
  })

  describe('validation', () => {
    it('shows error for invalid unitsPerBox on empty submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      const submitBtn = screen.getByRole('button', { name: 'Создать' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getAllByText('Штук в коробке должно быть больше 0')).toHaveLength(2)
      })
    })

    it('sets aria-describedby and aria-invalid on units input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      const submitBtn = screen.getByRole('button', { name: 'Создать' })
      await user.click(submitBtn)

      await waitFor(() => {
        const input = screen.getByLabelText('Штук в коробке')
        expect(input).toHaveAttribute('aria-describedby', 'sp-units-help sp-units-error')
        expect(input).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('announces a form-level validation summary for every invalid field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Создать' }))

      const summary = await screen.findByRole('alert')
      expect(summary).toHaveTextContent('Проверьте поля формы')
      expect(summary).toHaveTextContent('Выберите товар')
      expect(summary).toHaveTextContent('Выберите тип коробки')
      expect(summary).toHaveTextContent('Штук в коробке должно быть больше 0')
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('focuses the first invalid product field after submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Создать' }))

      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Товар (nmId)' })).toHaveFocus()
      )
    })
  })

  describe('submit', () => {
    it('submits the unchanged single-upsert payload and closes exactly once', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      mockMutateAsync.mockResolvedValueOnce(mockItem)
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} onSuccess={onSuccess} />)

      await fillCreateForm(user)
      await user.click(screen.getByRole('button', { name: 'Создать' }))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1)
        expect(mockMutateAsync).toHaveBeenCalledWith({
          nmId: 987654321,
          boxTypeId: 'bt-001',
          unitsPerBox: 24,
        })
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
        expect(onSuccess).toHaveBeenCalledWith('Упаковка SKU 987654321 создана.')
      })
    })

    it('preserves nmId and submits the same upsert shape in edit mode', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      mockMutateAsync.mockResolvedValueOnce(mockItem)
      renderWithProviders(
        <SkuPackagingFormDialog {...defaultProps} item={mockItem} onSuccess={onSuccess} />
      )

      await user.clear(screen.getByLabelText('Штук в коробке'))
      await user.type(screen.getByLabelText('Штук в коробке'), '12')
      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          nmId: 123456789,
          boxTypeId: 'bt-001',
          unitsPerBox: 12,
        })
        expect(onSuccess).toHaveBeenCalledWith('Упаковка SKU 123456789 сохранена.')
      })
    })

    it('disables submit button during pending mutation', () => {
      mockIsPending = true
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)
      const btn = screen.getByRole('button', { name: /сохранение/i })
      expect(btn).toBeDisabled()
    })

    it('announces pending save and blocks cancellation', () => {
      mockIsPending = true
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)

      expect(screen.getByRole('status')).toHaveTextContent('Сохраняем упаковку SKU 123456789')
      expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    })

    it('maps a 409 failure to a recoverable inactive-box alert without closing', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockRejectedValueOnce(new ApiError('409 Conflict', 409))
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)

      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Неактивный тип коробки')
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('announces a generic save failure without closing', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockRejectedValueOnce(new Error('Service unavailable'))
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)

      await user.click(screen.getByRole('button', { name: 'Сохранить' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Не удалось сохранить привязку. Повторите попытку.'
      )
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('submits rapid save activation only once before pending state renders', async () => {
      const user = userEvent.setup()
      let resolveSave!: (value: SkuPackaging) => void
      mockMutateAsync.mockReturnValueOnce(
        new Promise(resolve => {
          resolveSave = resolve
        })
      )
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)

      await user.dblClick(screen.getByRole('button', { name: 'Сохранить' }))

      expect(mockMutateAsync).toHaveBeenCalledTimes(1)
      resolveSave(mockItem)
      await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalledTimes(1))
    })

    it.each([
      { item: null, trigger: 'Открыть создание' },
      { item: mockItem, trigger: 'Открыть редактирование' },
    ])(
      'returns focus to the exact $trigger trigger after cancellation',
      async ({ item, trigger }) => {
        const user = userEvent.setup()
        renderWithProviders(<FocusReturnHarness item={item} />)
        const triggerButton = screen.getByRole('button', { name: trigger })

        await user.click(triggerButton)
        await user.click(screen.getByRole('button', { name: 'Отмена' }))

        await waitFor(() => expect(triggerButton).toHaveFocus())
      }
    )
  })

  it('bounds the form dialog within a narrow viewport', () => {
    renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[calc(100dvh-2rem)]',
      'w-[calc(100%-2rem)]',
      'overflow-y-auto'
    )
  })
})
