import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobileSidebarSheet } from './MobileSidebarSheet'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useSupplyPlanning } from '@/hooks/useSupplyPlanning'
import { getUrgentSkuCount } from '@/lib/supply-planning-utils'
import { NAVIGATION_ITEMS, resolveNavigationItems } from '@/components/custom/sidebar-navigation'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
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

vi.mock('@/components/custom/SidebarCabinetInfo', () => ({
  SidebarCabinetInfo: ({ onNavigate }: { onNavigate?: () => void }) => (
    <button type="button" onClick={onNavigate}>
      Cabinet context
    </button>
  ),
}))

vi.mock('@/components/custom/theme-toggle', () => ({
  ThemeToggle: () => <button>Theme context</button>,
}))

vi.mock('@/components/custom/LogoutButton', () => ({
  LogoutButton: () => <button>Logout context</button>,
}))

let currentRole = 'Owner'

function setRole(role: string): void {
  currentRole = role
  const state = { user: { id: '1', email: 'user@example.com', role } }
  vi.mocked(useAuthStore).mockImplementation(selector =>
    selector(state as Parameters<typeof selector>[0])
  )
}

function resolvedItems() {
  return resolveNavigationItems({
    role: currentRole,
    urgentCount: vi.mocked(getUrgentSkuCount)({} as Parameters<typeof getUrgentSkuCount>[0]),
  })
}

function ControlledMobileSidebarSheet() {
  const [open, setOpen] = useState(false)
  return <MobileSidebarSheet items={resolvedItems()} open={open} onOpenChange={setOpen} />
}

function getMobileNavigationLinks() {
  return within(screen.getByRole('navigation', { name: 'Main navigation' })).getAllByRole('link')
}

let desktopMediaMatches = false
const desktopMediaListeners = new Set<(event: MediaQueryListEvent) => void>()

function enterDesktopViewport(): void {
  desktopMediaMatches = true
  act(() => {
    desktopMediaListeners.forEach(listener =>
      listener({ matches: true, media: '(min-width: 64rem)' } as MediaQueryListEvent)
    )
  })
}

describe('MobileSidebarSheet', () => {
  const renderSheet = (open = true, onOpenChange = vi.fn()) =>
    render(<MobileSidebarSheet items={resolvedItems()} open={open} onOpenChange={onOpenChange} />)

  beforeEach(() => {
    vi.clearAllMocks()
    desktopMediaMatches = false
    desktopMediaListeners.clear()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: desktopMediaMatches,
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          desktopMediaListeners.add(listener)
        },
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          desktopMediaListeners.delete(listener)
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    setRole('Owner')
    vi.mocked(useSupplyPlanning).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplyPlanning>)
    vi.mocked(getUrgentSkuCount).mockReturnValue(0)
  })

  it('renders a native mobile menu button and requests the sheet to open', () => {
    const onOpenChange = vi.fn()

    renderSheet(false, onOpenChange)

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger).toHaveAttribute('type', 'button')
    expect(trigger).toHaveClass('inline-flex', 'lg:hidden')

    fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('[P0] renders the complete canonical Owner model in canonical order', () => {
    renderSheet()

    const links = getMobileNavigationLinks()
    expect(links.map(link => link.getAttribute('href'))).toEqual(
      NAVIGATION_ITEMS.map(item => item.href)
    )
    expect(links.map(link => link.textContent?.trim())).toEqual(
      NAVIGATION_ITEMS.map(item => item.label)
    )
  })

  it('[P0] removes Owner-only items for non-Owner users', () => {
    setRole('Manager')

    renderSheet()

    const hrefs = getMobileNavigationLinks().map(link => link.getAttribute('href'))
    expect(hrefs).not.toContain('/analytics/ai-admin/models')
    expect(hrefs).not.toContain('/analytics/ai-admin/preferences')
    expect(hrefs).not.toContain('/settings/tariffs')
  })

  it('[P0] preserves the urgent supply badge in mobile navigation', () => {
    vi.mocked(useSupplyPlanning).mockReturnValue({
      data: { summary: {} },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplyPlanning>)
    vi.mocked(getUrgentSkuCount).mockReturnValue(9)

    renderSheet()

    expect(within(screen.getByRole('link', { name: /Планирование/ })).getByText('9')).toBeVisible()
  })

  it('[P0] marks exactly one deepest segment-aware route as current', () => {
    vi.mocked(usePathname).mockReturnValue('/analytics/dashboard/details')

    renderSheet()

    const currentLinks = document.querySelectorAll('[aria-current="page"]')
    expect(currentLinks).toHaveLength(1)
    expect(currentLinks[0]).toHaveAttribute('href', '/analytics/dashboard')
  })

  it('[P0] preserves cabinet, theme, and logout context in the mobile shell', () => {
    renderSheet()

    expect(screen.getByRole('complementary', { name: 'Контекст кабинета' })).toBeInTheDocument()
    expect(screen.getByText('Cabinet context')).toBeInTheDocument()
    const themeButton = screen.getByRole('button', { name: 'Theme context' })
    const logoutButton = screen.getByRole('button', { name: 'Logout context' })
    expect(themeButton).toBeInTheDocument()
    expect(logoutButton).toBeInTheDocument()
    expect(themeButton.parentElement).toHaveClass(
      'flex-wrap',
      'flex-col',
      'items-end',
      'justify-end',
      '[&_button]:min-h-11',
      '[&_button]:min-w-11',
      'min-[20rem]:flex-row',
      'min-[20rem]:items-center'
    )
  })

  it('[P1] closes after a navigation link is activated', () => {
    const onOpenChange = vi.fn()
    renderSheet(true, onOpenChange)

    const link = screen.getByRole('link', { name: 'Главная' })
    link.addEventListener('click', event => event.preventDefault())
    fireEvent.click(link)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('[P0] closes after the cabinet context is activated', () => {
    const onOpenChange = vi.fn()
    renderSheet(true, onOpenChange)

    fireEvent.click(screen.getByRole('button', { name: 'Cabinet context' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('[P0] closes when the viewport crosses into the desktop shell', () => {
    const onOpenChange = vi.fn()
    renderSheet(true, onOpenChange)

    enterDesktopViewport()

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('[P0] closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<ControlledMobileSidebarSheet />)

    const trigger = screen.getByRole('button', { name: 'Open menu' })
    await user.click(trigger)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('[P1] keeps one bounded mobile navigation scroller', () => {
    renderSheet()

    expect(screen.getByRole('dialog')).toHaveClass('overflow-hidden')
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveClass(
      'overflow-y-auto'
    )
  })

  it('[P1] bounds the Sheet width to the 195px minimum viewport contract', () => {
    renderSheet()

    expect(screen.getByRole('dialog')).toHaveClass(
      'w-[min(16rem,100vw)]',
      'motion-reduce:!animate-none',
      'motion-reduce:!transition-none'
    )
  })
})
