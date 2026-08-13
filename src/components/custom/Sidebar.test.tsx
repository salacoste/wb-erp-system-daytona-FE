import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useSupplyPlanning } from '@/hooks/useSupplyPlanning'
import { getUrgentSkuCount } from '@/lib/supply-planning-utils'
import { NAVIGATION_ITEMS } from './sidebar-navigation'
import { resolveNavigationItems } from './sidebar-navigation'

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

vi.mock('./LogoutButton', () => ({
  LogoutButton: () => <button>Logout</button>,
}))

vi.mock('./SidebarCabinetInfo', () => ({
  SidebarCabinetInfo: () => <div>Cabinet context</div>,
}))

vi.mock('./theme-toggle', () => ({
  ThemeToggle: () => <button>Theme context</button>,
}))

// Mock useSupplyPlanning to avoid API calls (Story 6.2)
vi.mock('@/hooks/useSupplyPlanning', () => ({
  useSupplyPlanning: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

vi.mock('@/lib/supply-planning-utils', () => ({
  getUrgentSkuCount: vi.fn(() => 0),
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
  let currentRole = 'Owner'

  const setRole = (role: string) => {
    currentRole = role
    const state = {
      user: { id: '1', email: 'test-user@example.com', role },
      logout: vi.fn(),
    }
    vi.mocked(useAuthStore).mockImplementation(selector =>
      typeof selector === 'function'
        ? selector(state as unknown as Parameters<typeof selector>[0])
        : (state as unknown as ReturnType<typeof useAuthStore>)
    )
  }

  const renderSidebar = () =>
    renderWithQueryClient(
      <Sidebar
        items={resolveNavigationItems({
          role: currentRole,
          urgentCount: vi.mocked(getUrgentSkuCount)({} as Parameters<typeof getUrgentSkuCount>[0]),
        })}
      />
    )

  beforeEach(() => {
    vi.clearAllMocks()
    setRole('Owner')
    vi.mocked(useSupplyPlanning).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplyPlanning>)
    vi.mocked(getUrgentSkuCount).mockReturnValue(0)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders navigation items', { timeout: 5000 }, () => {
    renderSidebar()

    expect(screen.getByRole('complementary', { name: 'Контекст кабинета' })).toBeInTheDocument()
    expect(screen.getByText('Главная')).toBeInTheDocument()
    expect(screen.getByText('Себестоимость')).toBeInTheDocument()
    expect(screen.getByText('Аналитика')).toBeInTheDocument()
    expect(screen.getByText('Настройки')).toBeInTheDocument()
  })

  it('highlights active navigation item', { timeout: 5000 }, () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    renderSidebar()

    const dashboardLink = screen.getByText('Главная').closest('a')
    // Active item has bg-accent class (Tailwind CSS theme class)
    expect(dashboardLink).toHaveClass('bg-accent', 'text-accent-foreground')
    expect(dashboardLink).toHaveAttribute('aria-current', 'page')
  })

  it('highlights active section for nested routes', { timeout: 5000 }, () => {
    vi.mocked(usePathname).mockReturnValue('/analytics/dashboard/details')
    renderSidebar()

    const currentLinks = document.querySelectorAll('[aria-current="page"]')
    expect(currentLinks).toHaveLength(1)
    expect(currentLinks[0]).toHaveAttribute('href', '/analytics/dashboard')
  })

  it('[P0] renders the complete canonical Owner navigation model in canonical order', () => {
    renderSidebar()

    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    const links = within(navigation).getAllByRole('link')
    expect(links.map(link => link.getAttribute('href'))).toEqual(
      NAVIGATION_ITEMS.map(item => item.href)
    )
    expect(links.map(link => link.textContent?.trim())).toEqual(
      NAVIGATION_ITEMS.map(item => item.label)
    )
  })

  it('[P0] preserves the urgent supply badge in the canonical navigation item', () => {
    vi.mocked(useSupplyPlanning).mockReturnValue({
      data: { summary: {} },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplyPlanning>)
    vi.mocked(getUrgentSkuCount).mockReturnValue(7)

    renderSidebar()

    expect(within(screen.getByRole('link', { name: /Планирование/ })).getByText('7')).toBeVisible()
  })

  it('renders logout button', { timeout: 5000 }, () => {
    renderSidebar()

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('has keyboard accessible navigation items', { timeout: 5000 }, () => {
    renderSidebar()

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('href')
      // Links are keyboard accessible by default in Next.js
      expect(link).toBeInTheDocument()
    })
  })

  it('renders Search Analytics navigation item (Epic 71-FE)', { timeout: 5000 }, () => {
    renderSidebar()

    const searchLink = screen.getByRole('link', { name: /Поиск/ })
    expect(searchLink).toBeInTheDocument()
    expect(searchLink).toHaveAttribute('href', '/analytics/search')
  })

  it(
    'renders "Управление моделями" admin link for Owner (Epic 112-FE Story 112.1)',
    { timeout: 5000 },
    () => {
      renderSidebar()

      const adminLink = screen.getByRole('link', { name: /Управление моделями/ })
      expect(adminLink).toBeInTheDocument()
      expect(adminLink).toHaveAttribute('href', '/analytics/ai-admin/models')
    }
  )

  it(
    'does NOT render "Управление моделями" admin link for non-Owner (Epic 112-FE Story 112.1)',
    { timeout: 5000 },
    () => {
      setRole('Manager')
      renderSidebar()

      expect(screen.queryByRole('link', { name: /Управление моделями/ })).not.toBeInTheDocument()
    }
  )

  it('renders "Настройки AI" admin link for Owner (Story 112.2-FE)', { timeout: 5000 }, () => {
    renderSidebar()

    const adminLink = screen.getByRole('link', { name: /Настройки AI/ })
    expect(adminLink).toBeInTheDocument()
    expect(adminLink).toHaveAttribute('href', '/analytics/ai-admin/preferences')
  })

  it(
    'does NOT render "Настройки AI" admin link for non-Owner (Story 112.2-FE)',
    { timeout: 5000 },
    () => {
      setRole('Analyst')
      renderSidebar()

      expect(screen.queryByRole('link', { name: /Настройки AI/ })).not.toBeInTheDocument()
    }
  )

  // 1st-pass review F-9: Manager-vs-Настройки-AI cross-coverage
  it('Manager does NOT see "Настройки AI" sub-item', { timeout: 5000 }, () => {
    setRole('Manager')
    renderSidebar()

    expect(screen.queryByRole('link', { name: /Настройки AI/ })).not.toBeInTheDocument()
  })

  // 1st-pass review F-9: Analyst-vs-Управление-моделями cross-coverage
  // NEW-2: Communications nav item renders + links to /communications.
  it(
    'renders "Сообщения" navigation item linking to /communications (NEW-2)',
    { timeout: 5000 },
    () => {
      renderSidebar()

      const link = screen.getByRole('link', { name: /Сообщения/ })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/communications')
    }
  )

  it('Analyst does NOT see "Управление моделями" sub-item', { timeout: 5000 }, () => {
    setRole('Analyst')
    renderSidebar()

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
      renderSidebar()

      const link = screen.getByRole('link', { name: /Разрешение аномалий/ })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/analytics/ai-admin/anomalies')
    }
  )

  it(
    'Manager does NOT see "Разрешение аномалий" link in sidebar (adminOnly filter is Owner-only)',
    { timeout: 5000 },
    () => {
      setRole('Manager')
      renderSidebar()

      // AC-12 asymmetry: sidebar hides "Разрешение аномалий" from non-Owner BUT component-level guard allows Manager direct-URL access.
      // Manager direct-URL access verified in AnomaliesList.test.tsx — see test "renders page header for Manager role (dual-role gate)" around line 85.
      expect(screen.queryByRole('link', { name: /Разрешение аномалий/ })).not.toBeInTheDocument()
    }
  )

  it('Analyst does NOT see "Разрешение аномалий" link in sidebar', { timeout: 5000 }, () => {
    setRole('Analyst')
    renderSidebar()

    expect(screen.queryByRole('link', { name: /Разрешение аномалий/ })).not.toBeInTheDocument()
  })

  it('Service does NOT see "Разрешение аномалий" link in sidebar', { timeout: 5000 }, () => {
    setRole('Service')
    renderSidebar()

    expect(screen.queryByRole('link', { name: /Разрешение аномалий/ })).not.toBeInTheDocument()
  })
})
