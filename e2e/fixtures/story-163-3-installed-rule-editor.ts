/**
 * Story 163.3-FE E2E fixture — route controller for the installed-rule editor.
 *
 * Pre-registers exact-API-path Playwright routes (no `**` globs) for
 *   GET   /v1/automation/rules/:id
 *   PATCH /v1/automation/rules/:id
 *   GET   /v1/automation/rules          (the list, for the back-link target)
 * and fulfills them from in-memory fixtures. The controller tracks the last
 * PATCH body so the spec can assert "only editable fields are sent".
 *
 * Observable-wait pattern: the spec uses waitForResponse (pre-registered via
 * this controller's install) + expect.poll + toBeVisible — no hard waits.
 */
import type { Page, Route } from '@playwright/test'

export const STORY_163_3_RULE_ID = 'story-163-3-rule'

export type Story1633Mode = 'load' | 'not-found' | 'forbidden' | 'server-error' | 'malformed'

/** The editable detail returned by GET and mutated by PATCH. */
export interface Story1633RuleDetail {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
  category?: string
  priority?: number
  cooldownMin?: number
  /**
   * triggerParams seed. The editor surfaces only threshold/operator; nmIds (and
   * any future sibling) MUST be preserved across a single-field edit, so the
   * deep-merge E2E (Pass-2 hardening) seeds nmIds here to assert it survives.
   */
  triggerParams?: { threshold?: number; operator?: string; nmIds?: number[] }
  actionParams?: { message?: string; priceAdjustPct?: number }
}

/** A WRITEBACK_PRICE rule (for the safe-writeback AC #4 flow). */
export const STORY_163_3_WRITEBACK_RULE: Story1633RuleDetail = {
  id: STORY_163_3_RULE_ID,
  name: 'Дрейф цены → уценка',
  trigger: 'PRICE_GAP',
  action: 'WRITEBACK_PRICE',
  enabled: false,
  category: 'price',
  triggerParams: { threshold: 5, operator: 'gt' },
  actionParams: { priceAdjustPct: -5 },
}

/** A plain NOTIFY rule (for the load/edit/success/failure flows). */
export const STORY_163_3_NOTIFY_RULE: Story1633RuleDetail = {
  id: STORY_163_3_RULE_ID,
  name: 'Низкий остаток → уведомление',
  trigger: 'STOCK_LEVEL',
  action: 'NOTIFY',
  enabled: true,
  category: 'notify',
  triggerParams: { threshold: 10, operator: 'lt' },
  actionParams: { message: 'Заканчивается остаток' },
}

/**
 * A NOTIFY rule whose triggerParams carries a SIBLING key (nmIds) the editor
 * does NOT surface. Used by the Pass-2 deep-merge E2E: editing ONLY threshold
 * must preserve nmIds in the PATCH body (backend does column-replacement, so a
 * shallow emit would silently wipe the SKU scope).
 */
export const STORY_163_3_DEEPMERGE_RULE: Story1633RuleDetail = {
  id: STORY_163_3_RULE_ID,
  name: 'Низкий остаток → уведомление (deep-merge)',
  trigger: 'STOCK_LEVEL',
  action: 'NOTIFY',
  enabled: true,
  category: 'notify',
  triggerParams: { threshold: 10, operator: 'lt', nmIds: [123, 456] },
  actionParams: { message: 'Заканчивается остаток' },
}

/**
 * Install the route controller. Returns handles the spec uses to assert state.
 * `mode` selects the GET behavior; `patchStatus` overrides the PATCH response
 * status (default 200).
 */
export async function installStory1633Routes(
  page: Page,
  initial: Story1633RuleDetail,
  mode: Story1633Mode = 'load',
  patchStatus: 200 | 400 | 403 | 404 | 409 | 500 = 200
): Promise<{
  /** Last PATCH body received by the controller (undefined until a PATCH lands). */
  getLastPatchBody: () => Record<string, unknown> | undefined
  /** Last PATCH url the controller received. */
  getLastPatchUrl: () => string | undefined
  /** Mutate the in-memory rule (so a subsequent GET reflects a PATCH). */
  setRule: (next: Story1633RuleDetail) => void
}> {
  let current: Story1633RuleDetail = { ...initial }
  let lastPatchBody: Record<string, unknown> | undefined
  let lastPatchUrl: string | undefined

  const fulfill = async (route: Route, body: unknown, status = 200) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }

  // Exact API paths — no `**` globs (per the observable-wait policy).
  // Escape the rule id against regex-special chars so a future id containing
  // `.()+*?[]{}|^$\\` can't break the path matcher (Pass-1 FIX 7, defensive).
  const escapedRuleId = STORY_163_3_RULE_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const detailRe = new RegExp(`/v1/automation/rules/${escapedRuleId}$`)
  const listRe = /\/v1\/automation\/rules(\?.*)?$/

  await page.route(detailRe, async route => {
    const method = route.request().method()
    if (method === 'GET') {
      if (mode === 'not-found') return fulfill(route, { message: 'Not found' }, 404)
      if (mode === 'forbidden') return fulfill(route, { message: 'Forbidden' }, 403)
      if (mode === 'server-error') return fulfill(route, { message: 'Server error' }, 500)
      if (mode === 'malformed') return fulfill(route, ['not-an-object'])
      return fulfill(route, current)
    }
    if (method === 'PATCH') {
      lastPatchUrl = route.request().url()
      lastPatchBody = (route.request().postDataJSON() ?? {}) as Record<string, unknown>
      if (patchStatus !== 200) {
        return fulfill(route, { message: 'patch error' }, patchStatus)
      }
      // Reflect the editable patch onto the in-memory rule (200 path).
      current = { ...current, ...(lastPatchBody as object) } as Story1633RuleDetail
      return fulfill(route, current)
    }
    await route.fallback()
  })

  await page.route(listRe, async route => {
    if (route.request().method() === 'GET') {
      return fulfill(route, [current])
    }
    await route.fallback()
  })

  return {
    getLastPatchBody: () => lastPatchBody,
    getLastPatchUrl: () => lastPatchUrl,
    setRule: next => {
      current = { ...next }
    },
  }
}
