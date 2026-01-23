/**
 * TDD Tests for Tariff Settings Page
 * Story 52-FE.7: Page Layout, Types & Integration
 *
 * Tests written BEFORE implementation following TDD approach.
 * These tests will fail until the component is implemented.
 *
 * NOTE: Tests use mocked useAuth that may extend the current interface.
 * The page component implementation should handle these cases.
 *
 * @see docs/stories/epic-52-fe/story-52-fe.7-page-layout-types.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock useAuth hook - extend interface for loading state handling
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Import after mocks
import { useAuth } from '@/hooks/useAuth'

const mockUseAuth = vi.mocked(useAuth)

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

// Mock return value type for useAuth (extends base for page needs)
type UserRole = 'Owner' | 'Manager' | 'Analyst' | 'Service'

interface MockAuthReturn {
  user: { id: string; email: string; role: UserRole } | null
  isAuthenticated: boolean
  token: string | null
  refreshToken: () => Promise<boolean>
}

function createMockAuth(overrides: Partial<MockAuthReturn>): MockAuthReturn {
  return {
    user: null,
    isAuthenticated: false,
    token: null,
    refreshToken: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

describe('TariffSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
  })

  describe('AC2: Admin Role Check', () => {
    it('should redirect non-Owner users to dashboard', async () => {
      // Arrange: User with Manager role (not Owner/admin)
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: { id: '1', email: 'user@test.com', role: 'Manager' },
          isAuthenticated: true,
          token: 'test-token',
        })
      )

      // Act: Import and render the page (lazy import to apply mocks)
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      // Assert: Should redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should redirect Analyst users to dashboard', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: { id: '1', email: 'analyst@test.com', role: 'Analyst' },
          isAuthenticated: true,
          token: 'test-token',
        })
      )

      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should render page for Owner users (admin)', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: { id: '1', email: 'owner@test.com', role: 'Owner' },
          isAuthenticated: true,
          token: 'test-token',
        })
      )

      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      // Should NOT redirect
      expect(mockPush).not.toHaveBeenCalled()

      // Should render page title
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /управление тарифами/i })
        ).toBeInTheDocument()
      })
    })
  })

  describe('AC3: 3 Tabs Layout', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: { id: '1', email: 'owner@test.com', role: 'Owner' },
          isAuthenticated: true,
          token: 'test-token',
        })
      )
    })

    it('should render 3 tabs with correct Russian labels', async () => {
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        // Tab 1: "Текущие настройки"
        expect(
          screen.getByRole('tab', { name: /текущие настройки/i })
        ).toBeInTheDocument()

        // Tab 2: "История версий"
        expect(
          screen.getByRole('tab', { name: /история версий/i })
        ).toBeInTheDocument()

        // Tab 3: "Журнал изменений"
        expect(
          screen.getByRole('tab', { name: /журнал изменений/i })
        ).toBeInTheDocument()
      })
    })

    it('should show "Текущие настройки" tab as default active', async () => {
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        const currentTab = screen.getByRole('tab', {
          name: /текущие настройки/i,
        })
        expect(currentTab).toHaveAttribute('data-state', 'active')
      })
    })

    it('should switch to "История версий" tab on click', async () => {
      const user = userEvent.setup()
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: /история версий/i })
        ).toBeInTheDocument()
      })

      const historyTab = screen.getByRole('tab', { name: /история версий/i })
      await user.click(historyTab)

      expect(historyTab).toHaveAttribute('data-state', 'active')
    })

    it('should switch to "Журнал изменений" tab on click', async () => {
      const user = userEvent.setup()
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: /журнал изменений/i })
        ).toBeInTheDocument()
      })

      const auditTab = screen.getByRole('tab', { name: /журнал изменений/i })
      await user.click(auditTab)

      expect(auditTab).toHaveAttribute('data-state', 'active')
    })
  })

  describe('AC7: Breadcrumbs', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: { id: '1', email: 'owner@test.com', role: 'Owner' },
          isAuthenticated: true,
          token: 'test-token',
        })
      )
    })

    it('should render breadcrumbs: Главная > Настройки > Тарифы', async () => {
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Главная')).toBeInTheDocument()
        expect(screen.getByText('Настройки')).toBeInTheDocument()
        expect(screen.getByText('Тарифы')).toBeInTheDocument()
      })
    })
  })

  describe('AC9: Loading State', () => {
    it('should display loading skeleton when user is null', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: null,
          isAuthenticated: false,
          token: null,
        })
      )

      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      // Should show skeleton elements or redirect
      await waitFor(() => {
        // Either shows skeleton or redirects to login
        const hasSkeletons =
          document.querySelectorAll('[data-testid="skeleton"]').length > 0
        const wasRedirected = mockPush.mock.calls.length > 0
        expect(hasSkeletons || wasRedirected).toBe(true)
      })
    })

    it('should render content when user is authenticated Owner', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: { id: '1', email: 'owner@test.com', role: 'Owner' },
          isAuthenticated: true,
          token: 'test-token',
        })
      )

      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        // Should render actual content, not skeleton
        expect(
          screen.getByRole('heading', { name: /управление тарифами/i })
        ).toBeInTheDocument()
      })
    })
  })

  describe('Page Header', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(
        createMockAuth({
          user: { id: '1', email: 'owner@test.com', role: 'Owner' },
          isAuthenticated: true,
          token: 'test-token',
        })
      )
    })

    it('should render page title "Управление тарифами"', async () => {
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /управление тарифами/i })
        ).toBeInTheDocument()
      })
    })

    it('should render page subtitle about Wildberries', async () => {
      const { default: TariffSettingsPage } = await import('../page')
      renderWithProviders(<TariffSettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByText(/настройки глобальных тарифов wildberries/i)
        ).toBeInTheDocument()
      })
    })
  })
})
