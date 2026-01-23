/**
 * TDD Tests for AuditLogTable Component
 * Story 52-FE.4: Audit Log Viewer
 *
 * Tests written BEFORE implementation following TDD approach.
 * These tests will fail until the component is implemented.
 *
 * @see docs/stories/epic-52-fe/story-52-fe.4-audit-log-viewer.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the hook
vi.mock('@/hooks/useTariffAuditLog', () => ({
  useTariffAuditLog: vi.fn(),
}))

// Import after mocks
import { useTariffAuditLog } from '@/hooks/useTariffAuditLog'

const mockUseTariffAuditLog = vi.mocked(useTariffAuditLog)

// Test fixtures matching API response structure
const mockAuditEntries = [
  {
    id: 123,
    action: 'UPDATE' as const,
    field_name: 'storageFreeDays',
    old_value: '60',
    new_value: '45',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    user_email: 'admin@example.com',
    ip_address: '192.168.1.1',
    created_at: '2026-01-22T10:00:00.000Z',
  },
  {
    id: 122,
    action: 'CREATE' as const,
    field_name: 'logisticsVolumeTiers',
    old_value: null,
    new_value: '[{"fromLiters":0,"toLiters":1,"rateRub":50}]',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    user_email: 'manager@example.com',
    ip_address: '192.168.1.2',
    created_at: '2026-01-21T15:30:00.000Z',
  },
  {
    id: 121,
    action: 'DELETE' as const,
    field_name: 'defaultCommissionFboPct',
    old_value: '15',
    new_value: null,
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    user_email: 'admin@example.com',
    ip_address: '192.168.1.1',
    created_at: '2026-01-20T09:15:00.000Z',
  },
  {
    id: 120,
    action: 'UPDATE' as const,
    field_name: 'fbsUsesFboLogisticsRates',
    old_value: 'true',
    new_value: 'false',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    user_email: 'admin@example.com',
    ip_address: '192.168.1.1',
    created_at: '2026-01-19T14:00:00.000Z',
  },
  {
    id: 119,
    action: 'UPDATE' as const,
    field_name: 'acceptanceBoxRatePerLiter',
    old_value: '10',
    new_value: '12.5',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    user_email: 'admin@example.com',
    ip_address: '192.168.1.1',
    created_at: '2026-01-18T11:30:00.000Z',
  },
]

const mockAuditResponse = {
  data: mockAuditEntries,
  meta: {
    page: 1,
    limit: 50,
    total: 234,
    total_pages: 5,
  },
}

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

describe('AuditLogTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC1: Table displays audit entries from API', () => {
    it('should render table with audit data', async () => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)

      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument()
        expect(screen.getByText('manager@example.com')).toBeInTheDocument()
      })
    })

    it('should display correct number of rows', async () => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)

      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // 1 header row + 5 data rows
        expect(rows.length).toBe(6)
      })
    })
  })

  describe('AC2: Columns display correct data', () => {
    beforeEach(() => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)
    })

    it('should display timestamp formatted as DD.MM.YY HH:mm', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        // 2026-01-22T10:00:00.000Z -> 22.01.26 13:00 (Moscow +3)
        expect(screen.getByText(/22\.01\.26/)).toBeInTheDocument()
      })
    })

    it('should display user_email', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const adminEmails = screen.getAllByText('admin@example.com')
        expect(adminEmails.length).toBeGreaterThan(0)
      })
    })

    it('should display IP address', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const ipAddresses = screen.getAllByText('192.168.1.1')
        expect(ipAddresses.length).toBeGreaterThan(0)
        expect(screen.getByText('192.168.1.2')).toBeInTheDocument()
      })
    })
  })

  describe('AC3: Filter dropdown by field_name', () => {
    beforeEach(() => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)
    })

    it('should render filter dropdown', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    it('should have "Все поля" as default option', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByText('Все поля')).toBeInTheDocument()
      })
    })

    it('should show field options in dropdown', async () => {
      const user = userEvent.setup()
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const dropdown = screen.getByRole('combobox')
      await user.click(dropdown)

      // Should show translated field names
      await waitFor(() => {
        expect(
          screen.getByText(/бесплатные дни хранения/i)
        ).toBeInTheDocument()
        expect(screen.getByText(/комиссия fbo/i)).toBeInTheDocument()
      })
    })

    it('should filter entries when field selected', async () => {
      const user = userEvent.setup()
      const mockRefetch = vi.fn()
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      } as ReturnType<typeof useTariffAuditLog>)

      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      const dropdown = screen.getByRole('combobox')
      await user.click(dropdown)

      await waitFor(() => {
        expect(
          screen.getByText(/бесплатные дни хранения/i)
        ).toBeInTheDocument()
      })

      const option = screen.getByText(/бесплатные дни хранения/i)
      await user.click(option)

      // Should update hook params with field_name filter
      await waitFor(() => {
        expect(mockUseTariffAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            field_name: 'storageFreeDays',
          })
        )
      })
    })
  })

  describe('AC4: Pagination (50 items per page, server-side)', () => {
    beforeEach(() => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)
    })

    it('should display pagination info "Показано 1-50 из 234"', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByText(/показано 1-50 из 234/i)).toBeInTheDocument()
      })
    })

    it('should render pagination controls', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        // Previous and Next buttons
        expect(screen.getByRole('button', { name: /назад/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /вперед/i })).toBeInTheDocument()
      })
    })

    it('should disable previous button on first page', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /назад/i })
        expect(prevButton).toBeDisabled()
      })
    })

    it('should enable next button when more pages exist', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /вперед/i })
        expect(nextButton).not.toBeDisabled()
      })
    })

    it('should go to next page on click', async () => {
      const user = userEvent.setup()
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /вперед/i })).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('button', { name: /вперед/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(mockUseTariffAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        )
      })
    })
  })

  describe('AC5: Values formatted appropriately', () => {
    beforeEach(() => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)
    })

    it('should format days with "дней" suffix', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        // storageFreeDays: 60 -> "60 дней"
        expect(screen.getByText('60 дней')).toBeInTheDocument()
        expect(screen.getByText('45 дней')).toBeInTheDocument()
      })
    })

    it('should format percentages with "%" suffix', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        // defaultCommissionFboPct: 15 -> "15%"
        expect(screen.getByText('15%')).toBeInTheDocument()
      })
    })

    it('should format currency rates with "₽" suffix', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        // acceptanceBoxRatePerLiter: 12.5 -> "12.5 ₽"
        expect(screen.getByText('12.5 ₽')).toBeInTheDocument()
        expect(screen.getByText('10 ₽')).toBeInTheDocument()
      })
    })

    it('should format booleans as Да/Нет', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByText('Да')).toBeInTheDocument()
        expect(screen.getByText('Нет')).toBeInTheDocument()
      })
    })

    it('should display dash "—" for null values', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
      })
    })

    it('should render JSON arrays as expandable', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        // logisticsVolumeTiers should have expandable JSON view
        const expandButton = screen.getByRole('button', { name: /показать/i })
        expect(expandButton).toBeInTheDocument()
      })
    })
  })

  describe('AC6: Empty state', () => {
    it('should display empty state when no audit entries', async () => {
      mockUseTariffAuditLog.mockReturnValue({
        data: { data: [], meta: { page: 1, limit: 50, total: 0, total_pages: 0 } },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)

      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByText(/журнал изменений пуст/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC7: Loading skeleton', () => {
    it('should display loading skeleton when isLoading is true', async () => {
      mockUseTariffAuditLog.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)

      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const skeletons = document.querySelectorAll('[data-testid="skeleton"]')
        expect(skeletons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('AC8: Action badges', () => {
    beforeEach(() => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)
    })

    it('should render UPDATE action with blue badge', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const updateBadge = screen.getAllByText('Изменение')[0]
        expect(updateBadge).toBeInTheDocument()
        expect(updateBadge).toHaveClass('bg-blue-100')
      })
    })

    it('should render CREATE action with green badge', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const createBadge = screen.getByText('Создание')
        expect(createBadge).toBeInTheDocument()
        expect(createBadge).toHaveClass('bg-green-100')
      })
    })

    it('should render DELETE action with red badge', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const deleteBadge = screen.getByText('Удаление')
        expect(deleteBadge).toBeInTheDocument()
        expect(deleteBadge).toHaveClass('bg-red-100')
      })
    })
  })

  describe('Table accessibility', () => {
    beforeEach(() => {
      mockUseTariffAuditLog.mockReturnValue({
        data: mockAuditResponse,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)
    })

    it('should have accessible table with proper headers', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()

        // Check column headers
        expect(screen.getByText('Дата/время')).toBeInTheDocument()
        expect(screen.getByText('Пользователь')).toBeInTheDocument()
        expect(screen.getByText('Действие')).toBeInTheDocument()
        expect(screen.getByText('Поле')).toBeInTheDocument()
        expect(screen.getByText('Было')).toBeInTheDocument()
        expect(screen.getByText('Стало')).toBeInTheDocument()
        expect(screen.getByText('IP')).toBeInTheDocument()
      })
    })

    it('should have aria-label on filter dropdown', async () => {
      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const dropdown = screen.getByRole('combobox')
        expect(dropdown).toHaveAttribute('aria-label')
      })
    })
  })

  describe('Error handling', () => {
    it('should display error message when API call fails', async () => {
      mockUseTariffAuditLog.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch audit log'),
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)

      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        expect(screen.getByText(/ошибка загрузки/i)).toBeInTheDocument()
      })
    })

    it('should display retry button on error', async () => {
      mockUseTariffAuditLog.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useTariffAuditLog>)

      const { AuditLogTable } = await import('../AuditLogTable')
      renderWithProviders(<AuditLogTable />)

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /повторить/i })
        expect(retryButton).toBeInTheDocument()
      })
    })
  })
})
