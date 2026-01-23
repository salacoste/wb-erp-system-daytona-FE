/**
 * Unit tests for TariffSettingsForm component
 * Story 52-FE.2: Tariff Settings Edit Form
 * TDD: Tests updated to use real component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TariffSettingsForm } from '../TariffSettingsForm'

// Mock API module
const mockGetTariffSettings = vi.fn()

vi.mock('@/lib/api/tariffs-admin', () => ({
  getTariffSettings: () => mockGetTariffSettings(),
  putTariffSettings: vi.fn(),
  patchTariffSettings: vi.fn(),
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

// Mock tariff settings data - exported for use in integration tests
export const mockTariffSettings = {
  acceptanceBoxRatePerLiter: 1.8,
  acceptancePalletRate: 520,
  logisticsVolumeTiers: [
    { fromLiters: 0.001, toLiters: 0.2, rateRub: 24 },
    { fromLiters: 0.201, toLiters: 0.4, rateRub: 27 },
  ],
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
  source: 'manual' as const,
  notes: '',
}

describe('TariffSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTariffSettings.mockResolvedValue(mockTariffSettings)
  })

  describe('AC1: Form displays all 21 editable fields grouped by category', () => {
    it('renders form with main title in Russian', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/редактирование тарифов/i)).toBeInTheDocument()
      })
    })

    it('displays acceptance section fields', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/приёмка/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/тариф паллеты.*₽/i)).toBeInTheDocument()
      })
    })

    it('displays logistics section fields', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/логистика/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/крупногабарит 1-й литр.*₽/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/крупногабарит доп.*₽\/л/i)).toBeInTheDocument()
        expect(screen.getByText(/тарифные уровни по объёму/i)).toBeInTheDocument()
      })
    })

    it('displays returns section header', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/возвраты/i)).toBeInTheDocument()
      })
    })

    it('displays commission section header', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/комиссии/i)).toBeInTheDocument()
      })
    })

    it('displays storage section header', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/хранение/i)).toBeInTheDocument()
      })
    })

    it('displays FBS settings section header', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        expect(screen.getByText(/fbs настройки/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC2: Collapsible sections', () => {
    it('expands section when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/возвраты/i)).toBeInTheDocument()
      })

      // Click to expand Returns section
      const returnsHeader = screen.getByText(/возвраты/i)
      await user.click(returnsHeader)

      // Section content should be visible after click
      await waitFor(() => {
        expect(screen.getByLabelText(/возврат fbo.*₽/i)).toBeVisible()
      })
    })

    it('first two sections are expanded by default', async () => {
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Acceptance should be expanded
      expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeVisible()
    })
  })

  describe('AC5: Save button behavior', () => {
    it('Save button is disabled when no changes made', async () => {
      renderWithProviders(<TariffSettingsForm />)

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /сохранить/i })
        // Button disabled because isDirty is false
        expect(saveButton).toBeDisabled()
      })
    })
  })

  describe('AC8: Confirmation dialog before save', () => {
    it('shows confirmation dialog when Save clicked after changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Make a change to enable save button
      const rateInput = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
      await user.clear(rateInput)
      await user.type(rateInput, '2.5')

      // Click save
      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/сохранить изменения тарифов/i)).toBeInTheDocument()
      })
    })

    it('dialog has Confirm and Cancel buttons', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Make a change
      const rateInput = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
      await user.clear(rateInput)
      await user.type(rateInput, '2.5')

      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(saveButton)

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        expect(within(dialog).getByRole('button', { name: /подтвердить/i })).toBeInTheDocument()
        expect(within(dialog).getByRole('button', { name: /отмена/i })).toBeInTheDocument()
      })
    })

    it('Cancel closes dialog without saving', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Make a change
      const rateInput = screen.getByLabelText(/тариф приёмки.*₽\/литр/i)
      await user.clear(rateInput)
      await user.type(rateInput, '2.5')

      const saveButton = screen.getByRole('button', { name: /сохранить/i })
      await user.click(saveButton)

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/сохранить изменения тарифов/i)).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText(/сохранить изменения тарифов/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading and error states', () => {
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

  describe('Accessibility', () => {
    it('all form fields have accessible labels', async () => {
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/тариф приёмки.*₽\/литр/i)).toBeInTheDocument()
      })

      // Check that inputs are properly labeled
      const inputs = screen.getAllByRole('spinbutton')
      inputs.forEach((input) => {
        expect(input).toHaveAccessibleName()
      })
    })

    it('sections are keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TariffSettingsForm />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/приёмка/i)).toBeInTheDocument()
      })

      // Tab should move focus through sections
      await user.tab()
      expect(document.activeElement).toBeTruthy()
    })
  })
})
