import { readFileSync } from 'node:fs'
import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { axe, toHaveNoViolations } from 'jest-axe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HomePage from './page'
import { ROUTES } from '@/lib/routes'

expect.extend(toHaveNoViolations)

type AuthSnapshot = {
  isAuthenticated: boolean
  token: string | null
}

type FinishHydrationListener = (state: AuthSnapshot) => void

type PersistController = {
  hasHydrated: ReturnType<typeof vi.fn<() => boolean>>
  onFinishHydration: ReturnType<typeof vi.fn<(listener: FinishHydrationListener) => () => void>>
  rehydrate: ReturnType<typeof vi.fn<() => Promise<void>>>
  finish: () => void
  listeners: Set<FinishHydrationListener>
  unsubscribe: ReturnType<typeof vi.fn<() => void>>
}

const runtime = vi.hoisted(() => {
  const auth = {
    current: { isAuthenticated: false, token: null } as AuthSnapshot,
  }
  const useAuthStore = Object.assign(
    vi.fn(() => auth.current),
    {
      getState: vi.fn(() => auth.current),
      persist: undefined as unknown,
    }
  )

  return {
    auth,
    push: vi.fn(),
    replace: vi.fn(),
    useAuthStore,
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: runtime.push, replace: runtime.replace }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: runtime.useAuthStore,
}))

function setAuthState(state: AuthSnapshot): void {
  runtime.auth.current = state
}

function setPersist(persist: PersistController | undefined): void {
  runtime.useAuthStore.persist = persist
}

function createPersistController(initiallyHydrated = false): PersistController {
  let hydrated = initiallyHydrated
  const listeners = new Set<FinishHydrationListener>()
  const unsubscribe = vi.fn()

  const controller: PersistController = {
    hasHydrated: vi.fn(() => hydrated),
    onFinishHydration: vi.fn(listener => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        unsubscribe()
      }
    }),
    rehydrate: vi.fn(() => Promise.resolve()),
    finish: () => {
      hydrated = true
      listeners.forEach(listener => listener(runtime.auth.current))
    },
    listeners,
    unsubscribe,
  }

  return controller
}

