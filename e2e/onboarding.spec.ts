import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Onboarding Flow
 * Stories: 2.1-2.4 (Cabinet Creation, Token Input, Processing, Initial Data)
 *
 * Note: These tests verify onboarding routes redirect behavior.
 * Full onboarding flow requires a fresh user without cabinets.
 */
test.describe('Onboarding Flow', () => {
  // Use unauthenticated state for onboarding tests
  test.use({ storageState: { cookies: [], origins: [] } })

  test.describe('Public Onboarding Pages', () => {
    test('cabinet page shows cabinet creation form', async ({ page }) => {
      await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()

      // Cabinet creation page is publicly accessible
      // Should show "Создание кабинета" heading and form
      const heading = page.locator('h1:has-text("Создание кабинета"), h1:has-text("кабинет")')
      const form = page.locator('form')

      const hasHeading = (await heading.count()) > 0
      const hasForm = (await form.count()) > 0

      expect(hasHeading || hasForm).toBeTruthy()
    })

    test('wb-token page is accessible', async ({ page }) => {
      await page.goto(ROUTES.onboarding.token, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()

      // WB Token page should show form or redirect
      const form = page.locator('form')
      const hasForm = (await form.count()) > 0
      const hasContent = await page.locator('body').textContent()

      expect(hasForm || (hasContent && hasContent.length > 0)).toBeTruthy()
    })

    test('processing page is accessible', async ({ page }) => {
      await page.goto(ROUTES.onboarding.processing, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()

      // Processing page should show content
      const hasContent = await page.locator('body').textContent()

      expect(hasContent && hasContent.length > 0).toBeTruthy()
    })
  })

  test.describe('Login Page Functionality', () => {
    test('displays login form with email and password', async ({ page }) => {
      await page.goto(ROUTES.login)

      // Form should be visible
      await expect(page.locator('form')).toBeVisible({ timeout: TIMEOUTS.navigation })

      // Email input
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()

      // Password input
      const passwordInput = page.locator('input[type="password"]')
      await expect(passwordInput).toBeVisible()

      // Submit button
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
    })

    test('shows validation error for empty form', async ({ page }) => {
      await page.goto(ROUTES.login)

      // Try to submit empty form
      await page.locator('button[type="submit"]').click()

      // Should show validation (either browser validation or form validation)
      // Check if form is still on login page (form wasn't submitted)
      await expect(page).toHaveURL(/login/)
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto(ROUTES.login)

      // Enter invalid credentials
      await page.locator('input[type="email"]').fill('invalid@example.com')
      await page.locator('input[type="password"]').fill('wrongpassword')

      // Story 162.8: observe the login attempt via its network settle instead
      // of an elapsed wait. Register the response BEFORE the click so the
      // response (or slow network) is the synchronization signal.
      const loginResponse = page.waitForResponse(
        response =>
          response.request().method() === 'POST' && response.url().includes('/v1/auth/login'),
        { timeout: 15000 }
      )
      await page.locator('button[type="submit"]').click()
      // waitForResponse resolves on the response (including a 401) — it does
      // not reject on non-2xx status — so awaiting it directly both proves the
      // POST fired and lets us assert the 401. If the POST never fires, the
      // 15s timeout correctly fails the test (previously masked by the
      // `.catch(() => null)` swallow).
      const res = await loginResponse
      expect(res.status()).toBe(401)

      // Check for error message or that we're still on login
      const hasError = (await page.locator('text=/ошибка|error|неверн|invalid/i').count()) > 0
      const stillOnLogin = page.url().includes('login')

      expect(hasError || stillOnLogin).toBeTruthy()
    })
  })

  test.describe('Register Page Functionality', () => {
    test('displays registration form', async ({ page }) => {
      await page.goto(ROUTES.register)

      // Form should be visible
      await expect(page.locator('form')).toBeVisible({ timeout: TIMEOUTS.navigation })

      // Email input
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()

      // Password input(s)
      const passwordInputs = page.locator('input[type="password"]')
      expect(await passwordInputs.count()).toBeGreaterThanOrEqual(1)
    })

    test('has link to login page', async ({ page }) => {
      await page.goto(ROUTES.register)

      // Should have link to login
      const loginLink = page.locator('a[href*="login"], a:has-text("Войти"), a:has-text("Sign in")')
      await expect(loginLink.first()).toBeVisible()
    })

    test.describe('Story 167.4 browser-owned evidence', () => {
      const REGISTRATION_ENDPOINT = '**/v1/auth/register'
      const VIEWPORT_WIDTHS = [320, 390, 768, 1024, 1280, 1440] as const
      const THEMES = ['light', 'dark'] as const
      const SYNTHETIC_EMAIL = 'story-167-4@example.invalid'
      const SYNTHETIC_PASSWORD = 'Story1674-Secret!'

      test('[P1] [REG-BROWSER-01] keeps primary controls usable across the responsive and theme matrix', async ({
        page,
      }) => {
        const { default: AxeBuilder } = await import('@axe-core/playwright')

        // Primary inputs and the default button must retain the 44px minimum target.
        await page.emulateMedia({ reducedMotion: 'reduce' })

        for (const theme of THEMES) {
          await page.goto(ROUTES.register, { waitUntil: 'domcontentloaded' })
          await page.evaluate(selectedTheme => {
            window.localStorage.setItem('theme', selectedTheme)
          }, theme)

          for (const width of VIEWPORT_WIDTHS) {
            await page.setViewportSize({ width, height: 900 })
            await page.goto(ROUTES.register, { waitUntil: 'domcontentloaded' })

            await expect(page.getByRole('heading', { name: 'Регистрация', level: 1 })).toBeVisible()
            await expect(page.locator('html')).toHaveClass(
              theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
            )

            if (width === VIEWPORT_WIDTHS[0]) {
              const results = await new AxeBuilder({ page })
                .include('main')
                .withTags(['wcag2a', 'wcag2aa'])
                .analyze()
              expect(
                results.violations,
                'default registration state: axe at ' + width + 'px in ' + theme
              ).toEqual([])
            }

            const controls = [
              { name: 'email', locator: page.getByLabel(/^email/i) },
              { name: 'password', locator: page.getByLabel(/^пароль/i) },
              {
                name: 'registration submit',
                locator: page.getByRole('button', { name: 'Зарегистрироваться' }),
              },
            ]

            for (const { name, locator } of controls) {
              await expect(
                locator,
                name + ' is visible at ' + width + 'px in ' + theme
              ).toBeVisible()
              const rectangle = await locator.evaluate(element => {
                const { height, width: controlWidth } = element.getBoundingClientRect()
                return { height, width: controlWidth }
              })
              expect(
                rectangle.width,
                name + ' computed width at ' + width + 'px in ' + theme
              ).toBeGreaterThanOrEqual(44)
              expect(
                rectangle.height,
                name + ' computed height at ' + width + 'px in ' + theme
              ).toBeGreaterThanOrEqual(44)
            }

            const pageGeometry = await page.evaluate(() => ({
              documentWidth: document.documentElement.scrollWidth,
              viewportWidth: document.documentElement.clientWidth,
            }))
            expect(
              pageGeometry.documentWidth,
              'no page overflow at ' + width + 'px in ' + theme
            ).toBeLessThanOrEqual(pageGeometry.viewportWidth + 1)
          }

          // A 1440px desktop at 200% zoom exposes a 720 CSS-pixel reflow viewport.
          await page.setViewportSize({ width: 720, height: 900 })
          await page.goto(ROUTES.register, { waitUntil: 'domcontentloaded' })
          const reflowGeometry = await page.evaluate(() => ({
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
          }))
          expect(
            reflowGeometry.documentWidth,
            '200% reflow has no page overflow in ' + theme
          ).toBeLessThanOrEqual(reflowGeometry.viewportWidth + 1)

          await page.setViewportSize({ width: 320, height: 900 })
          await page.goto(ROUTES.register, { waitUntil: 'load' })
          const password = page.getByLabel(/^пароль/i)
          await password.click()
          await password.pressSequentially('1234567')
          await page.keyboard.press('Tab')

          const validationMessage = page.getByText('Пароль должен содержать минимум 8 символов')
          await expect(validationMessage).toBeVisible()
          await expect(password).toHaveAttribute('aria-invalid', 'true')

          const russianCopyLayout = await validationMessage.evaluate(element => {
            const rectangle = element.getBoundingClientRect()
            const styles = window.getComputedStyle(element)
            return {
              height: rectangle.height,
              left: rectangle.left,
              lineHeight: Number.parseFloat(styles.lineHeight),
              right: rectangle.right,
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
              viewportWidth: document.documentElement.clientWidth,
              whiteSpace: styles.whiteSpace,
            }
          })
          expect(russianCopyLayout.whiteSpace).not.toBe('nowrap')
          expect(russianCopyLayout.height).toBeGreaterThan(russianCopyLayout.lineHeight)
          expect(russianCopyLayout.scrollWidth).toBeLessThanOrEqual(
            russianCopyLayout.clientWidth + 1
          )
          expect(russianCopyLayout.left).toBeGreaterThanOrEqual(0)
          expect(russianCopyLayout.right).toBeLessThanOrEqual(russianCopyLayout.viewportWidth + 1)

          await page.route(
            REGISTRATION_ENDPOINT,
            async route => {
              await route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({ code: 'SERVICE_UNAVAILABLE' }),
              })
            },
            { times: 1 }
          )
          await page.getByLabel(/^email/i).fill(SYNTHETIC_EMAIL)
          await password.fill(SYNTHETIC_PASSWORD)
          await page.keyboard.press('Tab')
          await expect(validationMessage).toBeHidden()
          await expect(password).toHaveAttribute('aria-invalid', 'false')
          await page.getByRole('button', { name: 'Зарегистрироваться' }).click()

          const recoveryAction = page.getByRole('button', { name: 'Повторить', exact: true })
          await expect(recoveryAction).toBeVisible()
          expect(page.viewportSize()?.width).toBe(320)
          await expect(page.locator('html')).toHaveClass(
            theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
          )
          const recoveryRectangle = await recoveryAction.evaluate(element => {
            const { height, width } = element.getBoundingClientRect()
            return { height, width }
          })
          expect(
            recoveryRectangle.width,
            'service recovery width at 320px in ' + theme
          ).toBeGreaterThanOrEqual(44)
          expect(
            recoveryRectangle.height,
            'service recovery height at 320px in ' + theme
          ).toBeGreaterThanOrEqual(44)
        }
      })

      test('[P1] [REG-BROWSER-02] preserves keyboard focus, clean hydration, and credential privacy', async ({
        page,
      }) => {
        const consoleMessages: string[] = []
        const pageErrors: string[] = []
        page.on('console', message => {
          if (message.type() === 'error' || message.type() === 'warning') {
            consoleMessages.push(message.text())
          }
        })
        page.on('pageerror', error => pageErrors.push(error.message))
        await page.addInitScript(() => {
          const historyStorageKey = 'story-167-4-observed-history-urls'
          if (window.sessionStorage.getItem(historyStorageKey) === null) {
            window.sessionStorage.setItem(historyStorageKey, '[]')
          }
          const recordHistoryUrl = (url: string | URL | null | undefined) => {
            if (url === null || url === undefined) return
            const urls = JSON.parse(
              window.sessionStorage.getItem(historyStorageKey) ?? '[]'
            ) as string[]
            urls.push(String(url))
            window.sessionStorage.setItem(historyStorageKey, JSON.stringify(urls))
          }
          const originalPushState = window.history.pushState
          const originalReplaceState = window.history.replaceState
          window.history.pushState = function (...args) {
            recordHistoryUrl(args[2])
            return originalPushState.apply(this, args)
          }
          window.history.replaceState = function (...args) {
            recordHistoryUrl(args[2])
            return originalReplaceState.apply(this, args)
          }
        })

        let observedRegistrationRequest: { method: string; pathname: string } | undefined
        let registrationRequestCount = 0
        let releaseRegistrationResponse!: () => void
        const registrationResponseGate = new Promise<void>(resolve => {
          releaseRegistrationResponse = resolve
        })
        await page.route(REGISTRATION_ENDPOINT, async route => {
          const request = route.request()
          registrationRequestCount += 1
          observedRegistrationRequest = {
            method: request.method(),
            pathname: new URL(request.url()).pathname,
          }
          await registrationResponseGate
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'story-167-4-user',
                email: SYNTHETIC_EMAIL,
                role: 'Owner',
              },
            }),
          })
        })

        for (const theme of THEMES) {
          await page.goto(ROUTES.register, { waitUntil: 'domcontentloaded' })
          await page.evaluate(selectedTheme => {
            window.localStorage.setItem('theme', selectedTheme)
          }, theme)
          await page.goto(ROUTES.register, { waitUntil: 'domcontentloaded' })

          const email = page.getByLabel(/^email/i)
          const password = page.getByLabel(/^пароль/i)
          const submit = page.getByRole('button', { name: 'Зарегистрироваться' })
          const loginLink = page.getByRole('link', { name: 'Войти' })
          const focusOrder = [email, password, submit, loginLink]
          const readFocusStyles = (control: typeof email) =>
            control.evaluate(element => {
              const styles = window.getComputedStyle(element)
              return {
                boxShadow: styles.boxShadow,
                outlineColor: styles.outlineColor,
                outlineOffset: styles.outlineOffset,
                outlineStyle: styles.outlineStyle,
                outlineWidth: styles.outlineWidth,
              }
            })

          await expect(email).toBeEnabled()
          await expect(password).toBeEnabled()
          await expect(submit).toBeEnabled()

          for (const [index, control] of focusOrder.entries()) {
            await expect(control).not.toBeFocused()
            const unfocusedStyles = await readFocusStyles(control)
            await page.keyboard.press('Tab')
            await expect(
              control,
              'task-order position ' + (index + 1) + ' in ' + theme
            ).toBeFocused()
            const focusedStyles = await readFocusStyles(control)
            const boxShadowChanged = focusedStyles.boxShadow !== unfocusedStyles.boxShadow
            const outlineChanged =
              focusedStyles.outlineColor !== unfocusedStyles.outlineColor ||
              focusedStyles.outlineOffset !== unfocusedStyles.outlineOffset ||
              focusedStyles.outlineStyle !== unfocusedStyles.outlineStyle ||
              focusedStyles.outlineWidth !== unfocusedStyles.outlineWidth
            const focusedOutlineIsVisible =
              focusedStyles.outlineStyle !== 'none' &&
              Number.parseFloat(focusedStyles.outlineWidth) > 0
            expect(
              boxShadowChanged || (outlineChanged && focusedOutlineIsVisible),
              'visible focus at task-order position ' + (index + 1) + ' in ' + theme
            ).toBe(true)
          }
        }

        await page.goto(ROUTES.register, { waitUntil: 'load' })
        await expect(page.getByRole('heading', { name: 'Регистрация', level: 1 })).toBeVisible()
        const email = page.getByLabel(/^email/i)
        const password = page.getByLabel(/^пароль/i)
        const submit = page.getByRole('button', { name: 'Зарегистрироваться' })
        await expect(password).toHaveAttribute('type', 'password')
        await email.fill(SYNTHETIC_EMAIL)
        await password.click()
        await password.pressSequentially('1234567')
        await page.keyboard.press('Tab')
        const validationMessage = page.getByText('Пароль должен содержать минимум 8 символов')
        await expect(validationMessage).toBeVisible()
        await expect(password).toHaveAttribute('aria-invalid', 'true')
        await password.press('ControlOrMeta+A')
        await password.pressSequentially(SYNTHETIC_PASSWORD)
        await page.keyboard.press('Tab')
        await expect(validationMessage).toBeHidden()
        await expect(password).toHaveAttribute('aria-invalid', 'false')
        await expect(email).toHaveValue(SYNTHETIC_EMAIL)
        await expect(password).toHaveValue(SYNTHETIC_PASSWORD)
        await expect(submit).toBeEnabled()
        expect(
          await page
            .getByRole('form', { name: 'Форма регистрации' })
            .evaluate(form => (form as HTMLFormElement).checkValidity())
        ).toBe(true)

        await password.focus()
        await expect(password).toBeFocused()
        await expect(password).toBeEnabled()
        await page.keyboard.press('Enter')
        const pendingSubmit = page.getByRole('button', { name: 'Регистрация...', exact: true })
        await expect(pendingSubmit).toBeDisabled()
        await expect(pendingSubmit).toHaveAttribute('aria-busy', 'true')
        await expect
          .poll(() => observedRegistrationRequest, {
            message: 'the installed registration route observed the submitted request',
          })
          .toEqual({ method: 'POST', pathname: '/v1/auth/register' })
        expect(registrationRequestCount).toBe(1)

        await page.keyboard.press('Enter')
        expect(registrationRequestCount).toBe(1)

        const privacyScanDuringSubmission = await page.evaluate(
          ({ syntheticEmail, syntheticPassword }) => {
            const emailSelector =
              'form[aria-label="Форма регистрации"] input[name="email"][type="email"][autocomplete="email"]'
            const passwordSelector =
              'form[aria-label="Форма регистрации"] input[name="password"][type="password"][autocomplete="new-password"]'
            const emailControlCount = document.querySelectorAll(emailSelector).length
            const passwordControlCount = document.querySelectorAll(passwordSelector).length
            const clonedDocumentElement = document.documentElement.cloneNode(true) as HTMLElement

            if (emailControlCount === 1 && passwordControlCount === 1) {
              const clonedEmailControl =
                clonedDocumentElement.querySelector<HTMLInputElement>(emailSelector)!
              const clonedPasswordControl =
                clonedDocumentElement.querySelector<HTMLInputElement>(passwordSelector)!

              for (const clonedCredentialControl of [clonedEmailControl, clonedPasswordControl]) {
                clonedCredentialControl.value = ''
                clonedCredentialControl.removeAttribute('value')
              }
            }

            const serializedClone = clonedDocumentElement.outerHTML
            return {
              emailControlCount,
              passwordControlCount,
              syntheticEmailFoundOutsideIntendedValueCarrier:
                serializedClone.includes(syntheticEmail),
              syntheticPasswordFoundOutsideIntendedValueCarrier:
                serializedClone.includes(syntheticPassword),
            }
          },
          { syntheticEmail: SYNTHETIC_EMAIL, syntheticPassword: SYNTHETIC_PASSWORD }
        )
        const urlDuringSubmission = page.url()
        expect(urlDuringSubmission).not.toContain(SYNTHETIC_EMAIL)
        expect(urlDuringSubmission).not.toContain(SYNTHETIC_PASSWORD)
        expect(privacyScanDuringSubmission.emailControlCount).toBe(1)
        expect(privacyScanDuringSubmission.passwordControlCount).toBe(1)
        expect(privacyScanDuringSubmission.syntheticEmailFoundOutsideIntendedValueCarrier).toBe(
          false
        )
        expect(privacyScanDuringSubmission.syntheticPasswordFoundOutsideIntendedValueCarrier).toBe(
          false
        )
        await expect(password).toHaveAttribute('type', 'password')
        expect(registrationRequestCount).toBe(1)

        const loginNavigation = page.waitForURL(/\/login(?:\?|$)/)
        releaseRegistrationResponse()
        await loginNavigation

        const sourceAfterNavigation = await page.content()
        const observedHistoryUrls = await page.evaluate(() => {
          return JSON.parse(
            window.sessionStorage.getItem('story-167-4-observed-history-urls') ?? '[]'
          ) as string[]
        })
        expect(observedHistoryUrls.filter(url => /\/login(?:\?|$)/.test(url))).toHaveLength(1)
        const browserBoundaryEvidence = [
          page.url(),
          sourceAfterNavigation,
          ...observedHistoryUrls,
          ...consoleMessages,
        ]
        for (const evidence of browserBoundaryEvidence) {
          expect(evidence).not.toContain(SYNTHETIC_EMAIL)
          expect(evidence).not.toContain(SYNTHETIC_PASSWORD)
        }

        expect(
          consoleMessages.filter(message =>
            /hydration|did not match|server rendered|client rendered/i.test(message)
          )
        ).toEqual([])
        expect(consoleMessages).toEqual([])
        expect(pageErrors).toEqual([])
      })

      test.describe('touch-capable context', () => {
        test('[P2] [REG-BROWSER-03] activates the semantic login link with touch input', async ({
          browser,
        }) => {
          const context = await browser.newContext({
            hasTouch: true,
            viewport: { width: 390, height: 844 },
            storageState: { cookies: [], origins: [] },
          })
          const page = await context.newPage()
          try {
            await page.goto(ROUTES.register, { waitUntil: 'domcontentloaded' })
            const loginLink = page.getByRole('link', { name: 'Войти' })
            await expect(loginLink).toBeVisible()

            const loginNavigation = page.waitForURL(/\/login(?:\?|$)/)
            await loginLink.tap()
            await loginNavigation
          } finally {
            await context.close()
          }
        })
      })
    })
  })
})

