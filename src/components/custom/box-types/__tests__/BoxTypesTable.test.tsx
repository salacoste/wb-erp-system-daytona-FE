/**
 * Tests for BoxTypesTable component
 * Epic 75-FE, Story 75.2: Box Types CRUD Page (AC: #2, #6)
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypesTable } from '../BoxTypesTable'
import type { BoxType } from '@/types/shipment-cost'

const mockBoxTypes: BoxType[] = [
  {
    id: 'bt-001',
    cabinetId: 'cab-001',
    name: 'Коробка A',
    lengthCm: '60.00',
    widthCm: '40.00',
    heightCm: '30.00',
    volumeCm3: '72000.00',
    isActive: true,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'bt-002',
    cabinetId: 'cab-001',
    name: 'Коробка B',
    lengthCm: '30.00',
    widthCm: '20.00',
    heightCm: '15.00',
    volumeCm3: '9000.00',
    isActive: true,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
]

describe('BoxTypesTable', () => {
  const defaultProps = {
    boxTypes: mockBoxTypes,
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
  }

  it('renders a row for each box type', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)

    expect(screen.getByText('Коробка A')).toBeInTheDocument()
    expect(screen.getByText('Коробка B')).toBeInTheDocument()
  })

  it('shows parsed dimensions and volume', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)

    // Dimensions formatted via parseDecimal: "60 × 40 × 30"
    expect(screen.getByText('60 × 40 × 30')).toBeInTheDocument()
    expect(screen.getByText('30 × 20 × 15')).toBeInTheDocument()
  })

  it('shows formatted volume', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)

    // Volume formatted with ru-RU locale
    expect(screen.getByText(/72\s?000/)).toBeInTheDocument()
    expect(screen.getByText(/9\s?000/)).toBeInTheDocument()
  })

  it('has edit and deactivate icon buttons per row', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)

    const editButtons = screen.getAllByRole('button', { name: 'Редактировать' })
    const deactivateButtons = screen.getAllByRole('button', { name: 'Деактивировать' })
    expect(editButtons).toHaveLength(2)
    expect(deactivateButtons).toHaveLength(2)
  })

  it('calls onEdit with the correct item when edit is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(<BoxTypesTable {...defaultProps} onEdit={onEdit} />)

    const row = screen.getByText('Коробка A').closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Редактировать' }))

    expect(onEdit).toHaveBeenCalledWith(mockBoxTypes[0])
  })

  it('calls onDeactivate with the correct item when deactivate is clicked', async () => {
    const user = userEvent.setup()
    const onDeactivate = vi.fn()
    renderWithProviders(<BoxTypesTable {...defaultProps} onDeactivate={onDeactivate} />)

    const row = screen.getByText('Коробка B').closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Деактивировать' }))

    expect(onDeactivate).toHaveBeenCalledWith(mockBoxTypes[1])
  })
})
