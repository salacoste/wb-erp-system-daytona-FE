import { render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardLayout from './layout'
import { useAuthStore } from '@/stores/authStore'
import { useSupplyPlanning } from '@/hooks/useSupplyPlanning'
import { getUrgentSkuCount } from '@/lib/supply-planning-utils'
import type { NavigationItem } from '@/components/custom/sidebar-navigation'
import { STORAGE_EVENT_KEY } from '@/stores/authStoreHelpers'

const replace = vi.fn()
const usePathname = vi.fn(() => '/analytics/dashboard')
const renderedNavigationModels = vi.hoisted(() => ({
  desktop: undefined as NavigationItem[] | undefined,
  mobile: undefined as NavigationItem[] | undefined,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ replace }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/hooks/useSupplyPlanning', () => ({
  useSupplyPlanning: vi.fn(),
}))

vi.mock('@/lib/supply-planning-utils', () => ({
  getUrgentSkuCount: vi.fn(() => 0),
}))

vi.mock('@/components/custom/Sidebar', () => ({
  Sidebar: ({ items }: { items: NavigationItem[] }) => {
    renderedNavigationModels.desktop = items
    return <aside aria-label="Desktop navigation">Desktop navigation</aside>
  },
}))

vi.mock('@/components/custom/Navbar', () => ({
  Navbar: () => <div>Navbar</div>,
}))

vi.mock('@/components/custom/dashboard/TokenHealthBanner', () => ({
  TokenHealthBanner: () => <div>Token health</div>,
}))

vi.mock('./layout/MobileSidebarSheet', () => ({
  MobileSidebarSheet: ({ items }: { items: NavigationItem[] }) => {
    renderedNavigationModels.mobile = items
    return <button type="button">Mobile navigation</button>
  },
}))

type AuthState = {
  isAuthenticated: boolean
  token: string | null
  user?: { role: string } | null
}

function setAuthState(state: AuthState): void {
  vi.mocked(useAuthStore).mockReturnValue(state as ReturnType<typeof useAuthStore>)
}

describe('DashboardLayout Story 167.1 shell contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderedNavigationModels.desktop = undefined
    renderedNavigationModels.mobile = undefined
    usePathname.mockReturnValue('/analytics/dashboard')
    vi.mocked(useSupplyPlanning).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplyPlanning>)
    vi.mocked(getUrgentSkuCount).mockReturnValue(0)
    document.cookie = ['auth', '-token=stale; path=/'].join('')
  })

  it('[P0] withholds protected content during the initial hydration render', () => {
    setAuthState({ isAuthenticated: true, token: 'token' })

    const html = renderToStaticMarkup(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    expect(html).toContain('Загрузка...')
    expect(html).not.toContain('Protected report')
  })

  it('[P0] clears the stale cookie and redirects once while preserving the pathname', async () => {
    usePathname.mockReturnValue('/analytics/orders')
    setAuthState({ isAuthenticated: false, token: null })

    render(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    expect(screen.queryByText('Protected report')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(replace).toHaveBeenCalledTimes(1)
    })
    expect(replace).toHaveBeenCalledWith('/login?redirect=%2Fanalytics%2Forders')
    expect(document.cookie).not.toContain(['auth', '-token=stale'].join(''))
  })

  it('[P0] does not duplicate the root auth redirect after a same-tab session ends', async () => {
    setAuthState({ isAuthenticated: true, token: 'token' })

    const { rerender } = render(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    await screen.findByRole('main')
    setAuthState({ isAuthenticated: false, token: null })
    rerender(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    await waitFor(() => {
      expect(screen.getByText('Перенаправление на страницу входа...')).toBeInTheDocument()
    })
    expect(replace).not.toHaveBeenCalled()
  })

  it('[P0] redirects once when another tab ends the authenticated session', async () => {
    setAuthState({ isAuthenticated: true, token: 'token' })

    const { rerender } = render(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    await screen.findByRole('main')
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_EVENT_KEY }))
    setAuthState({ isAuthenticated: false, token: null })
    rerender(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1))
    expect(replace).toHaveBeenCalledWith('/login?redirect=%2Fanalytics%2Fdashboard')
  })

  it('[P0] exposes a skip link and stable main target after authentication resolves', async () => {
    setAuthState({ isAuthenticated: true, token: 'token' })

    render(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    const main = await screen.findByRole('main')
    const skipLink = document.querySelector<HTMLAnchorElement>('a[href="#main-content"]')

    expect(skipLink).toBeInTheDocument()
    expect(main).toHaveAttribute('id', 'main-content')
    expect(main).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Desktop navigation' })).toBeInTheDocument()
    expect(screen.getByText('Protected report')).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it('[P0] supplies one resolved runtime navigation model to both shell renderers', async () => {
    setAuthState({
      isAuthenticated: true,
      token: 'token',
      user: { role: 'Owner' },
    })
    vi.mocked(useSupplyPlanning).mockReturnValue({
      data: { summary: {} },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplyPlanning>)
    vi.mocked(getUrgentSkuCount).mockReturnValue(6)

    render(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    await screen.findByRole('main')
    expect(renderedNavigationModels.desktop).toBe(renderedNavigationModels.mobile)
    expect(
      renderedNavigationModels.desktop?.find(item => item.href === '/analytics/supply-planning')
        ?.badge
    ).toBe(6)
  })

  it('[P1] keeps the shell fixed while main remains the single page-content scroll owner', async () => {
    setAuthState({ isAuthenticated: true, token: 'token' })

    const { container } = render(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    const main = await screen.findByRole('main')
    expect(container.firstElementChild).toHaveClass('fixed', 'inset-0', 'overflow-hidden')
    expect(main).toHaveClass('overflow-y-auto')
    expect(main.parentElement).toHaveClass('overflow-hidden')
  })

  it('[P0] reserves narrow-header space for the mobile menu and logout controls', async () => {
    setAuthState({ isAuthenticated: true, token: 'token' })

    render(
      <DashboardLayout>
        <div>Protected report</div>
      </DashboardLayout>
    )

    await screen.findByRole('main')
    expect(screen.getByRole('banner')).toHaveClass(
      'gap-1',
      'px-2',
      'min-[20rem]:gap-4',
      'min-[20rem]:px-4'
    )
  })
})
