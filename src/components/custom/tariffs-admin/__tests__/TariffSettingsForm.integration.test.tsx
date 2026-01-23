/**
 * Integration tests for TariffSettingsForm component
 * Story 52-FE.2: Tariff Settings Edit Form
 * TDD: Tests updated to use real component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TariffSettingsForm } from '../TariffSettingsForm'

// Import mock data from unit test file
import { mockTariffSettings } from './TariffSettingsForm.test'

// Mock API module
const mockGetTariffSettings = vi.fn()
const mockPutTariffSettings = vi.fn()
const mockPatchTariffSettings = vi.fn()

vi.mock('@/lib/api/tariffs-admin', () => ({
  getTariffSettings: () => mockGetTariffSettings(),
  putTariffSettings: (data: unknown) => mockPutTariffSettings(data),
  patchTariffSettings: (data: unknown) => mockPatchTariffSettings(data),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

// Wrapper with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('TariffSettingsForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTariffSettings.mockResolvedValue(mockTariffSettings)
    mockPutTariffSettings.mockResolvedValue({ ...mockTariffSettings, notes: 'Updated' })
    mockPatchTariffSettings.mockResolvedValue({ ...mockTariffSettings, storageFreeDays: 45 })
  })

  describe('Form loads current settings', () => {
    it('fetches and displays current tariff settings on mount', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(mockGetTariffSettings).toHaveBeenCalledTimes(1)
      })

      // Check values are populated
      await waitFor(() => {
        const acceptanceInput = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
        expect(acceptanceInput).toHaveValue(1.8)
      })
    })

    it('shows loading skeleton while fetching', () => {
      mockGetTariffSettings.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTariffSettings), 1000))
      )

      renderWithProviders(<TariffSettingsForm />)

      expect(screen.getByTestId('form-skeleton')).toBeInTheDocument()
    })

    it('displays error state when fetch fails', async () => {
      mockGetTariffSettings.mockRejectedValue(new Error('Network error'))

      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/ошибка загрузки/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC5: PATCH request when partial fields changed', () => {
    it('sends PATCH request when only some fields are modified', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Modify only one field
      const acceptanceInput = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
      await user.clear(acceptanceInput)
      await user.type(acceptanceInput, '2.5')

      // Click save and confirm
      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(saveButton)

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/сохранить изменения тарифов/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /подтвердить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockPatchTariffSettings).toHaveBeenCalledWith(
          expect.objectContaining({ acceptanceBoxRatePerLiter: 2.5 })
        )
      })
    })
  })

  describe('AC6: Success toast after save', () => {
    it('shows success toast after successful save', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Modify a field
      const acceptanceInput = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
      await user.clear(acceptanceInput)
      await user.type(acceptanceInput, '2.5')

      // Save
      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(saveButton)

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/сохранить изменения тарифов/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /подтвердить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Тарифы успешно обновлены')
      })
    })
  })

  describe('AC7: Error handling', () => {
    it('shows error toast for 429 rate limit response', async () => {
      mockPatchTariffSettings.mockRejectedValue({
        status: 429,
        message: 'Too Many Requests',
        headers: new Headers({ 'X-RateLimit-Reset': String(Date.now() / 1000 + 60) }),
      })

      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Modify and save
      const acceptanceInput = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
      await user.clear(acceptanceInput)
      await user.type(acceptanceInput, '2.5')

      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(saveButton)

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/сохранить изменения тарифов/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /подтвердить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Превышен лимит запросов')
        )
      })
    })
  })

  describe('Volume tiers editor', () => {
    it('displays existing volume tiers in table', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        // Check tiers from mock data are displayed
        expect(screen.getByDisplayValue('0.001')).toBeInTheDocument()
        expect(screen.getByDisplayValue('0.2')).toBeInTheDocument()
        expect(screen.getByDisplayValue('24')).toBeInTheDocument()
      })
    })

    it('can add a new volume tier', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/добавить уровень/i)).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /добавить уровень/i })
      await user.click(addButton)

      // New row should appear
      const tierRows = screen.getAllByRole('row')
      expect(tierRows.length).toBeGreaterThan(2) // Header + existing + new
    })

    it('can remove a volume tier', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /удалить/i })).toHaveLength(2)
      })

      const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
      await user.click(deleteButtons[0])

      // One less tier
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /удалить/i })).toHaveLength(1)
      })
    })
  })
})
