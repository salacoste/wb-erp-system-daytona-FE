/**
 * Tests for BoxTypeDeactivateDialog component
 * Epic 75-FE, Story 75.2: Box Types CRUD Page (AC: #5, #7)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypeDeactivateDialog } from '../BoxTypeDeactivateDialog'
import type { BoxType } from '@/types/shipment-cost'

const mockMutateAsync = vi.fn()

vi.mock('@/hooks/use-box-types', () => ({
  useDeactivateBoxType: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
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

describe('BoxTypeDeactivateDialog', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders confirmation title', () => {
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByText('Деактивировать тип коробки?')).toBeInTheDocument()
  })

  it('renders box type name in description', () => {
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByText(/Коробка A/)).toBeInTheDocument()
  })

  it('uses Button (not AlertDialogAction) for confirmation', () => {
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    const confirmButton = screen.getByRole('button', { name: /деактивировать$/i })
    // Button component renders <button>, not an AlertDialogAction
    expect(confirmButton.tagName).toBe('BUTTON')
    expect(confirmButton).toBeInTheDocument()
  })

  it('calls mutateAsync with boxType.id on confirm click', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValue(undefined)
    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /деактивировать$/i }))

    expect(mockMutateAsync).toHaveBeenCalledWith('bt-001')
  })

  it('disables confirm button during pending state', async () => {
    const { useDeactivateBoxType } = await import('@/hooks/use-box-types')
    vi.mocked(useDeactivateBoxType).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useDeactivateBoxType>)

    renderWithProviders(<BoxTypeDeactivateDialog boxType={mockBoxType} onClose={onClose} />)

    expect(screen.getByRole('button', { name: /деактивация/i })).toBeDisabled()
  })
})