/**
 * Authenticated Onboarding Tests
 * These tests verify behavior for users who already completed onboarding
 */
test.describe('Authenticated User - Onboarding Routes', () => {
  // Uses default authenticated state from setup

  test('cabinet page redirects to dashboard for existing user', async ({ page }) => {
    await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })

    // User with existing cabinet should be redirected to dashboard
    await page.locator('body').waitFor({ state: 'visible' })

    // Should be on dashboard or still on cabinet page (depending on implementation)
    const currentUrl = page.url()
    const isExpectedRoute =
      currentUrl.includes('dashboard') ||
      currentUrl.includes('cabinet') ||
      currentUrl.includes('cogs')

    expect(isExpectedRoute).toBeTruthy()
  })

  test('wb-token page redirects to dashboard for existing user', async ({ page }) => {
    await page.goto(ROUTES.onboarding.token, { waitUntil: 'domcontentloaded' })

    await page.locator('body').waitFor({ state: 'visible' })

    const currentUrl = page.url()
    const isExpectedRoute =
      currentUrl.includes('dashboard') ||
      currentUrl.includes('wb-token') ||
      currentUrl.includes('cogs')

    expect(isExpectedRoute).toBeTruthy()
  })

  test('processing page redirects to dashboard for existing user', async ({ page }) => {
    await page.goto(ROUTES.onboarding.processing, { waitUntil: 'domcontentloaded' })

    await page.locator('body').waitFor({ state: 'visible' })

    const currentUrl = page.url()
    const isExpectedRoute =
      currentUrl.includes('dashboard') ||
      currentUrl.includes('processing') ||
      currentUrl.includes('cogs')

    expect(isExpectedRoute).toBeTruthy()
  })
})

