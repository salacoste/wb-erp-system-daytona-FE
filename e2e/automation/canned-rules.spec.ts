/**
 * Story 172.2-FE E2E — canned automation rules gallery.
 * Route: /automation/canned-rules → GET /v1/automation/canned-rules,
 * POST /v1/automation/canned-rules/:key/install
 *
 * Covers the canonical state matrix (plan §Behavior Lock): loading → gallery,
 * no rules, restricted (price arm write-back badge), install pending,
 * install success (post-install deep-link), gallery error + retry, 409
 * duplicate-name rename Dialog. Uses the repo network-test fixture + the
 * story-172-2 route controller (exact API paths, no `**` globs).
 *
 * Observable-wait policy (163.3 canon): waitForResponse pre-registered
 * BEFORE the triggering action; toBeVisible for terminal states; no hard
 * waits; no networkidle. Route-side delay (network latency simulation) is
 * used only to open the pending-state observation window.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { test, expect } from '../fixtures/network-test'
import {
  installStory1722Routes,
  STORY_172_2_INSTALLED_RULE,
  STORY_172_2_NOTIFY,
  STORY_172_2_PRICE,
} from '../fixtures/story-172-2-canned-rules'

const GALLERY_ROUTE = '/automation/canned-rules'
const SETTLE_TIMEOUT = 10_000

test.describe('Story 172.2 — Canned rules gallery @automation', () => {
  test('AC1: loads the gallery grouped by category with trigger→action summaries', async ({
    page,
  }) => {
    await installStory1722Routes(page, 'gallery')
    // COLD_COMPILE_TIMEOUT: the first test in the file pays the dev-server
    // compile cost for /automation/canned-rules (>10s observed) — the wait
    // must tolerate it; later tests reuse the compiled route.
    const getResponse = page.waitForResponse(
      r => r.request().method() === 'GET' && r.url().includes('/v1/automation/canned-rules'),
      { timeout: 30_000 }
    )
    await page.goto(GALLERY_ROUTE, { waitUntil: 'domcontentloaded' })
    await getResponse

    await expect(page.getByRole('heading', { name: 'Шаблоны автоматизации' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    // All four category sections render with their cards.
    for (const card of [
      'canned-rule-card-story-172-2-low-stock',
      'canned-rule-card-story-172-2-price-drift',
      'canned-rule-card-story-172-2-report-task',
      'canned-rule-card-story-172-2-margin-audit',
    ]) {
      await expect(page.getByTestId(card)).toBeVisible({ timeout: SETTLE_TIMEOUT })
    }
    // The notify card shows the threshold in its summary (defensive read).
    await expect(page.getByTestId('trigger-action-story-172-2-low-stock')).toContainText('(lt 10)')
  })

  test('AC2: restricted price template carries the destructive arm write-back badge', async ({
    page,
  }) => {
    await installStory1722Routes(page, 'gallery')
    await page.goto(GALLERY_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('price-badge-story-172-2-price-drift')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    // The warning is textual (meaning not color-only) — price wording present.
    await expect(page.getByTestId('price-badge-story-172-2-price-drift')).toContainText(
      /write-back/
    )
  })

  test('AC3: no-rules state renders the empty marker', async ({ page }) => {
    await installStory1722Routes(page, 'empty')
    await page.goto(GALLERY_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('canned-rules-empty')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.getByTestId('canned-rules-empty')).toContainText(/не доступны/)
  })

  test('AC4: gallery error renders the destructive alert with a Button retry', async ({ page }) => {
    await installStory1722Routes(page, 'error')
    await page.goto(GALLERY_ROUTE, { waitUntil: 'domcontentloaded' })
    const retry = page.getByTestId('canned-rules-retry')
    await expect(retry).toBeVisible({ timeout: SETTLE_TIMEOUT })
    // Retry is the Button primitive (role button + accessible name), and the
    // destructive alert carries the failure text.
    await expect(retry).toHaveAccessibleName(/Повторить/)
    await expect(page.getByText(/Не удалось загрузить шаблоны/)).toBeVisible()
  })

  test('AC5/AC6: install pending → success shows the post-install deep-link; wire contract kept', async ({
    page,
  }) => {
    // 900ms network latency opens a wide pending-state observation window
    // (both pending assertions must land inside it; review pass-1 MEDIUM fix).
    const controller = await installStory1722Routes(page, 'gallery', 200, 900)
    await page.goto(GALLERY_ROUTE, { waitUntil: 'domcontentloaded' })
    const installBtn = page.getByTestId(`install-btn-${STORY_172_2_NOTIFY.key}`)
    await expect(installBtn).toBeVisible({ timeout: SETTLE_TIMEOUT })

    const postSent = page.waitForResponse(
      r =>
        r.request().method() === 'POST' &&
        r.url().includes(`/v1/automation/canned-rules/${STORY_172_2_NOTIFY.key}/install`),
      { timeout: SETTLE_TIMEOUT }
    )
    await installBtn.click()
    // Pending state: the button is disabled with the in-flight label.
    await expect(installBtn).toBeDisabled({ timeout: 1_000 })
    await expect(installBtn).toContainText('Установка…')
    await postSent

    // Success: post-install deep-link banner appears with the created rule id.
    await expect(page.getByTestId('post-install-deeplink')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByTestId('open-editor-link')).toHaveAttribute(
      'href',
      `/automation/installed-rules/${STORY_172_2_INSTALLED_RULE.id}`
    )
    // Wire contract: key in the path, no body fields sent for a default install.
    expect(controller.getLastInstallUrl()).toContain(
      `/v1/automation/canned-rules/${STORY_172_2_NOTIFY.key}/install`
    )
    expect(controller.getLastInstallBody()).toEqual({})
  })

  test('AC7: 409 duplicate name opens the rename Dialog; the renamed retry installs', async ({
    page,
  }) => {
    const controller = await installStory1722Routes(page, 'gallery', 409)
    await page.goto(GALLERY_ROUTE, { waitUntil: 'domcontentloaded' })
    const installBtn = page.getByTestId(`install-btn-${STORY_172_2_PRICE.key}`)
    await expect(installBtn).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await installBtn.click()

    // The labelled Dialog appears (title + description, labelled input).
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(dialog.getByText('Правило с таким именем уже существует')).toBeVisible()
    const input = page.getByTestId('canned-rename-input')
    await expect(input).toBeVisible()
    await input.fill('Дрейф цены (копия)')

    // Flip the wire to success BEFORE the retry, so the rename flow reaches
    // its real terminal state (a fixed 409 would deterministically RE-OPEN
    // the dialog — pinned component behavior — and only timing luck could
    // observe it hidden; review pass-1 HIGH fix).
    controller.setInstallStatus(200)
    await page.getByTestId('canned-rename-submit').click()

    // Retry carried the custom name in the body…
    await expect
      .poll(() => controller.getLastInstallBody()?.name, { timeout: SETTLE_TIMEOUT })
      .toBe('Дрейф цены (копия)')
    // …the dialog is closed for good…
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: SETTLE_TIMEOUT })
    // …and the renamed install SUCCEEDED (post-install deep-link banner).
    await expect(page.getByTestId('post-install-deeplink')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
  })
})
