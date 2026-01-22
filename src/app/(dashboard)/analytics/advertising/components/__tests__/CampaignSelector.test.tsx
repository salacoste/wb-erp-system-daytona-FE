/**
 * Unit Tests for CampaignSelector Component
 * Epic 33 - Advertising Analytics
 * Story 33.8-FE: Integration Testing
 *
 * Tests:
 * - Initial rendering states
 * - Loading state
 * - Error state
 * - Disabled state
 * - Accessibility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { CampaignSelector } from '../CampaignSelector'
import { setupMockAuth, clearMockAuth } from '@/test/test-utils'
import { mockCampaignsResponse } from '@/mocks/handlers/advertising'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        gcTime: Infinity,
        staleTime: 0,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('CampaignSelector', () => {
  let onSelectionChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setupMockAuth()
    onSelectionChange = vi.fn()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders with "Все кампании" when nothing selected', async () => {
      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Все кампании')
      })
    })

    it('shows single campaign name when one selected', async () => {
      renderWithProviders(
        <CampaignSelector
          selectedIds={[1001]} // "Осенняя распродажа" from mock data
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Осенняя распродажа')
      })
    })

    it('shows count when multiple selected', async () => {
      renderWithProviders(
        <CampaignSelector
          selectedIds={[1001, 1002]}
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('2 кампаний')
      })
    })
  })

  describe('Dropdown Behavior', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeEnabled()
      })

      await user.click(screen.getByRole('combobox'))

      // Dropdown should be open and show search input
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Поиск кампании...')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows disabled button while loading', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/campaigns`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return HttpResponse.json(mockCampaignsResponse)
        })
      )

      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      // Button should be disabled while loading
      expect(screen.getByRole('combobox')).toBeDisabled()
    })
  })

  describe('Error State', () => {
    it('shows error message when API fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/campaigns`, () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Server error' } },
            { status: 500 }
          )
        })
      )

      const user = userEvent.setup()
      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(
        () => {
          expect(screen.getByRole('combobox')).toBeEnabled()
        },
        { timeout: 5000 }
      )

      await user.click(screen.getByRole('combobox'))

      await waitFor(
        () => {
          expect(screen.getByText('Не удалось загрузить кампании')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })
  })

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
          disabled
        />
      )

      expect(screen.getByRole('combobox')).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has accessible combobox button', async () => {
      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(() => {
        const combobox = screen.getByRole('combobox')
        expect(combobox).toHaveAttribute('aria-label', 'Выбрать кампании')
        expect(combobox).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeEnabled()
      })

      await user.click(screen.getByRole('combobox'))

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
      })
    })
  })

  describe('Selection Callback', () => {
    it('calls onSelectionChange when dropdown closes after selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CampaignSelector
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeEnabled()
      })

      // Open dropdown
      await user.click(screen.getByRole('combobox'))

      // Wait for campaigns to load
      await waitFor(() => {
        expect(screen.getByText('Осенняя распродажа')).toBeInTheDocument()
      })

      // Click on a campaign to select it (this only updates temp selection)
      const campaignOption = screen.getByText('Осенняя распродажа').closest('[role="option"]')
      expect(campaignOption).toBeInTheDocument()
      if (campaignOption) {
        await user.click(campaignOption)
      }

      // Click "Готово" button to close dropdown and apply selection
      const doneButton = screen.getByRole('button', { name: 'Готово' })
      await user.click(doneButton)

      // Callback should be called with selected IDs when dropdown closes
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledWith([1001])
      })
    })
  })
})
