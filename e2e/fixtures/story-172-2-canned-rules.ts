/**
 * Story 172.2-FE E2E fixture — route controller for the canned-rules gallery.
 *
 * Pre-registers exact-API-path Playwright routes (no `**` globs) for
 *   GET  /v1/automation/canned-rules
 *   POST /v1/automation/canned-rules/:key/install
 * and fulfills them from in-memory fixtures. The controller tracks the last
 * install body/url so the spec can assert the wire contract (key in path,
 * optional {name} body) without touching the real backend.
 *
 * Modes: 'gallery' (full 4-category list) | 'empty' ([]) | 'error' (500).
 * installStatus: 200 (success selector — fulfilled as the contract's 201
 * Created with an AutomationRule echo) | 409 (duplicate name → the FE opens
 * the rename Dialog) | 500 (generic failure via toast). `setInstallStatus`
 * flips the selector mid-test (e.g. 409 → 200 for the rename retry).
 *
 * Observable-wait pattern (163.3 canon): waitForResponse pre-registered by
 * the spec + toBeVisible — no hard waits in the spec; `installDelayMs`
 * simulates network latency INSIDE the route handler only (that is a network
 * condition, not a spec-side wait) so the pending state is observable.
 */
import type { Page, Route } from '@playwright/test'

export type Story1722Mode = 'gallery' | 'empty' | 'error'

/** Raw backend gallery rows (pre-normalizer contract shape). */
export interface Story1722Template {
  key: string
  name: string
  description: string
  category: 'notify' | 'price' | 'task' | 'audit'
  trigger: string
  action: string
  triggerParams?: Record<string, unknown>
}

/** A plain NOTIFY template (safe class). */
export const STORY_172_2_NOTIFY: Story1722Template = {
  key: 'story-172-2-low-stock',
  name: 'Низкий остаток → уведомление',
  description: 'Отправляет Telegram-уведомление, когда остаток SKU опускается ниже порога.',
  category: 'notify',
  trigger: 'STOCK_LEVEL',
  action: 'NOTIFY',
  triggerParams: { threshold: 10, operator: 'lt' },
}

/** A PRICE template (restricted class — carries the arm write-back badge). */
export const STORY_172_2_PRICE: Story1722Template = {
  key: 'story-172-2-price-drift',
  name: 'Дрейф цены → уценка',
  description: 'Сдвигает цену на процент при расхождении с рекомендацией.',
  category: 'price',
  trigger: 'PRICE_GAP',
  action: 'WRITEBACK_PRICE',
  triggerParams: { threshold: 5, operator: 'gt' },
}

/** A TASK + an AUDIT template so all four category groups render. */
export const STORY_172_2_TASK: Story1722Template = {
  key: 'story-172-2-report-task',
  name: 'Отчёт по остаткам → задача',
  description: 'Создаёт задачу на пополнение по итогу недельного отчёта.',
  category: 'task',
  trigger: 'WEEKLY_REPORT',
  action: 'CREATE_TASK',
}

export const STORY_172_2_AUDIT: Story1722Template = {
  key: 'story-172-2-margin-audit',
  name: 'Маржа ниже нормы → запись в журнал',
  description: 'Фиксирует событие в журнале аудита без действий с ценой.',
  category: 'audit',
  trigger: 'MARGIN_DROP',
  action: 'AUDIT_LOG',
}

export const STORY_172_2_GALLERY: Story1722Template[] = [
  STORY_172_2_NOTIFY,
  STORY_172_2_PRICE,
  STORY_172_2_TASK,
  STORY_172_2_AUDIT,
]

/** The created-rule echo for a successful install (AutomationRule shape). */
export const STORY_172_2_INSTALLED_RULE = {
  id: 'story-172-2-installed-rule',
  name: STORY_172_2_NOTIFY.name,
  trigger: STORY_172_2_NOTIFY.trigger,
  action: STORY_172_2_NOTIFY.action,
  enabled: true,
  category: 'notify',
}

/**
 * Install the route controller. `installStatus` selects the POST behavior;
 * `installDelayMs` delays the POST fulfillment (network latency simulation)
 * so the spec can observe the pending state.
 */
export async function installStory1722Routes(
  page: Page,
  mode: Story1722Mode = 'gallery',
  installStatus: 200 | 409 | 500 = 200,
  installDelayMs = 0
): Promise<{
  /** Last POST body received by the controller (undefined until a POST lands). */
  getLastInstallBody: () => Record<string, unknown> | undefined
  /** Last POST url the controller received. */
  getLastInstallUrl: () => string | undefined
  /** Flip the install status mid-test (e.g. 409 → 200 for the rename retry). */
  setInstallStatus: (next: 200 | 409 | 500) => void
}> {
  let lastInstallBody: Record<string, unknown> | undefined
  let lastInstallUrl: string | undefined
  let status = installStatus

  const fulfill = async (route: Route, body: unknown, statusCode = 200) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }

  const listRe = /\/v1\/automation\/canned-rules(\?.*)?$/
  const installRe = /\/v1\/automation\/canned-rules\/[^/]+\/install$/

  await page.route(listRe, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    if (mode === 'error') return fulfill(route, { message: 'gallery unavailable' }, 500)
    if (mode === 'empty') return fulfill(route, [])
    return fulfill(route, STORY_172_2_GALLERY)
  })

  await page.route(installRe, async route => {
    if (route.request().method() !== 'POST') return route.fallback()
    lastInstallUrl = route.request().url()
    lastInstallBody = (route.request().postDataJSON() ?? {}) as Record<string, unknown>
    if (installDelayMs > 0) {
      // Network latency inside the handler (NOT a spec-side hard wait).
      await new Promise(resolve => setTimeout(resolve, installDelayMs))
    }
    if (status === 409) {
      return fulfill(route, { message: 'rule name already exists', statusCode: 409 }, 409)
    }
    if (status === 500) {
      return fulfill(route, { message: 'install failed' }, 500)
    }
    // Contract § Install: 201 Created → AutomationRule (review pass-1 LOW fix).
    return fulfill(route, STORY_172_2_INSTALLED_RULE, 201)
  })

  return {
    getLastInstallBody: () => lastInstallBody,
    getLastInstallUrl: () => lastInstallUrl,
    setInstallStatus: next => {
      status = next
    },
  }
}