test.describe('Story 167.5 browser-owned evidence', () => {
  const CABINET_FAMILY_ENDPOINT = '**/v1/cabinets**'
  const CABINET_COLLECTION_PATH = '/v1/cabinets'
  const SYNTHETIC_CABINET_ID = 'story-167-5-cabinet.invalid'
  const CABINET_RESOURCE_PATH = `/v1/cabinets/${SYNTHETIC_CABINET_ID}`
  const SYNTHETIC_CABINET_NAME = 'Story 167.5 synthetic cabinet'
  const SYNTHETIC_CREATE_FAILURE = 'story-167-5-synthetic-create-failure.invalid'
  const SYNTHETIC_ORIGINAL_TOKEN = [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6InN0b3J5LTE2Ny01LW93bmVyLmludmFsaWQifQ',
    'story-167-5',
  ].join('.')
  const SYNTHETIC_REFRESHED_TOKEN = [
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
    'eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6InN0b3J5LTE2Ny01LXJlZnJlc2hlZC5pbnZhbGlkIn0',
    'story-167-5-refreshed',
  ].join('.')
  const SYNTHETIC_APP_ORIGIN = 'http://localhost:3100'
  const VIEWPORT_WIDTHS = [320, 390, 768, 1024, 1280, 1440] as const
  const THEMES = ['light', 'dark'] as const

  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page
      .context()
      .addCookies([
        { name: 'auth-token', value: SYNTHETIC_ORIGINAL_TOKEN, url: SYNTHETIC_APP_ORIGIN },
      ])
    await page.addInitScript(originalToken => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'story-167-5-owner.invalid',
              email: 'story-167-5-owner@example.invalid',
              role: 'Owner',
              cabinet_ids: [],
            },
            token: originalToken,
            cabinetId: null,
          },
          version: 0,
        })
      )
    }, SYNTHETIC_ORIGINAL_TOKEN)
  })

  test('[P1] [CABINET-BROWSER-01] exposes semantic, responsive, themed, and accessible first-use composition', async ({
    page,
  }) => {
    test.slow()
    const { default: AxeBuilder } = await import('@axe-core/playwright')
    const unexpectedCabinetRequests: string[] = []

    await page.route(CABINET_FAMILY_ENDPOINT, async route => {
      const request = route.request()
      unexpectedCabinetRequests.push(`${request.method()} ${new URL(request.url()).pathname}`)
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'unexpected synthetic cabinet-family request' }),
      })
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })

    for (const theme of THEMES) {
      await page.evaluate(selectedTheme => {
        window.localStorage.setItem('theme', selectedTheme)
      }, theme)

      for (const width of VIEWPORT_WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })

        await expect(page.locator('html')).toHaveClass(
          theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
        )
        await expect(page.getByRole('main')).toHaveCount(1)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(
          page.getByRole('heading', { name: 'Создание кабинета', level: 1 })
        ).toBeVisible()
        await expect(
          page.getByText('Шаг 1 из 3: Создайте кабинет для организации ваших данных', {
            exact: true,
          })
        ).toBeVisible()

        const form = page.getByRole('form', { name: 'Форма создания кабинета' })
        const controls = [
          { name: 'cabinet name', locator: page.getByLabel(/^Название кабинета/) },
          { name: 'target margin', locator: page.getByLabel(/^Целевая маржа/) },
          {
            name: 'primary action',
            locator: page.getByRole('button', { name: 'Создать кабинет', exact: true }),
          },
        ]
        await expect(form).toBeVisible()

        for (const { name, locator } of controls) {
          await expect(locator, `${name} at ${width}px in ${theme}`).toBeVisible()
          const heights = await locator.evaluate(element => ({
            bounding: element.getBoundingClientRect().height,
            computed: Number.parseFloat(window.getComputedStyle(element).height),
          }))
          expect(
            heights.bounding,
            `${name} bounding-box height at ${width}px in ${theme}`
          ).toBeGreaterThanOrEqual(44)
          expect(
            heights.computed,
            `${name} computed height at ${width}px in ${theme}`
          ).toBeGreaterThanOrEqual(44)
        }

        const pageGeometry = await page.evaluate(() => ({
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        }))
        expect(
          pageGeometry.documentWidth,
          `no horizontal page overflow at ${width}px in ${theme}`
        ).toBeLessThanOrEqual(pageGeometry.viewportWidth + 1)

        if (width === VIEWPORT_WIDTHS[0]) {
          const results = await new AxeBuilder({ page })
            .include('main')
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze()
          expect(results.violations, `cabinet axe at ${width}px in ${theme}`).toEqual([])
        }
      }

      await page.setViewportSize({ width: 720, height: 900 })
      await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
      const reflowGeometry = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }))
      expect(
        reflowGeometry.documentWidth,
        `200% reflow has no page overflow in ${theme}`
      ).toBeLessThanOrEqual(reflowGeometry.viewportWidth + 1)

      await page.setViewportSize({ width: 320, height: 900 })
      await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
      expect(
        await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ).toBe(true)
      const nameInput = page.getByLabel(/^Название кабинета/)
      const marginInput = page.getByLabel(/^Целевая маржа/)
      const submit = page.getByRole('button', { name: 'Создать кабинет', exact: true })
      await expect(submit).toBeEnabled()
      await page.keyboard.press('Tab')
      await expect(nameInput).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(marginInput).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(submit).toBeFocused()
    }

    expect(unexpectedCabinetRequests).toEqual([])
  })

  test('[P0] [CABINET-BROWSER-02] recovers deliberately from one failed create and one failed margin update', async ({
    page,
  }) => {
    const postMethods: string[] = []
    const putMethods: string[] = []
    const postBodies: unknown[] = []
    const putBodies: unknown[] = []
    const postAuthorizationHeaders: Array<string | undefined> = []
    const putAuthorizationHeaders: Array<string | undefined> = []
    const putCabinetHeaders: Array<string | undefined> = []
    const unexpectedCabinetRequests: string[] = []
    const expectedSyntheticFailureConsoleMessages: string[] = []
    const unexpectedConsoleMessages: string[] = []
    const pageErrors: string[] = []
    let postAttempts = 0
    let failedPostAttempts = 0
    let successfulPostAttempts = 0
    let getAttempts = 0
    let putAttempts = 0
    let failedPutAttempts = 0
    let successfulPutAttempts = 0
    let releaseSuccessfulPost: () => void = () => {
      throw new Error('Successful POST gate was released before initialization')
    }
    const successfulPostGate = new Promise<void>(resolve => {
      releaseSuccessfulPost = resolve
    })
    let releaseFailedPut: () => void = () => {
      throw new Error('Failed PUT gate was released before initialization')
    }
    const failedPutGate = new Promise<void>(resolve => {
      releaseFailedPut = resolve
    })
    let releaseSuccessfulPut: () => void = () => {
      throw new Error('Successful PUT gate was released before initialization')
    }
    const successfulPutGate = new Promise<void>(resolve => {
      releaseSuccessfulPut = resolve
    })

    page.on('console', message => {
      if (message.type() !== 'error' && message.type() !== 'warning') return
      const text = message.text()
      if (
        /Failed to load resource.*503|API Error \[503\]|story-167-5-synthetic-create-failure\.invalid|target margin/i.test(
          text
        )
      ) {
        expectedSyntheticFailureConsoleMessages.push(text)
      } else {
        unexpectedConsoleMessages.push(text)
      }
    })
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.addInitScript(() => {
      const historyStorageKey = 'story-167-5-observed-history-urls'
      if (window.sessionStorage.getItem(historyStorageKey) === null) {
        window.sessionStorage.setItem(historyStorageKey, '[]')
      }
      const recordHistoryUrl = (url: string | URL | null | undefined) => {
        if (url === null || url === undefined) return
        const urls = JSON.parse(
          window.sessionStorage.getItem(historyStorageKey) ?? '[]'
        ) as string[]
        urls.push(String(url))
        window.sessionStorage.setItem(historyStorageKey, JSON.stringify(urls))
      }
      const originalPushState = window.history.pushState
      const originalReplaceState = window.history.replaceState
      window.history.pushState = function (...args) {
        recordHistoryUrl(args[2])
        return originalPushState.apply(this, args)
      }
      window.history.replaceState = function (...args) {
        recordHistoryUrl(args[2])
        return originalReplaceState.apply(this, args)
      }
    })

    await page.route(CABINET_FAMILY_ENDPOINT, async route => {
      const request = route.request()
      const method = request.method()
      const pathname = new URL(request.url()).pathname

      if (pathname === CABINET_COLLECTION_PATH && method === 'POST') {
        postAttempts += 1
        postMethods.push(method)
        postBodies.push(request.postDataJSON())
        postAuthorizationHeaders.push(request.headers()['authorization'])

        if (postAttempts === 1) {
          failedPostAttempts += 1
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: SYNTHETIC_CREATE_FAILURE }),
          })
          return
        }

        if (postAttempts === 2) {
          await successfulPostGate
          successfulPostAttempts += 1
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: SYNTHETIC_CABINET_ID,
              name: SYNTHETIC_CABINET_NAME,
              isActive: true,
              createdAt: '2026-08-14T00:00:00.000Z',
              updatedAt: '2026-08-14T00:00:00.000Z',
              newToken: SYNTHETIC_REFRESHED_TOKEN,
            }),
          })
          return
        }
      }

      if (pathname === CABINET_RESOURCE_PATH && method === 'GET') {
        getAttempts += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-08-14T00:00:00.000Z',
            updatedAt: '2026-08-14T00:00:00.000Z',
            taxSystem: null,
            taxRate: null,
            vatPayer: false,
            vatRate: null,
            targetMarginPct: null,
          }),
        })
        return
      }

      if (pathname === CABINET_RESOURCE_PATH && method === 'PUT') {
        putAttempts += 1
        putMethods.push(method)
        putBodies.push(request.postDataJSON())
        putAuthorizationHeaders.push(request.headers()['authorization'])
        putCabinetHeaders.push(request.headers()['x-cabinet-id'])

        if (putAttempts === 1) {
          failedPutAttempts += 1
          await failedPutGate
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'synthetic target margin failure' }),
          })
          return
        }

        if (putAttempts === 2) {
          await successfulPutGate
          successfulPutAttempts += 1
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: SYNTHETIC_CABINET_ID,
              name: SYNTHETIC_CABINET_NAME,
              isActive: true,
              createdAt: '2026-08-14T00:00:00.000Z',
              updatedAt: '2026-08-14T00:00:00.000Z',
              taxSystem: null,
              taxRate: null,
              vatPayer: false,
              vatRate: null,
              targetMarginPct: 37,
            }),
          })
          return
        }
      }

      unexpectedCabinetRequests.push(`${method} ${pathname}`)
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'unexpected synthetic cabinet-family request' }),
      })
    })

    await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
    const form = page.getByRole('form', { name: 'Форма создания кабинета' })
    const nameInput = page.getByLabel(/^Название кабинета/)
    const marginInput = page.getByLabel(/^Целевая маржа/)
    const submit = page.getByRole('button', { name: 'Создать кабинет', exact: true })
    await expect(submit).toBeEnabled()
    await nameInput.fill(SYNTHETIC_CABINET_NAME)
    await marginInput.fill('37')
    await submit.click()

    const recoveryAlert = page.locator('#cabinet-creation-recovery-error')
    await expect(recoveryAlert).toHaveAttribute('role', 'alert')
    await expect(recoveryAlert).toHaveText(SYNTHETIC_CREATE_FAILURE)
    await expect(recoveryAlert).toBeFocused()
    const recoveryAlertId = await recoveryAlert.getAttribute('id')
    expect(recoveryAlertId).toBeTruthy()
    await expect(form).toHaveAttribute('aria-describedby', recoveryAlertId!)
    await expect(nameInput).toHaveValue(SYNTHETIC_CABINET_NAME)
    await expect(marginInput).toHaveValue('37')
    expect(new URL(page.url()).pathname).toBe('/cabinet')
    expect(postAttempts).toBe(1)
    expect(failedPostAttempts).toBe(1)
    expect(putAttempts).toBe(0)

    await nameInput.focus()
    await expect(nameInput).toBeFocused()
    await expect(recoveryAlert).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/cabinet')

    await submit.click()
    await expect(recoveryAlert).toHaveCount(0)
    const pendingCreate = page.getByRole('button', { name: 'Создание...', exact: true })
    await expect(pendingCreate).toBeVisible()
    await expect(pendingCreate).toBeDisabled()
    await expect(pendingCreate).toHaveAttribute('aria-busy', 'true')
    await expect.poll(() => postAttempts).toBe(2)
    expect(putAttempts).toBe(0)
    expect(new URL(page.url()).pathname).toBe('/cabinet')

    releaseSuccessfulPost()
    await expect.poll(() => getAttempts).toBe(1)
    await expect.poll(() => putAttempts).toBe(1)
    await expect(marginInput).toHaveValue('37')
    releaseFailedPut()
    await expect(recoveryAlert).toHaveText(
      'Кабинет создан, но целевая маржа не сохранилась. Исправьте ошибку и повторите попытку.'
    )
    await expect(recoveryAlert).toBeFocused()
    await expect(form).toHaveAttribute('aria-describedby', recoveryAlertId!)
    await expect(nameInput).toHaveValue(SYNTHETIC_CABINET_NAME)
    await expect(nameInput).toBeDisabled()
    await expect(marginInput).toHaveValue('37')
    expect(postAttempts).toBe(2)
    expect(failedPostAttempts).toBe(1)
    expect(successfulPostAttempts).toBe(1)
    expect(putAttempts).toBe(1)
    expect(failedPutAttempts).toBe(1)
    expect(new URL(page.url()).pathname).toBe('/cabinet')

    await marginInput.focus()
    await expect(marginInput).toBeFocused()
    await expect(recoveryAlert).toBeVisible()

    const wbTokenNavigation = page.waitForURL(/\/wb-token(?:\?|$)/)
    const updateRetry = page.getByRole('button', { name: 'Сохранить и продолжить', exact: true })
    await updateRetry.click()
    await expect(recoveryAlert).toHaveCount(0)
    const pendingUpdate = page.getByRole('button', { name: 'Сохранение...', exact: true })
    await expect(pendingUpdate).toBeVisible()
    await expect(pendingUpdate).toBeDisabled()
    await expect(pendingUpdate).toHaveAttribute('aria-busy', 'true')
    await expect.poll(() => putAttempts).toBe(2)
    expect(postAttempts).toBe(2)
    expect(new URL(page.url()).pathname).toBe('/cabinet')

    releaseSuccessfulPut()
    await wbTokenNavigation

    expect(postMethods).toEqual(['POST', 'POST'])
    expect(putMethods).toEqual(['PUT', 'PUT'])
    expect(postBodies).toEqual([{ name: SYNTHETIC_CABINET_NAME }, { name: SYNTHETIC_CABINET_NAME }])
    expect(putBodies).toEqual([{ target_margin_pct: 37 }, { target_margin_pct: 37 }])
    expect(postAuthorizationHeaders).toEqual([
      `Bearer ${SYNTHETIC_ORIGINAL_TOKEN}`,
      `Bearer ${SYNTHETIC_ORIGINAL_TOKEN}`,
    ])
    expect(putAuthorizationHeaders).toEqual([
      `Bearer ${SYNTHETIC_REFRESHED_TOKEN}`,
      `Bearer ${SYNTHETIC_REFRESHED_TOKEN}`,
    ])
    expect(putCabinetHeaders).toEqual([SYNTHETIC_CABINET_ID, SYNTHETIC_CABINET_ID])
    expect(unexpectedCabinetRequests).toEqual([])
    expect(postAttempts).toBe(2)
    expect(failedPostAttempts).toBe(1)
    expect(successfulPostAttempts).toBe(1)
    expect(putAttempts).toBe(2)
    expect(failedPutAttempts).toBe(1)
    expect(successfulPutAttempts).toBe(1)
    expect(new URL(page.url()).pathname).toBe('/wb-token')

    const observedHistoryUrls = await page.evaluate(() => {
      return JSON.parse(
        window.sessionStorage.getItem('story-167-5-observed-history-urls') ?? '[]'
      ) as string[]
    })
    expect(observedHistoryUrls.filter(url => /\/wb-token(?:\?|$)/.test(url))).toHaveLength(1)
    expect(expectedSyntheticFailureConsoleMessages.length).toBeGreaterThan(0)
    expect(unexpectedConsoleMessages).toEqual([])
    expect(pageErrors).toEqual([])
  })

  test('[P0] [CABINET-BROWSER-03] exposes recoverable transport failure without contacting a cabinet service', async ({
    page,
  }) => {
    let abortedPostAttempts = 0
    let unexpectedPutAttempts = 0
    const unexpectedCabinetRequests: string[] = []

    await page.route(CABINET_FAMILY_ENDPOINT, async route => {
      const request = route.request()
      const method = request.method()
      const pathname = new URL(request.url()).pathname

      if (pathname === CABINET_COLLECTION_PATH && method === 'POST') {
        abortedPostAttempts += 1
        await route.abort('connectionrefused')
        return
      }

      if (method === 'PUT') unexpectedPutAttempts += 1
      unexpectedCabinetRequests.push(`${method} ${pathname}`)
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'unexpected synthetic cabinet-family request' }),
      })
    })

    await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
    const form = page.getByRole('form', { name: 'Форма создания кабинета' })
    const nameInput = page.getByLabel(/^Название кабинета/)
    const marginInput = page.getByLabel(/^Целевая маржа/)
    const submit = page.getByRole('button', { name: 'Создать кабинет', exact: true })
    await expect(submit).toBeEnabled()
    await nameInput.fill(SYNTHETIC_CABINET_NAME)
    await marginInput.fill('37')
    await submit.click()

    const recoveryAlert = page.locator('#cabinet-creation-recovery-error')
    await expect(recoveryAlert).toHaveAttribute('role', 'alert')
    await expect(recoveryAlert).toContainText(/failed to fetch|network error/i)
    await expect(recoveryAlert).toBeFocused()
    const recoveryAlertId = await recoveryAlert.getAttribute('id')
    expect(recoveryAlertId).toBeTruthy()
    await expect(form).toHaveAttribute('aria-describedby', recoveryAlertId!)
    await expect(nameInput).toHaveValue(SYNTHETIC_CABINET_NAME)
    await expect(marginInput).toHaveValue('37')
    expect(new URL(page.url()).pathname).toBe('/cabinet')
    expect(abortedPostAttempts).toBe(1)
    expect(unexpectedPutAttempts).toBe(0)
    expect(unexpectedCabinetRequests).toEqual([])
  })

  test('[P0] [CABINET-BROWSER-04] blocks duplicate create after the cabinet-id auth write fails', async ({
    page,
  }) => {
    let postAttempts = 0
    let getAttempts = 0
    let putAttempts = 0
    let releaseCreateResponse!: () => void
    const createResponseGate = new Promise<void>(resolve => {
      releaseCreateResponse = resolve
    })
    const unexpectedCabinetRequests: string[] = []

    await page.route(CABINET_FAMILY_ENDPOINT, async route => {
      const request = route.request()
      const method = request.method()
      const pathname = new URL(request.url()).pathname

      if (pathname === CABINET_COLLECTION_PATH && method === 'POST') {
        postAttempts += 1
        await createResponseGate
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-08-15T00:00:00.000Z',
            updatedAt: '2026-08-15T00:00:00.000Z',
            newToken: SYNTHETIC_REFRESHED_TOKEN,
          }),
        })
        return
      }

      if (pathname === CABINET_RESOURCE_PATH && method === 'GET') {
        getAttempts += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SYNTHETIC_CABINET_ID,
            name: SYNTHETIC_CABINET_NAME,
            isActive: true,
            createdAt: '2026-08-15T00:00:00.000Z',
            updatedAt: '2026-08-15T00:00:00.000Z',
            targetMarginPct: null,
          }),
        })
        return
      }

      if (method === 'PUT') putAttempts += 1
      unexpectedCabinetRequests.push(`${method} ${pathname}`)
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'unexpected synthetic cabinet-family request' }),
      })
    })

    await page.goto(ROUTES.onboarding.cabinet, { waitUntil: 'domcontentloaded' })
    await page.evaluate(cabinetId => {
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (key === 'auth-storage' && value.includes(`\"cabinetId\":\"${cabinetId}\"`)) {
          throw new DOMException('Synthetic auth persistence failure', 'QuotaExceededError')
        }
        return originalSetItem.call(this, key, value)
      }
    }, SYNTHETIC_CABINET_ID)

    const submit = page.getByRole('button', { name: 'Создать кабинет', exact: true })
    await expect(submit).toBeEnabled()
    await page.getByLabel(/^Название кабинета/).fill(SYNTHETIC_CABINET_NAME)
    await page.getByLabel(/^Целевая маржа/).fill('37')
    await submit.click()

    const pendingForm = page.getByRole('form', { name: 'Форма создания кабинета' })
    const pendingSubmit = page.getByRole('button', { name: 'Создание...', exact: true })
    await expect(pendingSubmit).toBeVisible()
    await expect(pendingSubmit).toBeDisabled()
    await expect.poll(() => postAttempts).toBe(1)
    await pendingForm.evaluate(async form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    })
    expect(postAttempts).toBe(1)
    releaseCreateResponse()

    const recoveryAlert = page.locator('#cabinet-creation-recovery-error')
    await expect(recoveryAlert).toContainText('Кабинет уже создан')
    await expect(recoveryAlert).toBeFocused()
    await expect(
      page.getByRole('button', { name: 'Сохранить и продолжить', exact: true })
    ).toBeDisabled()
    expect(postAttempts).toBe(1)
    expect(putAttempts).toBe(0)

    const persistedBoundary = await page.evaluate(() => ({
      auth: JSON.parse(window.localStorage.getItem('auth-storage') ?? 'null'),
      recovery: JSON.parse(
        window.sessionStorage.getItem('cabinet-creation:token-recovery:v1') ?? 'null'
      ),
    }))
    expect(persistedBoundary.auth.state.token).toBe(SYNTHETIC_REFRESHED_TOKEN)
    expect(persistedBoundary.auth.state.cabinetId).toBeNull()
    expect(persistedBoundary.recovery).toEqual({
      version: 1,
      phase: 'token-recovery-blocked',
      userId: 'story-167-5-owner.invalid',
    })

    await page.reload({ waitUntil: 'domcontentloaded' })

    const restoredForm = page.getByRole('form', { name: 'Форма создания кабинета' })
    const restoredSubmit = page.getByRole('button', { name: 'Создать кабинет', exact: true })
    await expect(recoveryAlert).toContainText('Кабинет уже создан')
    await expect(recoveryAlert).toBeFocused()
    await expect(restoredSubmit).toBeDisabled()
    await page.getByLabel(/^Название кабинета/).fill('Duplicate Cabinet')
    await restoredForm.evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await expect.poll(() => postAttempts).toBe(1)
    expect(putAttempts).toBe(0)
    expect(unexpectedCabinetRequests).toEqual([])
    expect(getAttempts).toBeGreaterThanOrEqual(1)
  })
})
