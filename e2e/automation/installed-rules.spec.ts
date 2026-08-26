/**
 * Story 172.3-FE E2E — installed automation rules LIST.
 * Route: /automation/installed-rules → GET /v1/automation/rules
 *
 * Covers the applicable canonical state matrix (plan §Behavior Lock):
 * loading → populated (enabled/disabled status badges + RU trigger/action
 * labels), restricted action (writeback arm safety block), empty, error +
 * retry, and the ?highlight=<id> deep-link landing. The editor flows are
 * 163.3/172.4 territory and are NOT covered here.
 *
 * Observable-wait policy (163.3 canon): waitForResponse pre-registered
 * BEFORE navigation; toBeVisible for terminal states; no hard waits; no
 * networkidle. The first test in the file pays the dev-server cold compile
 * for the route, so its wait uses COLD_COMPILE_TIMEOUT (172.2 lesson).
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { test, expect } from '../fixtures/network-test'
import {
  installStory1723Routes,
  STORY_172_3_ENABLED_RULE,
  STORY_172_3_WRITEBACK_RULE,
} from '../fixtures/story-172-3-installed-rules'

const LIST_ROUTE = '/automation/installed-rules'
const SETTLE_TIMEOUT = 10_000
const COLD_COMPILE_TIMEOUT = 30_000

test.describe('Story 172.3 — Installed rules list @automation', () => {
  test('AC1: loads the populated list with status badges and RU labels', async ({ page }) => {
    await installStory1723Routes(page, 'populated')
    const getResponse = page.waitForResponse(
      r => r.request().method() === 'GET' && r.url().includes('/v1/automation/rules'),
      { timeout: COLD_COMPILE_TIMEOUT }
    )
    await page.goto(LIST_ROUTE, { waitUntil: 'domcontentloaded' })
    await getResponse

    await expect(page.getByRole('heading', { name: 'Установленные правила' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    // Both rows render with their names.
    await expect(page.getByTestId(`installed-rule-row-${STORY_172_3_ENABLED_RULE.id}`)).toBeVisible(
      { timeout: SETTLE_TIMEOUT }
    )
    await expect(
      page.getByTestId(`installed-rule-row-${STORY_172_3_WRITEBACK_RULE.id}`)
    ).toBeVisible({ timeout: SETTLE_TIMEOUT })
    // Status badges: enabled rule shows Включено, disabled shows Выключено.
    await expect(page.getByTestId(`enabled-badge-${STORY_172_3_ENABLED_RULE.id}`)).toContainText(
      'Включено'
    )
    await expect(page.getByTestId(`disabled-badge-${STORY_172_3_WRITEBACK_RULE.id}`)).toContainText(
      'Выключено'
    )
    // RU trigger/action labels (boundary-normalized enums → human labels).
    await expect(page.getByTestId(`trigger-${STORY_172_3_ENABLED_RULE.id}`)).not.toBeEmpty()
    await expect(page.getByTestId(`action-${STORY_172_3_ENABLED_RULE.id}`)).not.toBeEmpty()
  })

  test('AC2: restricted action — writeback rule carries the arm-safety warning, inert when disabled', async ({
    page,
  }) => {
    await installStory1723Routes(page, 'populated')
    await page.goto(LIST_ROUTE, { waitUntil: 'domcontentloaded' })
    const safety = page.getByTestId(`safety-${STORY_172_3_WRITEBACK_RULE.id}`)
    await expect(safety).toBeVisible({ timeout: SETTLE_TIMEOUT })
    // The warning is textual (meaning not color-only): arm requirement +
    // inertness explanation for a disabled rule.
    await expect(safety).toContainText('Требует arm write-back')
    await expect(safety).toContainText('Правило сейчас выключено')
    // The enabled NOTIFY rule carries no safety block.
    await expect(page.getByTestId(`safety-${STORY_172_3_ENABLED_RULE.id}`)).toHaveCount(0)
  })

  test('AC3: empty state explains and deep-links to the templates gallery', async ({ page }) => {
    await installStory1723Routes(page, 'empty')
    await page.goto(LIST_ROUTE, { waitUntil: 'domcontentloaded' })
    const empty = page.getByTestId('installed-rules-empty')
    await expect(empty).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(empty).toContainText('нет установленных правил')
    await expect(empty.getByRole('link', { name: /Перейти к шаблонам/ })).toHaveAttribute(
      'href',
      '/automation/canned-rules'
    )
  })

  test('AC4: error state renders the destructive alert with a Button retry', async ({ page }) => {
    await installStory1723Routes(page, 'error')
    await page.goto(LIST_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Не удалось загрузить правила/)).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByRole('button', { name: /Повторить/ })).toBeVisible()
  })

  test('AC5: ?highlight deep-link marks the just-installed row', async ({ page }) => {
    await installStory1723Routes(page, 'populated')
    await page.goto(`${LIST_ROUTE}?highlight=${STORY_172_3_WRITEBACK_RULE.id}`, {
      waitUntil: 'domcontentloaded',
    })
    const highlighted = page.getByTestId(`installed-rule-row-${STORY_172_3_WRITEBACK_RULE.id}`)
    await expect(highlighted).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(highlighted).toHaveClass(/border-primary/)
    // The other row is NOT highlighted.
    await expect(
      page.getByTestId(`installed-rule-row-${STORY_172_3_ENABLED_RULE.id}`)
    ).not.toHaveClass(/border-primary/)
  })
})
