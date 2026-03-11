import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuPackagingDeleteDialog } from '../SkuPackagingDeleteDialog'
import type { SkuPackaging } from '@/types/shipment-cost'

const mockMutateAsync = vi.fn()
let mockIsPending = false

vi.mock('@/hooks/use-sku-packaging', () => ({
  useDeleteSkuPackaging: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending
    },
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

describe('SkuPackagingDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
  })

  it('renders confirmation title', () => {
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    expect(screen.getByText('Удалить привязку упаковки?')).toBeInTheDocument()
  })

  it('shows item nmId and box type name in description', () => {
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    expect(screen.getByText(/123456789/)).toBeInTheDocument()
    expect(screen.getByText(/Коробка A/)).toBeInTheDocument()
  })

  it('uses regular Button (not AlertDialogAction) for delete', () => {
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    const deleteBtn = screen.getByRole('button', { name: 'Удалить' })
    expect(deleteBtn).toBeInTheDocument()
    expect(deleteBtn.tagName).toBe('BUTTON')
  })

  it('calls deleteMutation.mutateAsync with item nmId on confirm', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValueOnce(undefined)

    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Удалить' }))
    expect(mockMutateAsync).toHaveBeenCalledWith(123456789)
  })

  it('disables confirm button during pending mutation', () => {
    mockIsPending = true
    renderWithProviders(<SkuPackagingDeleteDialog item={mockItem} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /удаление/i })).toBeDisabled()
  })
})
