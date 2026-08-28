/**
 * Story 172.9-FE E2E — communications workspace.
 * Route: /communications → GET /v1/communications/{feedbacks,feedbacks/pinned,
 * questions,chats,claims,unread}
 *
 * Covers the canonical state matrix (plan §Behavior Lock): populated sections
 * with RU labels + rating stars + answer/pin status chips + unread badge,
 * chat thread drill-in (list → detail → back, ghost Button rows, unread
 * counter), empty markers, section error + Button retry (status flip), and
 * tab selection preserved across section switches. Uses the repo network-test
 * fixture + the story-172-9 route controller (exact API paths, no `**` globs).
 *
 * Observable-wait policy (163.3 canon): waitForResponse pre-registered
 * BEFORE the triggering action; toBeVisible for terminal states; no hard
 * waits; no networkidle.
 */
import { test, expect } from './fixtures/network-test'
import { installStory1729Routes } from './fixtures/story-172-9-communications'

const WORKSPACE_ROUTE = '/communications'
const SETTLE_TIMEOUT = 10_000

test.describe('Story 172.9 — Communications workspace @communications', () => {
  test('AC1: populated workspace renders header, unread dot, stars, and status chips', async ({
    page,
  }) => {
    await installStory1729Routes(page, 'populated')
    // COLD_COMPILE_TIMEOUT: the first test in the file pays the dev-server
    // compile cost for /communications (>10s observed) — the wait must
    // tolerate it; later tests reuse the compiled route (172.2 canon).
    const getResponse = page.waitForResponse(
      r => r.request().method() === 'GET' && /\/v1\/communications\/feedbacks(\?|$)/.test(r.url()),
      { timeout: 30_000 }
    )
    await page.goto(WORKSPACE_ROUTE, { waitUntil: 'domcontentloaded' })
    await getResponse

    await expect(page.getByRole('heading', { name: 'Сообщения' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    // All five tabs render.
    for (const tab of ['Отзывы', 'Вопросы', 'Чаты', 'Претензии', 'Закреплённые']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible({ timeout: SETTLE_TIMEOUT })
    }
    // Unread badge dot (its own query; never blanks the page).
    await expect(page.getByTestId('unread-dot')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    // Rating stars carry a non-color accessible meaning (AP: aria label).
    await expect(page.getByLabel('Оценка 4 из 5')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    // Answer-status chips are textual (meaning not color-only).
    await expect(page.getByText('Отвечено', { exact: true })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByText('Без ответа', { exact: true })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
  })

  test('AC2: chats tab shows thread rows with unread counter and drill-in detail', async ({
    page,
  }) => {
    await installStory1729Routes(page, 'populated')
    await page.goto(WORKSPACE_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('tab', { name: 'Чаты' }).click()

    // Thread row is a named ghost Button with the unread counter.
    const threadRow = page.getByRole('button', { name: 'Открыть беседу chat-172-9-1' })
    await expect(threadRow).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(threadRow.getByText('3', { exact: true })).toBeVisible()
    await expect(threadRow).toContainText('Когда ожидать отправку?')

    // Drill in → thread detail (client + seller messages, composer present).
    const chatSent = page.waitForResponse(
      r => r.request().method() === 'GET' && r.url().includes('/v1/communications/chats'),
      { timeout: SETTLE_TIMEOUT }
    )
    await threadRow.click()
    await chatSent
    await expect(page.getByText('Отправим сегодня до 18:00')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByText('Продавец', { exact: true })).toBeVisible()
    // Back to the list preserves the section (selection leaves a real state).
    await page.getByRole('button', { name: 'К списку' }).click()
    await expect(threadRow).toBeVisible({ timeout: SETTLE_TIMEOUT })
  })

  test('AC3: empty workspace renders section empty markers without the unread dot', async ({
    page,
  }) => {
    await installStory1729Routes(page, 'empty')
    await page.goto(WORKSPACE_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Нет отзывов')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.getByTestId('unread-dot')).toHaveCount(0)
    await page.getByRole('tab', { name: 'Чаты' }).click()
    await expect(page.getByText('Нет чатов')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await page.getByRole('tab', { name: 'Закреплённые' }).click()
    await expect(page.getByText('Нет закреплённых отзывов')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
  })

  test('AC4: feedbacks error renders the destructive alert while sibling sections stay healthy', async ({
    page,
  }) => {
    const controller = await installStory1729Routes(page, 'populated')
    // Flip feedbacks to 500 AFTER install; every other section stays healthy
    // (independent state machines — one failure never blanks the others).
    controller.setSectionStatus('feedbacks', 500)
    await page.goto(WORKSPACE_ROUTE, { waitUntil: 'domcontentloaded' })

    // TanStack burns its retry budget on the deterministic 500s first; the
    // alert is the terminal error state (SETTLE_TIMEOUT absorbs the retries).
    await expect(page.getByText('Не удалось загрузить отзывы')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByRole('button', { name: /Повторить/ })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    // The page shell and a healthy sibling section both stay alive — one
    // failing section never blanks the workspace (independent state machines).
    await expect(page.getByRole('heading', { name: 'Сообщения' })).toBeVisible()
    await page.getByRole('tab', { name: 'Вопросы' }).click()
    await expect(page.getByText('Есть ли размер 42?')).toBeVisible({ timeout: SETTLE_TIMEOUT })
  })

  test('AC4b: the Button retry recovers the section after the wire flips to healthy', async ({
    page,
  }) => {
    const controller = await installStory1729Routes(page, 'populated')
    controller.setSectionStatus('feedbacks', 500)
    await page.goto(WORKSPACE_ROUTE, { waitUntil: 'domcontentloaded' })
    const retry = page.getByRole('button', { name: /Повторить/ })
    await expect(retry).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // Flip the wire to 200 BEFORE the retry so it reaches the real terminal
    // state (172.2 review pass-1 HIGH precedent: no fixed-status loops). Stay
    // on the feedbacks tab — remounting the section would start an unrelated
    // mount-refetch chain that can race this click.
    controller.setSectionStatus('feedbacks', 200)
    const refetched = page.waitForResponse(
      r => r.request().method() === 'GET' && /\/v1\/communications\/feedbacks(\?|$)/.test(r.url()),
      { timeout: SETTLE_TIMEOUT }
    )
    await retry.click()
    await refetched
    await expect(page.getByText('Пришло быстро, качество хорошее')).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    // Wire contract: the retry hit the exact section endpoint.
    expect(controller.getLastUrl('feedbacks')).toContain('/v1/communications/feedbacks')
  })

  test('AC5: pinned tab shows the pinned state chip; tab selection round-trips', async ({
    page,
  }) => {
    await installStory1729Routes(page, 'populated')
    await page.goto(WORKSPACE_ROUTE, { waitUntil: 'domcontentloaded' })
    // Round-trip: Отзывы → Чаты → Закреплённые (selection preserved per hop).
    await page.getByRole('tab', { name: 'Чаты' }).click()
    await expect(page.getByRole('button', { name: 'Открыть беседу chat-172-9-1' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await page.getByRole('tab', { name: 'Закреплённые' }).click()
    await expect(page.getByText('Закреплён', { exact: true })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    // Claims section content is asserted at least once (review LOW-5): the
    // claim's orderId renders in the read-only row.
    await page.getByRole('tab', { name: 'Претензии' }).click()
    await expect(page.getByText('A-123')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await page.getByRole('tab', { name: 'Чаты' }).click()
    await expect(page.getByRole('button', { name: 'Открыть беседу chat-172-9-1' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByRole('tab', { name: 'Чаты' })).toHaveAttribute('aria-selected', 'true')
  })
})
