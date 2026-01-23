/**
 * Unit and integration tests for ScheduleVersionModal component
 * Story 52-FE.3: Schedule Future Version
 * TDD: Tests written BEFORE implementation - Updated with real imports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

// Mock API module
const mockScheduleTariffVersion = vi.fn()
const mockGetTariffSettings = vi.fn()

vi.mock('@/lib/api/tariffs-admin', () => ({
  scheduleTariffVersion: (data: unknown) => mockScheduleTariffVersion(data),
  getTariffSettings: () => mockGetTariffSettings(),
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
  }),
}))

import { ScheduleVersionModal } from '../ScheduleVersionModal'

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

// Mock current settings for pre-filling
const mockCurrentSettings = {
  acceptanceBoxRatePerLiter: 1.8,
  acceptancePalletRate: 520,
  logisticsVolumeTiers: [{ fromLiters: 0.001, toLiters: 0.2, rateRub: 24 }],
  logisticsLargeFirstLiterRate: 48,
  logisticsLargeAdditionalLiterRate: 15,
  returnLogisticsFboRate: 50,
  returnLogisticsFbsRate: 60,
  defaultCommissionFboPct: 15,
  defaultCommissionFbsPct: 12,
  storageFreeDays: 30,
  fixationClothingDays: 14,
  fixationOtherDays: 7,
  fbsUsesFboLogisticsRates: true,
}

// Tomorrow's date for valid scheduling
const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0] // YYYY-MM-DD format
}

describe('ScheduleVersionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTariffSettings.mockResolvedValue(mockCurrentSettings)
    mockScheduleTariffVersion.mockResolvedValue({
      data: { ...mockCurrentSettings, effectiveFrom: getTomorrowDate() },
      meta: {
        version_id: 3,
        effective_from: getTomorrowDate(),
        status: 'scheduled',
      },
    })
  })

  describe('AC1: Modal opens when button clicked', () => {
    it('modal is closed by default', () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={false} onClose={vi.fn()} />
      )

      expect(
        screen.queryByText(/запланировать новую версию/i)
      ).not.toBeInTheDocument()
    })

    it('modal opens when isOpen is true', async () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(
          screen.getByText(/запланировать новую версию тарифов/i)
        ).toBeInTheDocument()
      })
    })

    it('modal can be closed via close button', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={onClose} />
      )

      await waitFor(() => {
        expect(
          screen.getByText(/запланировать новую версию тарифов/i)
        ).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /закрыть/i })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('AC2: Modal includes required components', () => {
    it('displays date picker for effective_from', async () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(screen.getByText(/дата начала действия/i)).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /выберите дату/i })
        ).toBeInTheDocument()
      })
    })

    it('displays all tariff fields pre-filled from current settings', async () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        // Check some pre-filled values
        const acceptanceInput = screen.getByLabelText(/тариф приёмки.*литр/i)
        expect(acceptanceInput).toHaveValue(1.8)

        const storageDaysInput = screen.getByLabelText(/бесплатные дни/i)
        expect(storageDaysInput).toHaveValue(30)
      })
    })

    it('displays notes field as optional', async () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/заметки/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC3: Date validation - must be future date', () => {
    it('date picker does not allow past dates', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /выберите дату/i })
        ).toBeInTheDocument()
      })

      // Open date picker
      const datePickerTrigger = screen.getByRole('button', {
        name: /выберите дату/i,
      })
      await user.click(datePickerTrigger)

      // Past dates should be disabled - check that today is disabled
      const today = new Date()
      const todayDay = today.getDate()

      // Find the day button and check if it's disabled
      const dayButtons = screen.getAllByRole('button')
      const todayButton = dayButtons.find(btn =>
        btn.textContent === String(todayDay) &&
        btn.getAttribute('data-day')
      )

      // Today should be disabled (only future dates allowed)
      if (todayButton) {
        expect(todayButton).toBeDisabled()
      }
    })

    it('shows hint text about minimum date', async () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(screen.getByText(/минимум.*завтра/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC4: Submit button disabled without date', () => {
    it('submit button is disabled initially', async () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /запланировать/i,
        })
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('AC5: 409 Conflict error handling', () => {
    it('shows error message when version already exists for date', async () => {
      mockScheduleTariffVersion.mockRejectedValue({
        status: 409,
        message: 'A version already exists for 2026-02-01',
      })

      const user = userEvent.setup()
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /выберите дату/i })
        ).toBeInTheDocument()
      })

      // Select date and submit
      const datePickerTrigger = screen.getByRole('button', {
        name: /выберите дату/i,
      })
      await user.click(datePickerTrigger)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Find day button by data attribute
      const dayButtons = screen.getAllByRole('button')
      const tomorrowButton = dayButtons.find(btn =>
        btn.textContent === String(tomorrow.getDate()) &&
        !btn.hasAttribute('disabled')
      )

      if (tomorrowButton) {
        await user.click(tomorrowButton)
      }

      // Now submit button should be enabled
      const submitButton = screen.getByRole('button', { name: /запланировать/i })
      if (!submitButton.hasAttribute('disabled')) {
        await user.click(submitButton)
      }

      // Error toast should be called (through error handler)
      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('AC6: Success toast and history refresh', () => {
    it('shows success toast after scheduling', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={onClose} />
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /выберите дату/i })
        ).toBeInTheDocument()
      })

      // Select date and submit
      const datePickerTrigger = screen.getByRole('button', {
        name: /выберите дату/i,
      })
      await user.click(datePickerTrigger)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const dayButtons = screen.getAllByRole('button')
      const tomorrowButton = dayButtons.find(btn =>
        btn.textContent === String(tomorrow.getDate()) &&
        !btn.hasAttribute('disabled')
      )

      if (tomorrowButton) {
        await user.click(tomorrowButton)
      }

      const submitButton = screen.getByRole('button', { name: /запланировать/i })
      if (!submitButton.hasAttribute('disabled')) {
        await user.click(submitButton)
      }

      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Версия запланирована на')
          )
        },
        { timeout: 3000 }
      )
    })
  })

  describe('AC7: Info badge about max versions', () => {
    it('displays info about maximum 10 scheduled versions', async () => {
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(
          screen.getByText(/максимум 10 запланированных версий/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows loading spinner during submission', async () => {
      mockScheduleTariffVersion.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({}), 1000))
      )

      const user = userEvent.setup()
      renderWithProviders(
        <ScheduleVersionModal isOpen={true} onClose={vi.fn()} />
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /выберите дату/i })
        ).toBeInTheDocument()
      })

      // Select date and submit
      const datePickerTrigger = screen.getByRole('button', {
        name: /выберите дату/i,
      })
      await user.click(datePickerTrigger)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const dayButtons = screen.getAllByRole('button')
      const tomorrowButton = dayButtons.find(btn =>
        btn.textContent === String(tomorrow.getDate()) &&
        !btn.hasAttribute('disabled')
      )

      if (tomorrowButton) {
        await user.click(tomorrowButton)
      }

      const submitButton = screen.getByRole('button', { name: /запланировать/i })
      if (!submitButton.hasAttribute('disabled')) {
        await user.click(submitButton)
      }

      // Check for loading text
      await waitFor(() => {
        expect(screen.getByText(/сохранение/i)).toBeInTheDocument()
      })
    })
  })
})
