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
