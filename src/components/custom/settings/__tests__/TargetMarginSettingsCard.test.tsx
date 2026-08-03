import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { renderWithProviders } from '@/test/utils/test-utils'
import { useAuthStore } from '@/stores/authStore'
import { TargetMarginSettingsCard } from '../TargetMarginSettingsCard'

const mockMutate = vi.fn()
const baseCabinet = {
  id: 'cab-1',
  name: 'Cabinet',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  taxSystem: null,
  taxRate: null,
  vatPayer: false,
  vatRate: null,
  targetMarginPct: null as number | null,
}

vi.mock('@/hooks/useCabinetTaxSettings', () => ({
  useCabinetTaxSettings: vi.fn(),
  useUpdateTaxSettings: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'

describe('TargetMarginSettingsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: { id: 'manager-1', email: 'manager@test.local', role: 'Manager' },
      token: 'token',
      cabinetId: 'cab-1',
      isAuthenticated: true,
    })
    vi.mocked(useCabinetTaxSettings).mockReturnValue({
      data: baseCabinet,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCabinetTaxSettings>)
    vi.mocked(useUpdateTaxSettings).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateTaxSettings>)
  })

  it.each([
    [null, 20],
    [0, 0],
    [20, 20],
  ])('shows persisted %s as %s without an implicit write', (stored, shown) => {
    vi.mocked(useCabinetTaxSettings).mockReturnValue({
      data: { ...baseCabinet, targetMarginPct: stored },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCabinetTaxSettings>)

    renderWithProviders(<TargetMarginSettingsCard cabinetId="cab-1" />)

    expect(screen.getByLabelText(/целевая маржа/i)).toHaveValue(shown)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it.each(['-1', '101'])('rejects out-of-range value %s', async value => {
    const user = userEvent.setup()
    renderWithProviders(<TargetMarginSettingsCard cabinetId="cab-1" />)
    const input = screen.getByLabelText(/целевая маржа/i)
    await user.clear(input)
    await user.type(input, value)
    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(await screen.findByText(/от 0 до 100/i)).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('rejects empty/non-finite number input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TargetMarginSettingsCard cabinetId="cab-1" />)
    const input = screen.getByLabelText(/целевая маржа/i)
    fireEvent.change(input, { target: { value: 'Infinity' } })
    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(await screen.findByText(/укажите целевую маржу|корректное число/i)).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it.each([0, 100])('accepts boundary value %s', async value => {
    const user = userEvent.setup()
    renderWithProviders(<TargetMarginSettingsCard cabinetId="cab-1" />)
    const input = screen.getByLabelText(/целевая маржа/i)
    await user.clear(input)
    await user.type(input, String(value))
    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { targetMarginPct: value },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      )
    )
  })

  it('refreshes the displayed value from the successful persisted response', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementation((_payload, callbacks) =>
      callbacks.onSuccess({ ...baseCabinet, targetMarginPct: 35 })
    )
    renderWithProviders(<TargetMarginSettingsCard cabinetId="cab-1" />)
    const input = screen.getByLabelText(/целевая маржа/i)
    await user.clear(input)
    await user.type(input, '35')
    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => expect(input).toHaveValue(35))
    expect(toast.success).toHaveBeenCalledWith('Целевая маржа сохранена')
  })

  it('shows API feedback and retains the entered value on failure', async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementation((_payload, callbacks) => callbacks.onError())
    renderWithProviders(<TargetMarginSettingsCard cabinetId="cab-1" />)
    const input = screen.getByLabelText(/целевая маржа/i)
    await user.clear(input)
    await user.type(input, '40')
    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(input).toHaveValue(40)
    expect(toast.success).not.toHaveBeenCalled()
  })
})
