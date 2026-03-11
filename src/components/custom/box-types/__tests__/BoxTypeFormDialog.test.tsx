/**
 * Tests for BoxTypeFormDialog component
 * Epic 75-FE, Story 75.2: Box Types CRUD Page (AC: #3, #4, #7)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypeFormDialog } from '../BoxTypeFormDialog'
import type { BoxType } from '@/types/shipment-cost'

const mockCreateMutateAsync = vi.fn()
const mockUpdateMutateAsync = vi.fn()

vi.mock('@/hooks/use-box-types', () => ({
  useCreateBoxType: vi.fn(() => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  })),
  useUpdateBoxType: vi.fn(() => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  })),
}))

const mockBoxType: BoxType = {
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
}

describe('BoxTypeFormDialog', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create dialog title when boxType is null', () => {
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    expect(screen.getByText('Добавить тип коробки')).toBeInTheDocument()
  })

  it('renders edit dialog title when boxType is provided', () => {
    renderWithProviders(<BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByText('Редактировать тип коробки')).toBeInTheDocument()
  })

  it('pre-fills form inputs in edit mode', () => {
    renderWithProviders(<BoxTypeFormDialog open boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByLabelText('Название')).toHaveValue('Коробка A')
    expect(screen.getByLabelText('Длина (см)')).toHaveValue(60)
    expect(screen.getByLabelText('Ширина (см)')).toHaveValue(40)
    expect(screen.getByLabelText('Высота (см)')).toHaveValue(30)
  })

  it('shows validation error when name is empty on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(screen.getByText('Название обязательно')).toBeInTheDocument()
    })
  })

  it('sets aria-invalid and aria-describedby on inputs with errors', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Название')
      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      expect(nameInput).toHaveAttribute('aria-describedby', 'bt-name-error')
    })
  })

  it('calls createMutation with form data on valid submit', async () => {
    const user = userEvent.setup()
    mockCreateMutateAsync.mockResolvedValueOnce({ id: 'bt-new' })
    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    await user.type(screen.getByLabelText('Название'), 'Новая коробка')
    await user.type(screen.getByLabelText('Длина (см)'), '50')
    await user.type(screen.getByLabelText('Ширина (см)'), '30')
    await user.type(screen.getByLabelText('Высота (см)'), '20')
    await user.click(screen.getByRole('button', { name: /создать/i }))

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        name: 'Новая коробка',
        lengthCm: 50,
        widthCm: 30,
        heightCm: 20,
      })
    })
  })

  it('disables submit button during pending mutation', async () => {
    const { useCreateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useCreateBoxType).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateBoxType>)

    renderWithProviders(<BoxTypeFormDialog open boxType={null} onClose={onClose} />)

    expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
  })
})
