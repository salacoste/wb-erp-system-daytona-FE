import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { SettingsNav } from '../SettingsNav'

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: vi.fn() }))

const LABELS = ['Обзор', 'Кабинет', 'Уведомления', 'Налоги', 'Тарифы', 'Расходы', 'Импорт']
const HREFS = [
  '/settings',
  '/settings/cabinet',
  '/settings/notifications',
  '/settings/tax',
  '/settings/tariffs',
  '/settings/expenses',
  '/settings/backfill',
]

let desktopMatches = false
const desktopListeners = new Set<(event: MediaQueryListEvent) => void>()

function setRole(role: 'Owner' | 'Manager' | 'Analyst' | 'Service'): void {
  const state = { user: { id: '1', email: 'person@example.com', role } }
  vi.mocked(useAuthStore).mockImplementation(selector =>
    selector(state as Parameters<typeof selector>[0])
  )
}

function desktopNav(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Разделы настроек' })
}

async function openCompactNav(): Promise<{
  trigger: HTMLElement
  dialog: HTMLElement
  navigation: HTMLElement
}> {
  const user = userEvent.setup()
  const trigger = screen.getByRole('button', { name: 'Открыть разделы настроек' })
  await user.click(trigger)
  const dialog = await screen.findByRole('dialog')
  return {
    trigger,
    dialog,
    navigation: within(dialog).getByRole('navigation', { name: 'Разделы настроек' }),
  }
}

function enterDesktopViewport(): void {
  desktopMatches = true
  act(() => {
    desktopListeners.forEach(listener =>
      listener({ matches: true, media: '(min-width: 64rem)' } as MediaQueryListEvent)
    )
  })
}

describe('SettingsNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    desktopMatches = false
    desktopListeners.clear()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: desktopMatches,
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          desktopListeners.add(listener)
        },
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          desktopListeners.delete(listener)
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    vi.mocked(usePathname).mockReturnValue('/settings')
    setRole('Owner')
  })

  it('renders the canonical seven-link Owner model in order in a named desktop navigation', () => {
    render(<SettingsNav />)

    const links = within(desktopNav()).getAllByRole('link')
    expect(links.map(link => link.textContent?.trim())).toEqual(LABELS)
    expect(links.map(link => link.getAttribute('href'))).toEqual(HREFS)
  })

  it.each([
    ['/settings', 'Обзор'],
    ['/settings/cabinet', 'Кабинет'],
    ['/settings/notifications', 'Уведомления'],
    ['/settings/tax', 'Налоги'],
    ['/settings/tariffs', 'Тарифы'],
    ['/settings/expenses', 'Расходы'],
    ['/settings/backfill', 'Импорт'],
  ])('selects the exact root or deepest settings segment for %s', (pathname, activeLabel) => {
    vi.mocked(usePathname).mockReturnValue(pathname)
    render(<SettingsNav />)

    const current = within(desktopNav()).getByRole('link', { current: 'page' })
    expect(current).toHaveAccessibleName(activeLabel)
  })

  it('keeps a nested path current on its owning settings item', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/notifications/history')
    render(<SettingsNav />)

    const current = within(desktopNav()).getByRole('link', { current: 'page' })
    expect(current).toHaveAccessibleName('Уведомления')
  })

  it.each(['Manager', 'Analyst', 'Service'] as const)(
    'keeps Owner-only destinations visible but unavailable for %s',
    role => {
      setRole(role)
      render(<SettingsNav />)

      const nav = within(desktopNav())
      expect(nav.getAllByRole('link')).toHaveLength(5)
      for (const label of ['Тарифы', 'Импорт']) {
        expect(nav.queryByRole('link', { name: new RegExp(label) })).not.toBeInTheDocument()
        const restricted = nav.getByText(label).closest('[aria-disabled="true"]')
        expect(restricted).toBeInTheDocument()
        expect(restricted).toHaveTextContent('Только для владельца')
      }
    }
  )

  it.each(
    (['Manager', 'Analyst', 'Service'] as const).flatMap(role => [
      [role, '/settings/tariffs', 'Тарифы'],
      [role, '/settings/backfill', 'Импорт'],
    ])
  )(
    'keeps the restricted current route visible for %s at %s',
    async (role, pathname, activeLabel) => {
      setRole(role)
      vi.mocked(usePathname).mockReturnValue(pathname)
      render(<SettingsNav />)

      const desktopCurrent = within(desktopNav()).getByText(activeLabel).closest('[aria-disabled]')
      expect(desktopCurrent).toHaveAttribute('aria-disabled', 'true')
      expect(desktopCurrent).toHaveAttribute('aria-current', 'page')
      expect(desktopCurrent).toHaveClass('bg-primary/10', 'text-primary')

      const { navigation } = await openCompactNav()
      expect(within(navigation).getAllByRole('link')).toHaveLength(5)
      for (const label of ['Тарифы', 'Импорт']) {
        expect(
          within(navigation).queryByRole('link', { name: new RegExp(label) })
        ).not.toBeInTheDocument()
        const restricted = within(navigation).getByText(label).closest('[aria-disabled="true"]')
        expect(restricted).toHaveTextContent('Только для владельца')
        expect(restricted).not.toHaveAttribute('tabindex')
      }
      const compactCurrent = within(navigation).getByText(activeLabel).closest('[aria-disabled]')
      expect(compactCurrent).toHaveAttribute('aria-disabled', 'true')
      expect(compactCurrent).toHaveAttribute('aria-current', 'page')
      expect(compactCurrent).toHaveClass('bg-primary/10', 'text-primary')
    }
  )

  it('opens a bounded left Sheet with the same ordered navigation and current item', async () => {
    vi.mocked(usePathname).mockReturnValue('/settings/tax')
    render(<SettingsNav />)

    const { trigger, dialog, navigation } = await openCompactNav()
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger).toHaveAttribute('type', 'button')
    expect(trigger).toHaveClass('size-11', 'lg:hidden')
    expect(dialog).toHaveAttribute('data-side', 'left')
    expect(dialog).toHaveClass(
      'w-[min(20rem,100vw)]',
      'overflow-hidden',
      'motion-reduce:!animate-none',
      'motion-reduce:!transition-none'
    )
    expect(within(dialog).getByRole('heading', { name: 'Разделы настроек' })).toBeInTheDocument()
    expect(within(dialog).getByText(/выберите раздел/i)).toBeInTheDocument()
    expect(
      within(navigation)
        .getAllByRole('link')
        .map(link => link.textContent?.trim())
    ).toEqual(LABELS)
    expect(within(navigation).getByRole('link', { current: 'page' })).toHaveAccessibleName('Налоги')
    expect(navigation).toHaveClass('overflow-y-auto')
    expect(within(dialog).getAllByRole('navigation')).toHaveLength(1)
  })

  it('closes after compact navigation and on the desktop transition', async () => {
    const user = userEvent.setup()
    render(<SettingsNav />)

    let compact = await openCompactNav()
    const cabinet = within(compact.navigation).getByRole('link', { name: 'Кабинет' })
    cabinet.addEventListener('click', event => event.preventDefault())
    await user.click(cabinet)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    compact = await openCompactNav()
    enterDesktopViewport()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('uses Radix Escape handling, focus containment, and deterministic trigger return', async () => {
    const user = userEvent.setup()
    render(<SettingsNav />)

    const { trigger, dialog } = await openCompactNav()
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))

    for (let index = 0; index < 12; index += 1) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }

    for (let index = 0; index < 12; index += 1) {
      await user.tab({ shift: true })
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })
})
