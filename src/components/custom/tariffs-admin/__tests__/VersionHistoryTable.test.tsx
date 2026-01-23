/**
 * TDD Tests for VersionHistoryTable Component
 * Story 52-FE.1: Version History Table
 *
 * Tests written BEFORE implementation following TDD approach.
 * These tests will fail until the component is implemented.
 *
 * @see docs/stories/epic-52-fe/story-52-fe.1-version-history-table.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the hook
vi.mock('@/hooks/useTariffVersionHistory', () => ({
  useTariffVersionHistory: vi.fn(),
}))

// Import after mocks
import { useTariffVersionHistory } from '@/hooks/useTariffVersionHistory'

const mockUseTariffVersionHistory = vi.mocked(useTariffVersionHistory)

// Test fixtures matching API response structure
const mockVersions = [
  {
    id: 3,
    effective_from: '2026-02-01',
    effective_until: null,
    status: 'scheduled' as const,
    source: 'manual' as const,
    notes: 'February promotion',
    created_at: '2026-01-22T10:00:00.000Z',
    updated_by: 'admin@example.com',
  },
  {
    id: 2,
    effective_from: '2026-01-15',
    effective_until: '2026-01-31',
    status: 'active' as const,
    source: 'manual' as const,
    notes: 'January 2026 update',
    created_at: '2026-01-10T09:00:00.000Z',
    updated_by: 'admin@example.com',
  },
  {
    id: 1,
    effective_from: '2025-12-01',
    effective_until: '2026-01-14',
    status: 'expired' as const,
    source: 'api' as const,
    notes: 'Initial setup',
    created_at: '2025-11-25T08:00:00.000Z',
    updated_by: 'system@wb.ru',
  },
]

// Test utilities
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('VersionHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC1: Table displays all versions from API', () => {
    it('should render table with version data', async () => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: mockVersions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      // Import component (lazy import to apply mocks)
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      // Should render all 3 versions
      await waitFor(() => {
        expect(screen.getByText('February promotion')).toBeInTheDocument()
        expect(screen.getByText('January 2026 update')).toBeInTheDocument()
        expect(screen.getByText('Initial setup')).toBeInTheDocument()
      })
    })

    it('should display correct number of rows', async () => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: mockVersions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // 1 header row + 3 data rows
        expect(rows.length).toBe(4)
      })
    })
  })

  describe('AC2: Each row shows required columns', () => {
    beforeEach(() => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: mockVersions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)
    })

    it('should display effective_from formatted as DD.MM.YYYY', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        // 2026-02-01 -> 01.02.2026
        expect(screen.getByText('01.02.2026')).toBeInTheDocument()
        // 2026-01-15 -> 15.01.2026
        expect(screen.getByText('15.01.2026')).toBeInTheDocument()
      })
    })

    it('should display effective_until or dash when null', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        // 2026-01-31 -> 31.01.2026
        expect(screen.getByText('31.01.2026')).toBeInTheDocument()
        // null -> "—"
        expect(screen.getByText('—')).toBeInTheDocument()
      })
    })

    it('should display source as "manual" or "API"', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const manualElements = screen.getAllByText('manual')
        expect(manualElements.length).toBe(2)
        expect(screen.getByText('API')).toBeInTheDocument()
      })
    })

    it('should display updated_by email', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const adminEmails = screen.getAllByText('admin@example.com')
        expect(adminEmails.length).toBe(2)
        expect(screen.getByText('system@wb.ru')).toBeInTheDocument()
      })
    })

    it('should display created_at formatted as DD.MM.YYYY HH:mm', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        // 2026-01-22T10:00:00.000Z -> 22.01.2026 13:00 (Moscow time +3)
        expect(screen.getByText(/22\.01\.2026/)).toBeInTheDocument()
      })
    })
  })

  describe('AC3: Status badges with correct colors', () => {
    beforeEach(() => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: mockVersions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)
    })

    it('should render "scheduled" status with blue badge', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const scheduledBadge = screen.getByText('Запланировано')
        expect(scheduledBadge).toBeInTheDocument()
        expect(scheduledBadge).toHaveClass('bg-blue-100')
      })
    })

    it('should render "active" status with green badge', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const activeBadge = screen.getByText('Активно')
        expect(activeBadge).toBeInTheDocument()
        expect(activeBadge).toHaveClass('bg-green-100')
      })
    })

    it('should render "expired" status with gray badge', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const expiredBadge = screen.getByText('Истекло')
        expect(expiredBadge).toBeInTheDocument()
        expect(expiredBadge).toHaveClass('bg-gray-100')
      })
    })
  })

  describe('AC4: Delete button visible only for scheduled versions', () => {
    beforeEach(() => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: mockVersions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)
    })

    it('should show delete button for scheduled version', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        // Find the row with scheduled version
        const scheduledBadge = screen.getByText('Запланировано')
        const row = scheduledBadge.closest('tr')
        expect(row).not.toBeNull()

        if (row) {
          const deleteButton = within(row).getByRole('button', {
            name: /удалить/i,
          })
          expect(deleteButton).toBeInTheDocument()
        }
      })
    })

    it('should NOT show delete button for active version', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const activeBadge = screen.getByText('Активно')
        const row = activeBadge.closest('tr')
        expect(row).not.toBeNull()

        if (row) {
          const deleteButton = within(row).queryByRole('button', {
            name: /удалить/i,
          })
          expect(deleteButton).not.toBeInTheDocument()
        }
      })
    })

    it('should NOT show delete button for expired version', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const expiredBadge = screen.getByText('Истекло')
        const row = expiredBadge.closest('tr')
        expect(row).not.toBeNull()

        if (row) {
          const deleteButton = within(row).queryByRole('button', {
            name: /удалить/i,
          })
          expect(deleteButton).not.toBeInTheDocument()
        }
      })
    })

    it('should trigger confirmation dialog on delete click', async () => {
      const user = userEvent.setup()
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText('Запланировано')).toBeInTheDocument()
      })

      const scheduledBadge = screen.getByText('Запланировано')
      const row = scheduledBadge.closest('tr')

      if (row) {
        const deleteButton = within(row).getByRole('button', {
          name: /удалить/i,
        })
        await user.click(deleteButton)

        // Should show confirmation dialog
        await waitFor(() => {
          expect(
            screen.getByText(/подтвердите удаление/i)
          ).toBeInTheDocument()
        })
      }
    })
  })

  describe('AC6: Empty state when no history available', () => {
    it('should display empty state when data is empty array', async () => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText(/история версий пуста/i)).toBeInTheDocument()
      })
    })

    it('should display helpful message in empty state', async () => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        expect(
          screen.getByText(/создайте первую версию/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('AC7: Loading skeleton while data is being fetched', () => {
    it('should display loading skeleton when isLoading is true', async () => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const skeletons = document.querySelectorAll('[data-testid="skeleton"]')
        expect(skeletons.length).toBeGreaterThan(0)
      })
    })

    it('should hide skeleton when data is loaded', async () => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: mockVersions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const skeletons = document.querySelectorAll('[data-testid="skeleton"]')
        expect(skeletons.length).toBe(0)
      })
    })
  })

  describe('Error handling', () => {
    it('should display error message when API call fails', async () => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch version history'),
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        expect(screen.getByText(/ошибка загрузки/i)).toBeInTheDocument()
      })
    })

    it('should display retry button on error', async () => {
      const mockRefetch = vi.fn()
      mockUseTariffVersionHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useTariffVersionHistory>)

      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /повторить/i })
        expect(retryButton).toBeInTheDocument()
      })
    })
  })

  describe('Table accessibility', () => {
    beforeEach(() => {
      mockUseTariffVersionHistory.mockReturnValue({
        data: mockVersions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffVersionHistory>)
    })

    it('should have accessible table with proper headers', async () => {
      const { VersionHistoryTable } = await import('../VersionHistoryTable')
      renderWithProviders(<VersionHistoryTable />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()

        // Check column headers
        expect(screen.getByText('Дата начала')).toBeInTheDocument()
        expect(screen.getByText('Дата окончания')).toBeInTheDocument()
        expect(screen.getByText('Статус')).toBeInTheDocument()
        expect(screen.getByText('Источник')).toBeInTheDocument()
      })
    })
  })
})
