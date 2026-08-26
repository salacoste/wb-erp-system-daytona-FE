/**
 * Story 172.3-FE E2E fixture — route controller for the installed-rules LIST.
 *
 * Pre-registers an exact-API-path Playwright route (no `**` globs) for
 *   GET /v1/automation/rules
 * and fulfills it from in-memory fixtures. Read-only surface: the list never
 * mutates (enable/disable lives in the editor — 163.3/172.4 territory).
 *
 * Modes: 'populated' (enabled NOTIFY + disabled WRITEBACK rules — exercises
 * both status badges AND the restricted-action writeback safety block) |
 * 'empty' ([]) | 'error' (500).
 *
 * Observable-wait pattern (163.3 canon): the spec pre-registers
 * waitForResponse before navigation; no spec-side hard waits.
 */
import type { Page, Route } from '@playwright/test'

export type Story1723Mode = 'populated' | 'empty' | 'error'

export const STORY_172_3_ENABLED_RULE = {
  id: 'story-172-3-enabled',
  name: 'Низкий остаток → уведомление',
  trigger: 'STOCK_LEVEL',
  action: 'NOTIFY',
  enabled: true,
  category: 'notify',
  triggerParams: { threshold: 10, operator: 'lt' },
}

export const STORY_172_3_WRITEBACK_RULE = {
  id: 'story-172-3-writeback',
  name: 'Дрейф цены → уценка',
  trigger: 'PRICE_GAP',
  action: 'WRITEBACK_PRICE',
  enabled: false,
  category: 'price',
  triggerParams: { threshold: 5, operator: 'gt' },
}

const STORY_172_3_RULES = [STORY_172_3_ENABLED_RULE, STORY_172_3_WRITEBACK_RULE]

/**
 * Install the route controller for the list query.
 */
export async function installStory1723Routes(page: Page, mode: Story1723Mode = 'populated') {
  const fulfill = async (route: Route, body: unknown, status = 200) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }

  const listRe = /\/v1\/automation\/rules(\?.*)?$/
  await page.route(listRe, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    if (mode === 'error') return fulfill(route, { message: 'rules unavailable' }, 500)
    if (mode === 'empty') return fulfill(route, [])
    return fulfill(route, STORY_172_3_RULES)
  })
}
