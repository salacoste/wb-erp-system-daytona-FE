import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './fixtures/network-test'
import { ROUTES, SELECTORS, TIMEOUTS } from './fixtures/test-data'

const DESKTOP_WIDTHS = [1024, 1280, 1440, 1600] as const
const SYNTHETIC_EMAIL = 'story-167-3@example.test'
const SYNTHETIC_PASSWORD = 'synthetic-login-password'
const LOGIN_ENDPOINT = '**/v1/auth/login'
const DASHBOARD_ENDPOINT = '**/dashboard'
const LOGIN_WIDTHS = [320, 390, 768, 1024, 1280, 1440] as const
const LOGIN_STATES = [
  'default',
  'invalid',
  'credential-error',
  'network-error',
  'submitting',
  'success',
  'session-expired',
] as const
type LoginState = (typeof LOGIN_STATES)[number]
const LOCAL_FUTURE_JWT = [
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
  'eyJleHAiOjQxMDI0NDQ4MDB9',
  'story-167-3',
].join('.')

const normalizePageErrorMessage = (error: Error): string => {
  const rawMessage = error.message || error.name || 'Unknown page error'

  return (
    rawMessage
      .replaceAll(SYNTHETIC_EMAIL, '<email>')
      .replaceAll(SYNTHETIC_PASSWORD, '<credential>')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '<email>')
      .replace(/\b(?:Bearer|Basic)\s+[A-Z0-9._~+/-]+=*/gi, '<credential>')
      .replace(
        /\b(?:password|credential|secret|authorization|cookie|token)\b\s*[:=]\s*[^\s,;)]+/gi,
        '<credential>'
      )
      .replace(/\beyJ[A-Z0-9_-]*(?:\.[A-Z0-9_-]+){2,}\b/gi, '<token>')
      .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '<identifier>')
      .replace(/\b[A-Z0-9_-]{32,}\b/gi, '<opaque-value>')
      .replace(/\b(?:https?|wss?|file|blob|data):[^\s"'<>]+/gi, '<url>')
      .replace(/\b(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:\/[^\s"'<>]*)?/gi, '<url>')
      .replace(/(^|[\s(])\/{1,2}[^\s"'<>)]*/g, '$1<url>')
      .replace(/"[^"\r\n]*"|'[^'\r\n]*'|`[^`\r\n]*`/g, '<value>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240) || '<empty page error message>'
  )
}

test.describe('Story 167.3 unauthenticated login', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('renders semantic re-authentication context without protected content', async ({ page }) => {
    await page.goto('/login?redirect=%2Forders%3Fweek%3D2026-W32%23row-1', {
      waitUntil: 'domcontentloaded',
    })

    const main = page.getByRole('main')
    await expect(main).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Войти в аккаунт', level: 1 })).toBeVisible()
    await expect(page.getByText(/сессия истекла|войдите повторно/i)).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0)
  })

  test('retains email and clears and focuses password after invalid credentials', async ({
    page,
  }) => {
    let requestCount = 0
    await page.route(LOGIN_ENDPOINT, route => {
      requestCount += 1
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'synthetic rejection' }),
      })
    })
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' })

    const email = page.getByLabel(/^email/i)
    const password = page.getByLabel(/^пароль/i)
    await email.fill(SYNTHETIC_EMAIL)
    await password.fill(SYNTHETIC_PASSWORD)
    const loginRequest = page.waitForRequest(
      request => request.url().endsWith('/v1/auth/login') && request.method() === 'POST'
    )
    await password.press('Enter')
    await loginRequest

    const feedback = page.locator('#login-request-feedback')
    await expect(feedback).toContainText('Неверный email или пароль')
    await expect(email).toHaveValue(SYNTHETIC_EMAIL)
    await expect(password).toHaveValue('')
    await expect(password).toBeFocused()
    expect(requestCount).toBe(1)
    expect(page.url()).not.toContain(SYNTHETIC_PASSWORD)
  })

  test('submits once by keyboard and rejects a protocol-relative redirect', async ({ page }) => {
    let requestCount = 0
    await page.route(LOGIN_ENDPOINT, route => {
      requestCount += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: LOCAL_FUTURE_JWT,
          user: {
            id: 'story-167-3-user',
            email: SYNTHETIC_EMAIL,
            role: 'Owner',
            cabinet_ids: [],
          },
        }),
      })
    })
    await page.goto('/login?redirect=%2F%2Fevil.example%2Fphish', {
      waitUntil: 'domcontentloaded',
    })

    await page.getByLabel(/^email/i).fill(SYNTHETIC_EMAIL)
    const password = page.getByLabel(/^пароль/i)
    await password.fill(SYNTHETIC_PASSWORD)
    const loginRequest = page.waitForRequest(
      request => request.url().endsWith('/v1/auth/login') && request.method() === 'POST'
    )
    await password.press('Enter')
    await loginRequest

    await expect(page).toHaveURL(/http:\/\/localhost:3100\/dashboard(?:\?|$)/)
    expect(requestCount).toBe(1)
    expect(page.url()).not.toContain(SYNTHETIC_PASSWORD)
  })

  test('recovers from a network failure through the mobile-width primary action', async ({
    page,
  }) => {
    let requestCount = 0
    let expectedInjectedConsoleErrors = 0
    let unexpectedConsoleErrors = 0
    const unexpectedPageErrors: string[] = []
    page.on('console', message => {
      if (message.type() !== 'error') return

      if (/Failed to load resource.*503|API Error \[503\]/i.test(message.text())) {
        expectedInjectedConsoleErrors += 1
      } else {
        unexpectedConsoleErrors += 1
      }
    })
    page.on('pageerror', error => unexpectedPageErrors.push(normalizePageErrorMessage(error)))
    await page.route(LOGIN_ENDPOINT, route => {
      requestCount += 1
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'synthetic service outage' }),
      })
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' })

    const email = page.getByLabel(/^email/i)
    const password = page.getByLabel(/^пароль/i)
    const submit = page.getByRole('button', { name: 'Войти' })
    await email.fill(SYNTHETIC_EMAIL)
    await password.fill(SYNTHETIC_PASSWORD)
    const submitBox = await submit.boundingBox()
    expect(submitBox).not.toBeNull()
    const loginRequest = page.waitForRequest(
      request => request.url().endsWith('/v1/auth/login') && request.method() === 'POST'
    )
    await submit.click()
    await loginRequest

    await expect(page.locator('#login-request-feedback')).toContainText(
      /не удалось подключиться|сервис временно недоступен/i
    )
    await expect(email).toHaveValue(SYNTHETIC_EMAIL)
    await expect(password).toHaveValue('')
    await expect(password).toBeFocused()
    expect(requestCount).toBe(1)
    expect(page.url()).not.toContain(SYNTHETIC_PASSWORD)

    await password.fill(SYNTHETIC_PASSWORD)
    expect(requestCount).toBe(1)
    expect(page.url()).not.toContain(SYNTHETIC_PASSWORD)
    const deliberateRetryResponse = page.waitForResponse(
      response =>
        response.url().endsWith('/v1/auth/login') &&
        response.request().method() === 'POST' &&
        response.status() === 503
    )
    await submit.click()
    await deliberateRetryResponse

    await expect(page.locator('#login-request-feedback')).toContainText(
      /не удалось подключиться|сервис временно недоступен/i
    )
    await expect(email).toHaveValue(SYNTHETIC_EMAIL)
    await expect(password).toHaveValue('')
    await expect(password).toBeFocused()
    expect(requestCount).toBe(2)
    expect(page.url()).not.toContain(SYNTHETIC_PASSWORD)
    expect(expectedInjectedConsoleErrors).toBeGreaterThan(0)
    expect(unexpectedConsoleErrors).toBe(0)
    expect(unexpectedPageErrors).toEqual([])
  })

  test('covers every required state across widths and themes without browser errors', async ({
    page,
  }) => {
    test.slow()
    let activeState: LoginState = 'default'
    let expectedConsoleErrors = 0
    const unexpectedConsoleErrorsByState = Object.fromEntries(
      LOGIN_STATES.map(state => [state, 0])
    ) as Record<(typeof LOGIN_STATES)[number], number>
    const pageErrorMessagesByState: Partial<Record<LoginState, Record<string, number>>> = {}
    page.on('console', message => {
      if (message.type() !== 'error') return

      const category = message.text()
      const isExpectedInjectedFailure =
        (activeState === 'credential-error' &&
          (/Failed to load resource.*401/i.test(category) ||
            /API Error \[401\]/i.test(category))) ||
        ((activeState === 'network-error' || activeState === 'submitting') &&
          (/Failed to load resource.*503/i.test(category) || /API Error \[503\]/i.test(category)))

      if (isExpectedInjectedFailure) expectedConsoleErrors += 1
      else unexpectedConsoleErrorsByState[activeState] += 1
    })
    page.on('pageerror', error => {
      const normalizedMessage = normalizePageErrorMessage(error)
      const messageCounts = (pageErrorMessagesByState[activeState] ??= {})
      messageCounts[normalizedMessage] = (messageCounts[normalizedMessage] ?? 0) + 1
    })
    await page.addInitScript(() => {
      const theme = window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
      window.localStorage.setItem('theme', theme)
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    let hasNavigated = false
    for (const theme of ['light', 'dark'] as const) {
      if (hasNavigated) {
        await page.evaluate(value => window.localStorage.setItem('theme', value), theme)
      }

      for (const width of LOGIN_WIDTHS) {
        await page.setViewportSize({ width, height: 900 })

        for (const state of LOGIN_STATES) {
          let dashboardRequestStarted: Promise<void> | undefined
          let releaseDashboardResponse: (() => void) | undefined
          let releaseSubmittingRequest: (() => void) | undefined
          activeState = state
          const redirect = state === 'session-expired' ? '?redirect=%2Forders' : ''
          await page.goto(`/login${redirect}`, { waitUntil: 'domcontentloaded' })
          hasNavigated = true
          await expect(page.locator('html')).toHaveClass(
            theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
          )

          const form = page.getByRole('form', { name: 'Форма входа' })
          const email = form.locator('input[name="email"]')
          const password = form.locator('input[name="password"]')
          const submit = page.getByRole('button', { name: 'Войти' })
          await expect(submit).toBeVisible()
          await expect(email).toBeEnabled()
          const fillCredentials = async (): Promise<void> => {
            await email.fill(SYNTHETIC_EMAIL)
            await expect(email).toHaveValue(SYNTHETIC_EMAIL)
            await email.press('Tab')
            await expect(password).toBeFocused()
            await password.fill(SYNTHETIC_PASSWORD)
            await expect(password).toHaveValue(SYNTHETIC_PASSWORD)
          }

          if (state === 'invalid') {
            await submit.click()
            await expect(page.getByText('Email обязателен')).toBeVisible()
          }

          if (state === 'credential-error' || state === 'network-error') {
            const status = state === 'credential-error' ? 401 : 503
            await page.route(
              LOGIN_ENDPOINT,
              route => route.fulfill({ status, contentType: 'application/json', body: '{}' }),
              { times: 1 }
            )
            await fillCredentials()
            await expect(email).toHaveValue(SYNTHETIC_EMAIL)
            await expect(password).toHaveValue(SYNTHETIC_PASSWORD)
            await submit.click()
            await expect(page.locator('#login-request-feedback')).toBeVisible()
          }

          if (state === 'submitting') {
            await page.route(
              LOGIN_ENDPOINT,
              async route => {
                await new Promise<void>(resolve => {
                  releaseSubmittingRequest = resolve
                })
                await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
              },
              { times: 1 }
            )
            await fillCredentials()
            await expect(email).toHaveValue(SYNTHETIC_EMAIL)
            await expect(password).toHaveValue(SYNTHETIC_PASSWORD)
            await submit.click()
            await expect(page.getByRole('button', { name: 'Вход...' })).toHaveAttribute(
              'aria-busy',
              'true'
            )
          }

          if (state === 'success') {
            let markDashboardRequestStarted!: () => void
            dashboardRequestStarted = new Promise<void>(resolve => {
              markDashboardRequestStarted = resolve
            })
            const dashboardResponseReleased = new Promise<void>(resolve => {
              releaseDashboardResponse = resolve
            })
            await page.route(
              DASHBOARD_ENDPOINT,
              async route => {
                markDashboardRequestStarted()
                await dashboardResponseReleased
                await route.fulfill({
                  status: 200,
                  contentType: 'text/html',
                  body: '<!doctype html><html lang="ru"><title>Success destination</title></html>',
                })
              },
              { times: 1 }
            )
            await page.route(
              LOGIN_ENDPOINT,
              route =>
                route.fulfill({
                  status: 200,
                  contentType: 'application/json',
                  body: JSON.stringify({
                    access_token: LOCAL_FUTURE_JWT,
                    user: {
                      id: 'story-167-3-user',
                      email: SYNTHETIC_EMAIL,
                      role: 'Owner',
                      cabinet_ids: [],
                    },
                  }),
                }),
              { times: 1 }
            )
            await fillCredentials()
            await expect(email).toHaveValue(SYNTHETIC_EMAIL)
            await expect(password).toHaveValue(SYNTHETIC_PASSWORD)
            await submit.click()
            await expect(page.getByRole('button', { name: 'Вход...' })).toHaveAttribute(
              'aria-busy',
              'true'
            )
            expect(page.url()).not.toContain(SYNTHETIC_PASSWORD)
          }

          if (state === 'session-expired') {
            await expect(page.getByText(/сессия истекла|войдите повторно/i)).toBeVisible()
          }

          const geometry = await form.evaluate(formElement => ({
            controls: [
              ['email', 'input[name="email"]'],
              ['password', 'input[name="password"]'],
              ['submit', 'button[type="submit"]'],
            ].map(([controlName, selector]) => {
              const control = formElement.querySelector<HTMLElement>(selector)

              if (!control) return { controlName, rectangle: null }

              const { height, width } = control.getBoundingClientRect()
              return { controlName, rectangle: { height, width } }
            }),
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
          }))
          expect(
            geometry.documentWidth,
            `${state}: no overflow at ${width}px in ${theme}`
          ).toBeLessThanOrEqual(geometry.viewportWidth)

          for (const { controlName, rectangle } of geometry.controls) {
            expect(
              rectangle,
              `${state}: ${controlName} geometry at ${width}px in ${theme}`
            ).not.toBeNull()
            expect(
              rectangle?.width,
              `${state}: ${controlName} touch width at ${width}px in ${theme}`
            ).toBeGreaterThanOrEqual(44)
            expect(
              rectangle?.height,
              `${state}: ${controlName} touch height at ${width}px in ${theme}`
            ).toBeGreaterThanOrEqual(44)
          }

          // Run axe on the stable default state at the most constrained viewport in both
          // themes. The component suite separately scans default and request-error DOM, while
          // this matrix proves geometry, overflow, touch targets, and state behavior for all
          // 84 required width/theme/state combinations without duplicating semantic scans.
          if (width === LOGIN_WIDTHS[0] && state === 'default') {
            const analysis = new AxeBuilder({ page })
              .include('main')
              .withTags(['wcag2a', 'wcag2aa'])
              .analyze()
            const results = await analysis
            expect(results.violations, `${state}: axe at ${width}px in ${theme}`).toEqual([])
          }

          if (releaseSubmittingRequest) {
            releaseSubmittingRequest()
            await expect(page.locator('#login-request-feedback')).toBeVisible()
          }

          if (releaseDashboardResponse) {
            await dashboardRequestStarted
            releaseDashboardResponse()
            await expect(page).toHaveTitle('Success destination')
            await expect(page).toHaveURL(/\/dashboard(?:\?|$)/)
            await page.context().clearCookies()
            await page.evaluate(() => window.localStorage.removeItem('auth-storage'))
          }
        }
      }
    }

    // A 1440px desktop at 200% zoom exposes a 720 CSS-pixel reflow viewport.
    await page.setViewportSize({ width: 720, height: 900 })
    const reflowGeometry = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }))
    expect(reflowGeometry.documentWidth).toBeLessThanOrEqual(reflowGeometry.viewportWidth)

    await page.setViewportSize({ width: 320, height: 900 })
    const form = page.getByRole('form', { name: 'Форма входа' })
    const email = form.locator('input[name="email"]')
    const password = form.locator('input[name="password"]')
    const submit = page.getByRole('button', { name: 'Войти' })
    const expectVisibleFocusIndicator = async (
      locator: typeof email,
      controlName: string
    ): Promise<void> => {
      const focusIndicator = await locator.evaluate(element => {
        const styles = window.getComputedStyle(element)
        const outlineIsVisible =
          styles.outlineStyle !== 'none' && Number.parseFloat(styles.outlineWidth) > 0
        const ringIsVisible = styles.boxShadow !== 'none'

        return { outlineIsVisible, ringIsVisible }
      })

      expect(
        focusIndicator.outlineIsVisible || focusIndicator.ringIsVisible,
        `${controlName}: visible keyboard focus indicator at 320px`
      ).toBe(true)
    }

    await email.focus()
    await page.keyboard.press('Tab')
    await expect(password).toBeFocused()
    await expectVisibleFocusIndicator(password, 'password')
    await page.keyboard.press('Shift+Tab')
    await expect(email).toBeFocused()
    await expectVisibleFocusIndicator(email, 'email')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(submit).toBeFocused()
    await expectVisibleFocusIndicator(submit, 'submit')

    const assertWrappedInsideForm = async (
      locator: typeof email,
      copyName: string
    ): Promise<void> => {
      const layout = await locator.evaluate(element => {
        const copy = element.getBoundingClientRect()
        const form = element.closest('form')?.getBoundingClientRect()
        const styles = window.getComputedStyle(element)
        const lineHeight = Number.parseFloat(styles.lineHeight)

        return {
          copyBottom: copy.bottom,
          copyHeight: copy.height,
          copyLeft: copy.left,
          copyRight: copy.right,
          formBottom: form?.bottom ?? 0,
          formLeft: form?.left ?? 0,
          formRight: form?.right ?? 0,
          lineHeight,
          noHorizontalClipping: element.scrollWidth <= element.clientWidth,
          noVerticalClipping: element.scrollHeight <= element.clientHeight,
        }
      })

      expect(layout.copyLeft, `${copyName}: left containment at 320px`).toBeGreaterThanOrEqual(
        layout.formLeft
      )
      expect(layout.copyRight, `${copyName}: right containment at 320px`).toBeLessThanOrEqual(
        layout.formRight
      )
      expect(layout.copyBottom, `${copyName}: bottom containment at 320px`).toBeLessThanOrEqual(
        layout.formBottom
      )
      expect(layout.copyHeight, `${copyName}: wraps to multiple lines at 320px`).toBeGreaterThan(
        layout.lineHeight
      )
      expect(layout.noHorizontalClipping, `${copyName}: no horizontal clipping at 320px`).toBe(true)
      expect(layout.noVerticalClipping, `${copyName}: no vertical clipping at 320px`).toBe(true)
    }

    const sessionExpiredCopy = page.getByText(/сессия истекла|войдите повторно/i)
    await assertWrappedInsideForm(sessionExpiredCopy, 'session-expired copy')

    activeState = 'network-error'
    await page.route(
      LOGIN_ENDPOINT,
      route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
      { times: 1 }
    )
    await email.fill(SYNTHETIC_EMAIL)
    await password.fill(SYNTHETIC_PASSWORD)
    await submit.click()
    const requestFeedback = page.locator('#login-request-feedback > div')
    await expect(requestFeedback).toContainText(/сервис временно недоступен/i)
    await assertWrappedInsideForm(requestFeedback, 'request error copy')

    const viewport = await page.evaluate(
      () => document.querySelector('meta[name="viewport"]')?.getAttribute('content') || ''
    )
    expect(viewport).not.toContain('user-scalable=no')
    expect(viewport).not.toMatch(/maximum-scale=1([^.]|$)/)

    expect(expectedConsoleErrors).toBeGreaterThan(0)
    expect(unexpectedConsoleErrorsByState).toEqual({
      default: 0,
      invalid: 0,
      'credential-error': 0,
      'network-error': 0,
      submitting: 0,
      success: 0,
      'session-expired': 0,
    })
    const unexpectedPageErrorsByState = Object.fromEntries(
      LOGIN_STATES.flatMap(state => {
        const messageCounts = pageErrorMessagesByState[state]
        if (!messageCounts) return []

        const sortedMessageCounts = Object.entries(messageCounts).sort(([left], [right]) =>
          left.localeCompare(right)
        )

        return [
          [
            state,
            {
              count: sortedMessageCounts.reduce((total, [, count]) => total + count, 0),
              messages: Object.fromEntries(sortedMessageCounts),
            },
          ] as const,
        ]
      })
    )
    expect(
      unexpectedPageErrorsByState,
      'unexpected normalized page errors by active Story state'
    ).toEqual({})
  })

  test.describe('touch-enabled submission', () => {
    test('submits the mobile primary action through a real touch event', async ({ browser }) => {
      const context = await browser.newContext({
        hasTouch: true,
        viewport: { width: 390, height: 844 },
        storageState: { cookies: [], origins: [] },
      })
      const page = await context.newPage()
      let requestCount = 0
      await page.route(LOGIN_ENDPOINT, route => {
        requestCount += 1
        return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
      })
      await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' })
      await page.getByLabel(/^email/i).fill(SYNTHETIC_EMAIL)
      await page.getByLabel(/^пароль/i).fill(SYNTHETIC_PASSWORD)

      const submit = page.getByRole('button', { name: 'Войти' })
      const box = await submit.boundingBox()
      expect(box).not.toBeNull()
      await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2)

      await expect(page.locator('#login-request-feedback')).toBeVisible()
      expect(requestCount).toBe(1)
      await context.close()
    })
  })
})

