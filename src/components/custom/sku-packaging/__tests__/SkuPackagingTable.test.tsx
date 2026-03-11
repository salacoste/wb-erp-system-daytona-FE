import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuPackagingTable } from '../SkuPackagingTable'
import type { SkuPackaging } from '@/types/shipment-cost'

const mockItems: SkuPackaging[] = [
  {
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
  },
]

describe('SkuPackagingTable', () => {
  const defaultProps = {
    items: mockItems,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders a row for each item', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)
    expect(screen.getByText(/123456789/)).toBeInTheDocument()
  })

  it('shows product as "nmId — subject" format', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)
    expect(screen.getByText('123456789 — Футболка')).toBeInTheDocument()
  })

  it('shows box type name', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)
    expect(screen.getByText('Коробка A')).toBeInTheDocument()
  })

  it('shows unitsPerBox', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('has edit and delete icon buttons', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Редактировать' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument()
  })

  it('calls onEdit with item when edit is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(<SkuPackagingTable {...defaultProps} onEdit={onEdit} />)
    await user.click(screen.getByRole('button', { name: 'Редактировать' }))
    expect(onEdit).toHaveBeenCalledWith(mockItems[0])
  })

  it('calls onDelete with item when delete is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    renderWithProviders(<SkuPackagingTable {...defaultProps} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: 'Удалить' }))
    expect(onDelete).toHaveBeenCalledWith(mockItems[0])
  })
})