describe('Story 167.2 root entry contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    setAuthState({ isAuthenticated: false, token: null })
    setPersist(createPersistController())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('[P0] starts with one bounded semantic hydration state and never navigates during SSR', () => {
    setAuthState({ isAuthenticated: true, token: 'persisted-token' })

    const html = renderToStaticMarkup(<HomePage />)

    expect(html).toContain('<main')
    expect(html).toContain('Проверяем сессию')
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('max-w-lg')
    expect(runtime.replace).not.toHaveBeenCalled()
    expect(runtime.push).not.toHaveBeenCalled()
  })

  it('[P0] waits for delayed hydration, then replaces root with dashboard exactly once', async () => {
    const persist = createPersistController()
    setPersist(persist)
    setAuthState({ isAuthenticated: true, token: 'persisted-token' })

    render(<HomePage />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Проверяем сессию' })).toHaveAttribute(
      'data-state',
      'loading'
    )
    expect(runtime.replace).not.toHaveBeenCalled()

    act(() => persist.finish())

    const redirectingState = screen.getByRole('region', { name: 'Переходим в приложение' })
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(redirectingState).toHaveAttribute('data-state', 'processing')
    expect(redirectingState).toHaveAttribute('aria-busy', 'true')
    await waitFor(() => expect(runtime.replace).toHaveBeenCalledTimes(1))
    expect(runtime.replace).toHaveBeenCalledWith(ROUTES.DASHBOARD)
    expect(runtime.push).not.toHaveBeenCalled()
  })

  it('[P0] subscribes before checking already-complete hydration and replaces with login once', async () => {
    const persist = createPersistController(true)
    setPersist(persist)

    render(<HomePage />)

    await waitFor(() => expect(runtime.replace).toHaveBeenCalledTimes(1))
    expect(runtime.replace).toHaveBeenCalledWith(ROUTES.LOGIN)
    expect(persist.onFinishHydration).toHaveBeenCalledTimes(1)
    expect(persist.onFinishHydration.mock.invocationCallOrder[0]).toBeLessThan(
      persist.hasHydrated.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    )
  })

  it('[P0] closes a completion race that happens while the finish listener is registered', async () => {
    const persist = createPersistController()
    persist.onFinishHydration.mockImplementation(listener => {
      persist.listeners.add(listener)
      persist.finish()
      return () => {
        persist.listeners.delete(listener)
        persist.unsubscribe()
      }
    })
    setPersist(persist)
    setAuthState({ isAuthenticated: true, token: 'persisted-token' })

    render(<HomePage />)

    await waitFor(() => expect(runtime.replace).toHaveBeenCalledTimes(1))
    expect(runtime.replace).toHaveBeenCalledWith(ROUTES.DASHBOARD)
    expect(persist.onFinishHydration.mock.invocationCallOrder[0]).toBeLessThan(
      persist.hasHydrated.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    )
  })

  it.each([
    [{ isAuthenticated: true, token: null }, 'authenticated without token'],
    [{ isAuthenticated: false, token: 'orphan-token' }, 'token without authenticated flag'],
  ] satisfies ReadonlyArray<readonly [AuthSnapshot, string]>)(
    '[P0] preserves the login destination for partial auth: %s (%s)',
    async (state, _description) => {
      setAuthState(state)
      setPersist(createPersistController(true))

      render(<HomePage />)

      await waitFor(() => expect(runtime.replace).toHaveBeenCalledTimes(1))
      expect(runtime.replace).toHaveBeenCalledWith(ROUTES.LOGIN)
    }
  )

  it('[P0] prevents duplicate navigation under Strict Mode and later rerenders', async () => {
    setAuthState({ isAuthenticated: true, token: 'persisted-token' })
    setPersist(createPersistController(true))

    const { rerender } = render(
      <StrictMode>
        <HomePage />
      </StrictMode>
    )

    await waitFor(() => expect(runtime.replace).toHaveBeenCalledTimes(1))
    setAuthState({ isAuthenticated: false, token: null })
    rerender(
      <StrictMode>
        <HomePage />
      </StrictMode>
    )

    expect(runtime.replace).toHaveBeenCalledTimes(1)
    expect(runtime.replace).toHaveBeenCalledWith(ROUTES.DASHBOARD)
  })

  it('[P0] reloads the root entry when the persist runtime is missing without navigating or moving focus', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    setPersist(undefined)

    render(<HomePage />)

    const alert = await screen.findByRole('alert', { name: 'Не удалось проверить сессию' })
    expect(alert).toBeInTheDocument()
    const reloadButton = screen.getByRole('button', { name: 'Перезагрузить страницу' })
    expect(reloadButton).toHaveClass('min-h-11')

    fireEvent.click(reloadButton)

    expect(reload).toHaveBeenCalledTimes(1)
    expect(runtime.replace).not.toHaveBeenCalled()
    expect(runtime.push).not.toHaveBeenCalled()
    expect(focus).not.toHaveBeenCalled()
  })

  it('[P1] has no automated accessibility violations in hydrating or error states', async () => {
    const { container, unmount } = render(<HomePage />)

    expect(await axe(container)).toHaveNoViolations()

    unmount()
    setPersist(undefined)
    const errorView = render(<HomePage />)
    await screen.findByRole('alert', { name: 'Не удалось проверить сессию' })

    expect(await axe(errorView.container)).toHaveNoViolations()
  })

  it('[P0] bounds stuck hydration and reloads without guessing an auth destination', async () => {
    vi.useFakeTimers()
    const persist = createPersistController()
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })
    setPersist(persist)

    render(<HomePage />)
    expect(screen.getByRole('status', { name: 'Проверяем сессию' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
    expect(vi.getTimerCount()).toBe(1)
    expect(runtime.replace).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(4_999)
    })

    expect(screen.getByRole('status', { name: 'Проверяем сессию' })).toBeInTheDocument()
    expect(runtime.replace).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(screen.getByRole('alert', { name: 'Не удалось проверить сессию' })).toBeInTheDocument()
    expect(persist.listeners).toHaveLength(0)
    expect(runtime.replace).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Перезагрузить страницу' }))

    expect(reload).toHaveBeenCalledTimes(1)
    expect(persist.rehydrate).not.toHaveBeenCalled()
    expect(runtime.replace).not.toHaveBeenCalled()
  })

  it('[P0] keeps timeout failure terminal when hydration finishes before React cleanup', async () => {
    vi.useFakeTimers()
    const persist = createPersistController()
    setPersist(persist)

    render(<HomePage />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
      persist.finish()
    })

    expect(screen.getByRole('alert', { name: 'Не удалось проверить сессию' })).toBeInTheDocument()
    expect(runtime.replace).not.toHaveBeenCalled()
  })

  it('[P0] contains a synchronous finish-listener subscription failure', async () => {
    const persist = createPersistController()
    persist.onFinishHydration.mockImplementationOnce(() => {
      throw new Error('subscription unavailable')
    })
    setPersist(persist)

    render(<HomePage />)

    expect(
      await screen.findByRole('alert', { name: 'Не удалось проверить сессию' })
    ).toBeInTheDocument()
    expect(runtime.replace).not.toHaveBeenCalled()
  })

  it('[P0] contains a synchronous hydration-readiness failure and unsubscribes', async () => {
    const persist = createPersistController()
    persist.hasHydrated.mockImplementationOnce(() => {
      throw new Error('readiness unavailable')
    })
    setPersist(persist)

    render(<HomePage />)

    expect(
      await screen.findByRole('alert', { name: 'Не удалось проверить сессию' })
    ).toBeInTheDocument()
    expect(persist.unsubscribe).toHaveBeenCalledTimes(1)
    expect(runtime.replace).not.toHaveBeenCalled()
  })

  it('[P1] unsubscribes hydration observation and clears the bound on unmount', () => {
    vi.useFakeTimers()
    const persist = createPersistController()
    setPersist(persist)

    const { unmount } = render(<HomePage />)
    expect(persist.listeners).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(persist.listeners).toHaveLength(0)
    expect(persist.unsubscribe).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('[P0] keeps root implementation inside its hydration and presentation boundary', () => {
    const source = readFileSync('src/app/page.tsx', 'utf8')

    expect(source).not.toMatch(/setTimeout\s*\(\s*\(\)\s*=>[\s\S]{0,300},\s*100\s*\)/)
    expect(source).not.toMatch(/router\.push/)
    expect(source).not.toMatch(/@\/hooks\/useAuth|AuthProvider|login\(|logout\(|refreshToken\(/)
    expect(source).not.toMatch(/localStorage|sessionStorage|document\.cookie|setAuthCookie/)
    expect(source).not.toMatch(/\.rehydrate\s*\(/)
    expect(source).not.toMatch(
      /text-(red|green|blue|yellow|gray)-|bg-(red|green|blue|yellow|gray)-/
    )
    expect(source).toContain("from '@/components/product/states'")
    expect(source).toContain("from '@/components/ui/button'")
    expect(source).toMatch(/HYDRATION_TIMEOUT_MS\s*=\s*5_000/)
    expect(source).toMatch(/router\.replace/)
  })
})