/**
 * E2E Tests: Login → Dashboard Flow
 * Stories: 1.3 (Login), 3.1 (Dashboard Layout), 167.1 (Unified AppShell)
 *
 * Tests the complete flow from login to viewing the dashboard
 * with all key components visible and functional.
 */
test.describe('Login → Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (authenticated via setup)
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test.describe('Dashboard Layout (Stories 3.1 and 167.1)', () => {
    test('displays sidebar navigation', async ({ page }) => {
      // Sidebar should be visible on desktop
      const sidebar = page.locator(SELECTORS.sidebar).or(page.locator('nav, aside').first())
      await expect(sidebar).toBeVisible()

      // Navigation links should be present
      const navLinks = page.locator('nav a, aside a')
      await expect(navLinks).not.toHaveCount(0)
    })

    test('displays main dashboard content area', async ({ page }) => {
      // Main content area
      const mainContent = page.locator('main, [role="main"]')
      await expect(mainContent).toBeVisible()

      // Should have dashboard title or heading
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('exposes a skip link, stable main target, and one current desktop route', async ({
      page,
    }) => {
      await expect(page).toHaveURL(/\/dashboard\?(?=.*week=)(?=.*type=week)/)
      const skipLink = page.getByRole('link', { name: 'Перейти к основному содержимому' })
      await skipLink.focus()
      await expect(skipLink).toBeFocused()
      await expect(skipLink).toHaveAttribute('href', '#main-content')
      const mainContent = page.locator('main#main-content')
      await expect(mainContent).toBeVisible()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#main-content$/)
      await expect(mainContent).toBeFocused()

      const desktopNavigation = page.getByRole('navigation', { name: 'Main navigation' })
      await expect(desktopNavigation.locator('[aria-current="page"]')).toHaveCount(1)
    })

    test('has responsive mobile menu', async ({ page, isMobile }) => {
      if (isMobile) {
        // Mobile menu toggle should be visible
        const menuToggle = page.locator(
          '[data-testid="mobile-menu-toggle"], button[aria-label*="menu"]'
        )
        await expect(menuToggle).toBeVisible()

        // Click to open menu
        await menuToggle.click()

        // Navigation should become visible
        const nav = page.locator('nav')
        await expect(nav).toBeVisible()
      }
    })

    test('keeps the desktop shell stable across required widths, themes, and reduced motion', async ({
      page,
    }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('pageerror', error => pageErrors.push(error.message))
      await page.emulateMedia({ reducedMotion: 'reduce' })

      const root = page.locator('html')
      const themeButton = page
        .getByRole('button', { name: 'Переключить тему' })
        .filter({ visible: true })

      for (const theme of ['light', 'dark'] as const) {
        const hasDarkTheme = (await root.getAttribute('class'))?.split(/\s+/).includes('dark')
        if (hasDarkTheme !== (theme === 'dark')) await themeButton.click()
        await expect(root, `${theme} theme is active`).toHaveClass(
          theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
        )

        for (const width of DESKTOP_WIDTHS) {
          await page.setViewportSize({ width, height: 900 })

          const desktopAside = page.getByRole('complementary', { name: 'Основная навигация' })
          await expect(desktopAside).toBeVisible()
          await expect(page.locator('button[aria-label="Open menu"]')).toBeHidden()
          await expect(
            desktopAside.getByRole('link', { name: 'Расширенная аналитика FBS' })
          ).toBeVisible()
          await expect(
            desktopAside
              .getByRole('navigation', { name: 'Main navigation' })
              .locator('[aria-current="page"]')
          ).toHaveCount(1)

          const geometry = await page.evaluate(() => ({
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
          }))
          expect(
            geometry.documentWidth,
            `no page overflow at ${width}px in ${theme} theme`
          ).toBeLessThanOrEqual(geometry.viewportWidth)

          const results = await new AxeBuilder({ page })
            .include('aside[aria-label="Основная навигация"]')
            .include('header')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze()
          expect(
            results.violations,
            `zero shell accessibility violations at ${width}px in ${theme} theme`
          ).toEqual([])
        }
      }
      expect(consoleErrors).toEqual([])
      expect(pageErrors).toEqual([])
    })
  })

  test.describe('Metric Cards (Story 3.2)', () => {
    test('displays key metric cards', async ({ page }) => {
      // Should have multiple metric cards
      const metricCards = page
        .locator(SELECTORS.metricCard)
        .or(page.locator('[class*="metric"], [class*="card"]').filter({ hasText: /₽|%/ }))

      // Story 162.8: observe the metrics terminal render via a bounded wait on
      // the first card (data, or a skeleton/loading surrogate) instead of an
      // elapsed "allow API to load" wait. Loading OR rendered cards are both
      // valid settles; the count assertion then runs against a settled DOM.
      await expect(metricCards.first()).toBeVisible({ timeout: TIMEOUTS.api })

      // At least one metric should be visible
      const count = await metricCards.count()
      expect(count).toBeGreaterThan(0)
    })

    test('metric cards show formatted currency values', async ({ page }) => {
      // Look for currency-formatted values (₽ symbol)
      const currencyValues = page.locator('text=/\\d.*₽/')
      await expect(currencyValues.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('metric cards handle loading state', async ({ page }) => {
      // Refresh to trigger loading
      await page.reload()

      // Either loading indicator or content should be visible
      const loadingOrContent = page
        .locator(SELECTORS.loadingSpinner)
        .or(page.locator('[class*="skeleton"]'))
        .or(page.locator('text=/\\d.*₽/'))

      await expect(loadingOrContent.first()).toBeVisible()
    })
  })

  test.describe('Expense Chart (Story 3.3)', () => {
    test('displays expense breakdown chart', async ({ page }) => {
      // Chart container should be visible
      const chart = page
        .locator(SELECTORS.expenseChart)
        .or(page.locator('[class*="chart"], svg[class*="recharts"]'))

      await expect(chart.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('chart has accessible label', async ({ page }) => {
      // Story 162.8: bound the accessible-label/legend check with expect.poll so it
      // waits for the chart's a11y to render instead of racing on an instant count()
      // (which flaked between repeat-each iterations).
      // Story 162.8 cleanup: the previous `[class*="label"]` surrogate was
      // page-wide (matched any element with "label" in its class — buttons,
      // form labels, etc.). The real ExpenseChart is a recharts BarChart with
      // no dedicated chart-container testid/role, so scope the label/legend
      // surrogate UNDER the recharts surface (the chart's own svg) instead of
      // searching the whole page. This still matches the chart's real
      // recharts-label/recharts-legend nodes without matching unrelated page
      // chrome.
      const chartSurface = page.locator('svg.recharts-surface, svg[class*="recharts"]').first()
      await expect
        .poll(
          async () => {
            const hasLabel =
              (await page.locator('[aria-label*="расход"], [aria-label*="chart"]').count()) > 0
            const hasChartLabeling =
              (await chartSurface.locator('[class*="label"], [class*="legend"]').count()) > 0
            return hasLabel || hasChartLabeling
          },
          { timeout: TIMEOUTS.api, message: 'Expense chart accessible label or legend' }
        )
        .toBeTruthy()
    })
  })

  test.describe('Trend Graph (Story 3.4)', () => {
    test('displays trend graph with weekly data', async ({ page }) => {
      // TD-E FIX-H1: TrendGraph renders ONLY when AnalyticalDisclosure (TZ-6)
      // is expanded — collapsed state unmounts its children ({open && ...}), so
      // the testid does not exist in the DOM until the toggle is clicked.
      // Expand first, then assert the testid that TrendGraph's Card wrapper
      // really renders. No .or() recharts fallback: it matched the
      // always-mounted DailyBreakdownChart svg outside the disclosure, which
      // made this test vacuous (green without TrendGraph ever rendering).
      await page.getByRole('button', { name: /аналитик/i }).click()

      const trendGraph = page.locator(SELECTORS.trendGraph)
      await expect(trendGraph).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('trend graph is functional', async ({ page }) => {
      // Story 162.8: replace the elapsed wait + tautological `body visible`
      // with a bounded terminal settle. The trend section resolves to a
      // rendered chart (recharts svg), an empty state, or an error state —
      // all three are valid functional settles; body-only visibility is not.
      const trendTerminal = page
        .locator('svg.recharts-surface, svg[class*="recharts"]')
        .or(page.getByText(/Нет данных|Ошибка загрузки/i))

      await expect(trendTerminal.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })
  })

  test.describe('Navigation', () => {
    test('can navigate to COGS page', async ({ page }) => {
      const desktopNavigation = page.getByRole('navigation', { name: 'Main navigation' })
      await desktopNavigation.getByRole('link', { name: 'Себестоимость', exact: true }).click()

      await expect(page).toHaveURL(/cogs/)
    })

    test('can navigate to Analytics pages', async ({ page }) => {
      await expect(page).toHaveURL(/\/dashboard\?(?=.*week=)(?=.*type=week)/)
      const desktopNavigation = page.getByRole('navigation', { name: 'Main navigation' })
      await desktopNavigation.getByRole('link', { name: 'Аналитика', exact: true }).click()

      await expect(page).toHaveURL(/analytics/)
    })

    test('can logout', async ({ page }) => {
      // Find logout button
      const logoutButton = page
        .locator(SELECTORS.logoutButton)
        .or(page.locator('button:has-text("Выход"), button:has-text("Logout")'))

      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        // Should redirect to login
        await expect(page).toHaveURL(/login/)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      // Block API to simulate error
      await page.route('**/api/**', route => route.abort())

      await page.reload()

      // Page should still be functional (not crash)
      await expect(page.locator('body')).toBeVisible()

      // Should show error state, empty state, or gracefully degrade
      const pageContent = await page.locator('body').textContent()
      expect(pageContent).toBeTruthy()
    })
  })
})
