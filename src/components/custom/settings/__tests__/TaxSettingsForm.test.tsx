/**
 * Regression tests for the Story 66.3-FE Tax & VAT Settings behavior contract.
 * Story-specific migration coverage is maintained in TaxSettingsForm.story-173-7.test.tsx.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { TaxSettingsForm } from '../TaxSettingsForm'
import { useAuthStore } from '@/stores/authStore'

// --- Mocks -----------------------------------------------------------

const mockTaxData = {
  id: 'cab-1',
  name: 'Test Cabinet',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  taxSystem: 'usn6' as const,
  taxRate: null as number | null,
  vatPayer: false,
  vatRate: null as number | null,
}

const mockMutate = vi.fn()

vi.mock('@/hooks/useCabinetTaxSettings', () => ({
  useCabinetTaxSettings: vi.fn(() => ({
    data: mockTaxData,
    isLoading: false,
    isError: false,
  })),
  useUpdateTaxSettings: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}))

// Re-import so we can override per test
import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'

const TEST_CABINET_ID = 'cab-1'

// --- Test Suite -------------------------------------------------------

describe('TaxSettingsForm (Story 66.3-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: { id: 'manager-1', email: 'manager@test.local', role: 'Manager' },
      token: 'jwt-token',
      cabinetId: TEST_CABINET_ID,
      isAuthenticated: true,
    })
    vi.mocked(useCabinetTaxSettings).mockReturnValue({
      data: mockTaxData,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCabinetTaxSettings>)
    vi.mocked(useUpdateTaxSettings).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateTaxSettings>)
  })

  it('1: renders income tax section with all radio options', () => {
    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    expect(screen.getByText('Система налогообложения')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /не настроена/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /усн 6%/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /усн 15%/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /пользовательская/i })).toBeInTheDocument()
  })

  it('2: renders VAT section with checkbox', () => {
    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    const checkbox = screen.getByRole('checkbox', {
      name: /плательщиком ндс/i,
    })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('3: hides manual tax rate input when taxSystem is not "manual"', () => {
    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    // Form must render the tax section first (ensures stub fails)
    expect(screen.getByText('Система налогообложения')).toBeInTheDocument()
    // Manual rate field must NOT appear when taxSystem is usn6
    expect(screen.queryByLabelText(/ставка налога.*%/i)).not.toBeInTheDocument()
  })

  it('4: shows manual tax rate input when "manual" is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    const manualRadio = screen.getByRole('radio', { name: /пользовательская/i })
    await user.click(manualRadio)

    await waitFor(() => {
      expect(screen.getByLabelText(/ставка налога.*%/i)).toBeInTheDocument()
    })
  })

  it('5: hides VAT rate options when vatPayer is unchecked', () => {
    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    // VAT checkbox must exist (ensures stub fails)
    expect(screen.getByRole('checkbox', { name: /плательщиком ндс/i })).toBeInTheDocument()
    // VAT rate radios must NOT appear when vatPayer is false
    expect(screen.queryByRole('radio', { name: /0%.*экспорт/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /20%/i })).not.toBeInTheDocument()
  })

  it('6: shows VAT rate options when vatPayer is checked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    const vatCheckbox = screen.getByRole('checkbox', { name: /плательщиком ндс/i })
    await user.click(vatCheckbox)

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /0%.*экспорт/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /^5%/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /20%.*стандартная/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /^22%/i })).toBeInTheDocument()
    })
  })

  it('7: loads current settings from hook and prefills form', () => {
    vi.mocked(useCabinetTaxSettings).mockReturnValue({
      data: { ...mockTaxData, taxSystem: 'usn15', vatPayer: true, vatRate: 20 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCabinetTaxSettings>)

    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    expect(screen.getByRole('radio', { name: /усн 15%/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /плательщиком ндс/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /20%.*стандартная/i })).toBeChecked()
  })

  it('8: disables save button during submission', () => {
    vi.mocked(useUpdateTaxSettings).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateTaxSettings>)

    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
  })

  it('9: calls mutation with correct payload on submit', async () => {
    const user = userEvent.setup()
    vi.mocked(useCabinetTaxSettings).mockReturnValue({
      data: { ...mockTaxData, taxSystem: null },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCabinetTaxSettings>)

    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    // Select USN 6%
    await user.click(screen.getByRole('radio', { name: /усн 6%/i }))
    // Submit
    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        // BD-FE-004: vatRate:0 (not null) when vatPayer=false — BE rejects null
        expect.objectContaining({ taxSystem: 'usn6', vatRate: 0 }),
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
      )
    })
  })

  it('10: validates taxRate required when taxSystem is manual', async () => {
    const user = userEvent.setup()
    vi.mocked(useCabinetTaxSettings).mockReturnValue({
      data: { ...mockTaxData, taxSystem: null },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCabinetTaxSettings>)

    renderWithProviders(<TaxSettingsForm cabinetId={TEST_CABINET_ID} />)

    // Select manual without entering rate
    await user.click(screen.getByRole('radio', { name: /пользовательская/i }))
    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    await waitFor(() => {
      expect(screen.getByText(/укажите ставку/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })
})
