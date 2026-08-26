/**
 * Story 163.3-FE E2E — installed automation rule editor.
 * Route: /automation/installed-rules/[id] → GET/PATCH /v1/automation/rules/:id
 *
 * Covers (per AC): load → edit → validate → safe-writeback → success → failure
 * → unsaved-change. Uses the repo network-test fixture + auth storageState.
 *
 * Observable-wait policy (NO hard waits, NO networkidle, NO page.clock):
 *  - waitForResponse pre-registered BEFORE the triggering action.
 *  - expect.poll / toBeVisible for terminal-state assertions.
 *  - Route globs scoped to EXACT API paths (no `**`), via the 163.3 fixture.
 *
 * First LIVE run: 2026-08-27, Story 172.4 branch (worktree
 * wb-repricer-fe-172-4-installed-rule-detail), npm wrapper on pinned node 24 —
 * 8/8 passed post-change (run report playwright-report). Earlier "written, not
 * run live" status is superseded. The fixture
 * (e2e/fixtures/story-163-3-installed-rule-editor.ts) remains the authoritative
 * source of the mocked contract.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { test, expect } from '../fixtures/network-test'
import {
  installStory1633Routes,
  STORY_163_3_DEEPMERGE_RULE,
  STORY_163_3_NOTIFY_RULE,
  STORY_163_3_RULE_ID,
  STORY_163_3_WRITEBACK_RULE,
} from '../fixtures/story-163-3-installed-rule-editor'

const EDITOR_ROUTE = `/automation/installed-rules/${STORY_163_3_RULE_ID}`
const SETTLE_TIMEOUT = 10_000

test.describe('Story 163.3 — Installed rule editor @automation', () => {
  test('AC1/AC2: loads a rule and populates editable fields from normalized data', async ({
    page,
  }) => {
    await installStory1633Routes(page, STORY_163_3_NOTIFY_RULE, 'load')
    // Pre-register the GET response before navigation.
    const getResponse = page.waitForResponse(
      r =>
        r.request().method() === 'GET' &&
        r.url().includes(`/v1/automation/rules/${STORY_163_3_RULE_ID}`),
      { timeout: SETTLE_TIMEOUT }
    )
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await getResponse

    await expect(page.getByTestId('editor-title')).toHaveText(STORY_163_3_NOTIFY_RULE.name, {
      timeout: SETTLE_TIMEOUT,
    })
    // Editable fields populated from normalized data.
    await expect(page.getByTestId('field-name')).toHaveValue(STORY_163_3_NOTIFY_RULE.name)
    await expect(page.getByTestId('field-threshold')).toHaveValue('10')
  })

  test('AC1: renders the not-found (404) state without a retry button', async ({ page }) => {
    await installStory1633Routes(page, STORY_163_3_NOTIFY_RULE, 'not-found')
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('editor-error-state')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.getByText(/Правило не найдено/)).toBeVisible()
    await expect(page.getByTestId('editor-retry')).toHaveCount(0)
  })

  test('AC3: validation blocks submit when the name is cleared', async ({ page }) => {
    await installStory1633Routes(page, STORY_163_3_NOTIFY_RULE, 'load')
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('editor-title')).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // Clear the name → Save must be disabled (invalid cannot be submitted).
    await page.getByTestId('field-name').fill('')
    await expect(page.getByTestId('editor-save')).toBeDisabled()
  })

  test('AC4: WRITEBACK_PRICE requires an explicit acknowledgement before Save on an activating change', async ({
    page,
  }) => {
    await installStory1633Routes(page, STORY_163_3_WRITEBACK_RULE, 'load')
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('editor-title')).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // Enable the disabled writeback rule → "could activate" → Save gated by ack.
    await page.getByTestId('field-enabled').click()
    await expect(page.getByTestId('writeback-ack-checkbox')).toBeVisible()
    await expect(page.getByTestId('editor-save')).toBeDisabled()

    // Acknowledge → Save enables.
    await page.getByTestId('writeback-ack-checkbox').click()
    await expect(page.getByTestId('editor-save')).toBeEnabled()
  })

  test('AC5: valid PATCH sends only editable fields + refreshes detail (success)', async ({
    page,
  }) => {
    const controller = await installStory1633Routes(page, STORY_163_3_NOTIFY_RULE, 'load')
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('editor-title')).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // Edit the name.
    await page.getByTestId('field-name').fill('Переименовано')
    // Pre-register the PATCH response before the save click.
    const patchResponse = page.waitForResponse(
      r =>
        r.request().method() === 'PATCH' &&
        r.url().includes(`/v1/automation/rules/${STORY_163_3_RULE_ID}`),
      { timeout: SETTLE_TIMEOUT }
    )
    await page.getByTestId('editor-save').click()
    const response = await patchResponse
    expect(response.status()).toBe(200)

    // Story 172.4: success feedback surfaces in the status region on the
    // status-success tokens (consumes the editor-update-success testid).
    await expect(page.getByTestId('editor-update-success')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByTestId('editor-update-success')).toContainText('Правило обновлено.')

    // Only the changed editable field was sent (no read-only fields leaked).
    const body = controller.getLastPatchBody()
    expect(body).toEqual({ name: 'Переименовано' })
    expect(body).not.toHaveProperty('id')
    expect(body).not.toHaveProperty('cabinetId')

    // Pass-1 FIX 5 (AC #5 cache correctness): after PATCH-200 the editor's
    // detail cache is refreshed, so the renamed value is reflected on re-read.
    // The fixture reflects the PATCH body onto its in-memory rule, so a
    // subsequent GET returns the renamed rule. Observable wait on the GET
    // response, then assert the renamed title is visible (no hard wait).
    const refetchResponse = page.waitForResponse(
      r =>
        r.request().method() === 'GET' &&
        r.url().includes(`/v1/automation/rules/${STORY_163_3_RULE_ID}`),
      { timeout: SETTLE_TIMEOUT }
    )
    // Trigger a re-read by reloading the editor (exercises the GET path + cache).
    await page.reload({ waitUntil: 'domcontentloaded' })
    await refetchResponse
    await expect(page.getByTestId('editor-title')).toHaveText('Переименовано', {
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByTestId('field-name')).toHaveValue('Переименовано')
  })

  test('AC6: a 400 failure preserves unsaved input + shows an actionable error', async ({
    page,
  }) => {
    await installStory1633Routes(page, STORY_163_3_NOTIFY_RULE, 'load', 400)
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('editor-title')).toBeVisible({ timeout: SETTLE_TIMEOUT })

    await page.getByTestId('field-name').fill('Никак нет')
    const patchResponse = page.waitForResponse(
      r =>
        r.request().method() === 'PATCH' &&
        r.url().includes(`/v1/automation/rules/${STORY_163_3_RULE_ID}`),
      { timeout: SETTLE_TIMEOUT }
    )
    await page.getByTestId('editor-save').click()
    const response = await patchResponse
    expect(response.status()).toBe(400)

    // Unsaved input preserved + actionable error surfaced.
    await expect(page.getByTestId('field-name')).toHaveValue('Никак нет')
    await expect(page.getByTestId('editor-update-error')).toBeVisible({ timeout: SETTLE_TIMEOUT })
  })

  test('AC7: warns about losing unsaved changes when leaving with dirty edits', async ({
    page,
  }) => {
    await installStory1633Routes(page, STORY_163_3_NOTIFY_RULE, 'load')
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('editor-title')).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // Dirty the form, then attempt to leave.
    await page.getByTestId('field-name').fill('Грязное изменение')
    await page.getByTestId('editor-cancel').click()
    await expect(page.getByTestId('unsaved-changes-guard')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.getByText(/Несохранённые изменения будут потеряны/)).toBeVisible()

    // "Stay" keeps the editor + input.
    await page.getByTestId('unsaved-stay').click()
    await expect(page.getByTestId('unsaved-changes-guard')).toHaveCount(0)
    await expect(page.getByTestId('field-name')).toHaveValue('Грязное изменение')
  })

  // Pass-2 hardening: observable E2E proof of the deep-merge (data-loss fix).
  // AC5 edits only `name`, so it cannot catch a deep-merge regression. This case
  // seeds a rule whose triggerParams carries a sibling key (nmIds) the editor
  // does NOT surface, edits ONLY threshold, then asserts the captured PATCH body
  // preserves nmIds. Without the deep-merge (FIX1) a single-field edit would
  // wipe the SKU scope — backend applies triggerParams via column-replacement.
  test('AC5 (deep-merge): editing only threshold preserves sibling triggerParams (nmIds)', async ({
    page,
  }) => {
    const controller = await installStory1633Routes(page, STORY_163_3_DEEPMERGE_RULE, 'load')
    await page.goto(EDITOR_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('editor-title')).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // Edit ONLY threshold (leave operator/name/etc untouched).
    await page.getByTestId('field-threshold').fill('5')
    // Pre-register the PATCH response BEFORE the save click (observable wait).
    const patchResponse = page.waitForResponse(
      r =>
        r.request().method() === 'PATCH' &&
        r.url().includes(`/v1/automation/rules/${STORY_163_3_RULE_ID}`),
      { timeout: SETTLE_TIMEOUT }
    )
    await page.getByTestId('editor-save').click()
    const response = await patchResponse
    expect(response.status()).toBe(200)

    // The sibling nmIds MUST survive — only threshold changed. operator is also
    // preserved (unchanged from the seed). No name key (name was not edited).
    const body = controller.getLastPatchBody()
    expect(body).toBeDefined()
    const triggerParams = body?.triggerParams
    expect(triggerParams).toEqual({ threshold: 5, operator: 'lt', nmIds: [123, 456] })
    expect(body).not.toHaveProperty('name')
  })
})
