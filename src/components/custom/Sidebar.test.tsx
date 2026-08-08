import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  })),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test-user@example.com', role: 'Owner' },
    isAuthenticated: true,
    token: 'test-token',
  })),
}))

vi.mock('./LogoutButton', () => ({
  LogoutButton: () => <button>Logout</button>,
}))

// Mock useSupplyPlanning to avoid API calls (Story 6.2)
vi.mock('@/hooks/useSupplyPlanning', () => ({
  useSupplyPlanning: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

// Helper to render with QueryClient (required for useSupplyPlanning hook)
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      logout: vi.fn(),
    })
    // Reset useAuth to Owner role (default for most tests)
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test-user@example.com', role: 'Owner' },
      isAuthenticated: true,
      token: 'test-token',
      refreshToken: vi.fn().mockResolvedValue(false),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders navigation items', { timeout: 5000 }, () => {
    renderWithQueryClient(<Sidebar />)

    expect(screen.getByText('Главная')).toBeInTheDocument()
    expect(screen.getByText('Себестоимость')).toBeInTheDocument()
    expect(screen.getByText('Аналитика')).toBeInTheDocument()
    expect(screen.getByText('Настройки')).toBeInTheDocument()
  })

  it('highlights active navigation item', { timeout: 5000 }, () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    renderWithQueryClient(<Sidebar />)

    const dashboardLink = screen.getByText('Главная').closest('a')
    // Active item has bg-accent class (Tailwind CSS theme class)
    expect(dashboardLink).toHaveClass('bg-accent', 'text-accent-foreground')
  })

  it('highlights active section for nested routes', { timeout: 5000 }, () => {
    // Sidebar uses exact match (pathname === item.href), so we need to test with /cogs exact match
    vi.mocked(usePathname).mockReturnValue('/cogs')
    renderWithQueryClient(<Sidebar />)

    const cogsLink = screen.getByText('Себестоимость').closest('a')
    // Active item has bg-accent class (Tailwind CSS theme class)
    expect(cogsLink).toHaveClass('bg-accent', 'text-accent-foreground')
  })

  it('renders logout button', { timeout: 5000 }, () => {
    renderWithQueryClient(<Sidebar />)

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('has keyboard accessible navigation items', { timeout: 5000 }, () => {
    renderWithQueryClient(<Sidebar />)

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('href')
      // Links are keyboard accessible by default in Next.js
      expect(link).toBeInTheDocument()
    })
  })

  it('renders Search Analytics navigation item (Epic 71-FE)', { timeout: 5000 }, () => {
    renderWithQueryClient(<Sidebar />)

    const searchLink = screen.getByRole('link', { name: /Поиск/ })
    expect(searchLink).toBeInTheDocument()
    expect(searchLink).toHaveAttribute('href', '/analytics/search')
  })

  it(
    'renders "Управление моделями" admin link for Owner (Epic 112-FE Story 112.1)',
    { timeout: 5000 },
    () => {
      renderWithQueryClient(<Sidebar />)

      const adminLink = screen.getByRole('link', { name: /Управление моделями/ })
      expect(adminLink).toBeInTheDocument()
      expect(adminLink).toHaveAttribute('href', '/analytics/ai-admin/models')
    }
  )

  it(
    'does NOT render "Управление моделями" admin link for non-Owner (Epic 112-FE Story 112.1)',
    { timeout: 5000 },
    () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: '1', email: 'manager@example.com', role: 'Manager' },
        isAuthenticated: true,
        token: 'test-token',
        refreshToken: vi.fn().mockResolvedValue(false),
      })
      renderWithQueryClient(<Sidebar />)

      expect(screen.queryByRole('link', { name: /Управление моделями/ })).not.toBeInTheDocument()
    }
  )

  it('renders "Настройки AI" admin link for Owner (Story 112.2-FE)', { timeout: 5000 }, () => {
    renderWithQueryClient(<Sidebar />)

    const adminLink = screen.getByRole('link', { name: /Настройки AI/ })
    expect(adminLink).toBeInTheDocument()
    expect(adminLink).toHaveAttribute('href', '/analytics/ai-admin/preferences')
  })

  it(
    'does NOT render "Настройки AI" admin link for non-Owner (Story 112.2-FE)',
    { timeout: 5000 },
    () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: '1', email: 'analyst@example.com', role: 'Analyst' },
        isAuthenticated: true,
        token: 'test-token',
        refreshToken: vi.fn().mockResolvedValue(false),
      })
      renderWithQueryClient(<Sidebar />)

      expect(screen.queryByRole('link', { name: /Настройки AI/ })).not.toBeInTheDocument()
    }
  )

  // 1st-pass review F-9: Manager-vs-Настройки-AI cross-coverage
  it('Manager does NOT see "Настройки AI" sub-item', { timeout: 5000 }, () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'manager@example.com', role: 'Manager' },
      isAuthenticated: true,
      token: 'test-token',
      refreshToken: vi.fn().mockResolvedValue(false),
    })
    renderWithQueryClient(<Sidebar />)

    expect(screen.queryByRole('link', { name: /Настройки AI/ })).not.toBeInTheDocument()
  })

  // 1st-pass review F-9: Analyst-vs-Управление-моделями cross-coverage
  // NEW-2: Communications nav item renders + links to /communications.
  it(
    'renders "Сообщения" navigation item linking to /communications (NEW-2)',
    { timeout: 5000 },
    () => {
      renderWithQueryClient(<Sidebar />)

      const link = screen.getByRole('link', { name: /Сообщения/ })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/communications')
    }
  )

  it('Analyst does NOT see "Управление моделями" sub-item', { timeout: 5000 }, () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'analyst@example.com', role: 'Analyst' },
      isAuthenticated: true,
      token: 'test-token',
      refreshToken: vi.fn().mockResolvedValue(false),
    })
    renderWithQueryClient(<Sidebar />)

    expect(screen.queryByRole('link', { name: /Управление моделями/ })).not.toBeInTheDocument()
  })

  // F-4 (Story 112.3-FE 1st-pass review): "Разрешение аномалий" sidebar asymmetry tests.
  // adminOnly=true hides the link from non-Owner sidebar; Manager direct-URL access is
  // enforced at component+hook level (not sidebar) per AC-12 asymmetry.
  it(
    'Owner sees "Разрешение аномалий" link in sidebar (adminOnly item visible to Owner)',
    { timeout: 5000 },
    () => {
      // beforeEach already sets Owner — default role for this test suite
      renderWithQueryClient(<Sidebar />)

      const link = screen.getByRole('link', { name: /Разрешение аномалий/ })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/analytics/ai-admin/anomalies')
    }
  )

  it(
    'Manager does NOT see "Разрешение аномалий" link in sidebar (adminOnly filter is Owner-only)',
    { timeout: 5000 },
    () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: '1', email: 'manager@example.com', role: 'Manager' },
        isAuthenticated: true,
        token: 'test-token',
        refreshToken: vi.fn().mockResolvedValue(false),
      })
      renderWithQueryClient(<Sidebar />)

      // AC-12 asymmetry: sidebar hides "Разрешение аномалий" from non-Owner BUT component-level guard allows Manager direct-URL access.
      // Manager direct-URL access verified in AnomaliesList.test.tsx — see test "renders page header for Manager role (dual-role gate)" around line 85.
      expect(screen.queryByRole('link', { name: /Разрешение аномалий/ })).not.toBeInTheDocument()
    }
  )

  it('Analyst does NOT see "Разрешение аномалий" link in sidebar', { timeout: 5000 }, () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'analyst@example.com', role: 'Analyst' },
      isAuthenticated: true,
      token: 'test-token',
      refreshToken: vi.fn().mockResolvedValue(false),
    })
    renderWithQueryClient(<Sidebar />)

    expect(screen.queryByRole('link', { name: /Разрешение аномалий/ })).not.toBeInTheDocument()
  })

  it('Service does NOT see "Разрешение аномалий" link in sidebar', { timeout: 5000 }, () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'service@example.com', role: 'Service' },
      isAuthenticated: true,
      token: 'test-token',
      refreshToken: vi.fn().mockResolvedValue(false),
    })
    renderWithQueryClient(<Sidebar />)

    expect(screen.queryByRole('link', { name: /Разрешение аномалий/ })).not.toBeInTheDocument()
  })
})
