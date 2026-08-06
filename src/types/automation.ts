/**
 * Automation Types — AT1 (canned rules gallery + install).
 *
 * Co-located conceptually with src/lib/api/automation.ts. Mirrors the
 * backend contract: docs/request-backend/224-automation-canned-rules-backend-contract.md
 *
 * Two layers:
 *  - `CannedRuleTemplate` — the static gallery row (GET /v1/automation/canned-rules).
 *  - `AutomationRule` — a real installed rule (POST .../install → 201 row).
 *
 * The trigger/action enums are open-ended (the backend registry grows over
 * time); we type the known members and preserve unknown ones as-is via the
 * normalizer rather than collapsing them.
 */

/**
 * Trigger types the canned-rules registry ships today (v1). The backend may
 * add more (e.g. future D19 supply triggers) — unknown values are preserved
 * by the boundary normalizer, so this union is intentionally non-exhaustive.
 */
export type AutomationTrigger =
  'STOCK_LEVEL' | 'MARGIN_BELOW' | 'PRICE_GAP' | 'ML_FORECAST' | 'SLOW_MOVER' | (string & {})

/**
 * Action types a canned rule can take. WRITEBACK_PRICE templates are inert
 * until the cabinet arms PRICE_WRITEBACK_ENABLED (see contract § Safety).
 */
export type AutomationAction =
  'NOTIFY' | 'LOG_ONLY' | 'WRITEBACK_PRICE' | 'CREATE_TASK' | (string & {})

/** Gallery category — drives card grouping + the price-writeback safety badge. */
export type CannedRuleCategory = 'notify' | 'price' | 'task' | 'audit'

/** All known categories, in display order (gallery groups by this sequence). */
export const CANNED_RULE_CATEGORIES: readonly CannedRuleCategory[] = [
  'notify',
  'audit',
  'price',
  'task',
]

/** Russian labels for each category (used as gallery group headings). */
export const CANNED_RULE_CATEGORY_LABELS: Record<CannedRuleCategory, string> = {
  notify: 'Уведомления',
  audit: 'Аудит (сухой прогон)',
  price: 'Изменение цены',
  task: 'Задачи',
}

/** Trigger params shape — intentionally permissive (varies per trigger). */
export interface AutomationTriggerParams {
  threshold?: number | string
  operator?: string
  [key: string]: unknown
}

/** Action params shape — varies per action (message / priceAdjustPct / …). */
export interface AutomationActionParams {
  message?: string
  priceAdjustPct?: number
  [key: string]: unknown
}

/**
 * Static gallery row from GET /v1/automation/canned-rules.
 * `enabledByDefault` undefined = enabled (true) unless the template opts out.
 */
export interface CannedRuleTemplate {
  /** Stable install slug, e.g. "low-stock-notify". */
  key: string
  /** Default rule name (ru). */
  name: string
  /** What the rule does (ru). */
  description: string
  /** Gallery group + safety class. */
  category: CannedRuleCategory
  /** Trigger enum + optional params. */
  trigger: AutomationTrigger
  /** Action enum + optional params. */
  action: AutomationAction
  /** Optional trigger params ({ threshold, operator }). */
  triggerParams?: AutomationTriggerParams
  /** Optional action params ({ message?, priceAdjustPct? }). */
  actionParams?: AutomationActionParams
  /** Rule priority (higher = wins on conflict). */
  priority?: number
  /** Cooldown window in minutes (min time between fires). */
  cooldownMin?: number
  /** Undefined = enabled (true) unless the template opts out. */
  enabledByDefault?: boolean
}

/** Body for POST /v1/automation/canned-rules/:key/install (optional overrides). */
export interface InstallCannedRuleBody {
  /** Custom rule name (resolves the 409 duplicate-name conflict). */
  name?: string
  /** Override the template's enabledByDefault. */
  enabled?: boolean
}

/**
 * An installed AutomationRule (POST .../install 201). Same shape as
 * POST /v1/automation/rules per the contract; only the fields the gallery
 * needs are typed here — the row is opaque otherwise.
 */
export interface AutomationRule {
  id: string
  cabinetId?: string
  name: string
  trigger: AutomationTrigger
  action: AutomationAction
  category?: CannedRuleCategory
  enabled: boolean
  priority?: number
  cooldownMin?: number
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

/**
 * Query params for GET /v1/automation/rules (Story 163.2-FE). All optional —
 * the backend accepts an empty query (returns the cabinet's full list).
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
export interface InstalledRulesQuery {
  /** Filter by enabled state (true → only active rules). */
  enabled?: boolean
  /** Filter by trigger enum (e.g. "STOCK_LEVEL"). */
  trigger?: string
  /** Filter by action enum (e.g. "WRITEBACK_PRICE"). */
  action?: string
  /** Cap the page size. */
  limit?: number
  /** Pagination offset. */
  offset?: number
}

/** Russian display labels for the known trigger enums (open-ended — unknown
 * values fall back to the raw string via triggerLabel). Story 163.2-FE. */
export const AUTOMATION_TRIGGER_LABELS: Record<string, string> = {
  STOCK_LEVEL: 'Уровень остатка',
  MARGIN_BELOW: 'Маржа ниже порога',
  PRICE_GAP: 'Разрыв в цене',
  ML_FORECAST: 'ML-прогноз',
  SLOW_MOVER: 'Неликвид',
}

/** Russian display labels for the known action enums (open-ended — unknown
 * values fall back to the raw string via actionLabel). Story 163.2-FE. */
export const AUTOMATION_ACTION_LABELS: Record<string, string> = {
  NOTIFY: 'Уведомление',
  LOG_ONLY: 'Только лог (сухой прогон)',
  WRITEBACK_PRICE: 'Изменение цены',
  CREATE_TASK: 'Создать задачу',
}

/**
 * Resolve a trigger enum to its RU label. Unknown enums (the backend registry
 * grows over time) fall back to the raw value — defensive, never throws.
 */
export function triggerLabel(t: string): string {
  return AUTOMATION_TRIGGER_LABELS[t] ?? t
}

/** Resolve an action enum to its RU label. Unknown enums fall back to the
 * raw value (defensive, never throws). */
export function actionLabel(a: string): string {
  return AUTOMATION_ACTION_LABELS[a] ?? a
}

/**
 * Safety classifier (Story 163.2-FE). A rule "requires the cabinet writeback
 * arm" when it would write prices: action WRITEBACK_PRICE, or category 'price'.
 * Installing/enabling is always safe — a disarmed rule never immediately
 * changes prices (the cabinet-level PRICE_WRITEBACK_ENABLED kill-switch gates it).
 */
export function isWritebackRule(rule: AutomationRule): boolean {
  return rule.action === 'WRITEBACK_PRICE' || rule.category === 'price'
}
