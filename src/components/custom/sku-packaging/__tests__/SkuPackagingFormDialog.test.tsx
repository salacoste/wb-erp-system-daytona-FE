import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuPackagingFormDialog } from '../SkuPackagingFormDialog'
import type { SkuPackaging } from '@/types/shipment-cost'

const mockMutateAsync = vi.fn()
let mockIsPending = false

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
    data: { products: [] },
    isLoading: false,
  }),
}))

vi.mock('@/hooks/use-box-types', () => ({
  useBoxTypes: () => ({
    data: [
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

describe('SkuPackagingFormDialog', () => {
  const defaultProps = {
    open: true,
    item: null as SkuPackaging | null,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
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
    })
  })

  describe('validation', () => {
    it('shows error for invalid unitsPerBox on empty submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      const submitBtn = screen.getByRole('button', { name: 'Создать' })
      await user.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByText('Штук в коробке должно быть больше 0')).toBeInTheDocument()
      })
    })

    it('sets aria-describedby and aria-invalid on units input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} />)

      const submitBtn = screen.getByRole('button', { name: 'Создать' })
      await user.click(submitBtn)

      await waitFor(() => {
        const input = screen.getByLabelText('Штук в коробке')
        expect(input).toHaveAttribute('aria-describedby', 'sp-units-error')
        expect(input).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })

  describe('submit', () => {
    it('disables submit button during pending mutation', () => {
      mockIsPending = true
      renderWithProviders(<SkuPackagingFormDialog {...defaultProps} item={mockItem} />)
      const btn = screen.getByRole('button', { name: /сохранение/i })
      expect(btn).toBeDisabled()
    })
  })
})
