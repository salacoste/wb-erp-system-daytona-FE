/**
 * Automation API — AT1 canned-rules gallery + one-click install.
 *
 * GET  /v1/automation/canned-rules            → CannedRuleTemplate[]
 * POST /v1/automation/canned-rules/:key/install { name?, enabled? } → AutomationRule
 *
 * The GET response is a top-level array (apiClient auto-unwraps the `{data}` envelope).
 * Each template is mapped through a boundary normalizer:
 *  - category enum validated with a fallback (unknown → 'audit', the safest class),
 *  - trigger/action preserved as-is (open-ended enums — see types/automation.ts),
 *  - enabledByDefault preserved as-is (undefined = enabled, per contract).
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  CannedRuleCategory,
  CannedRuleTemplate,
  AutomationRule,
  InstallCannedRuleBody,
  InstalledRulesQuery,
} from '@/types/automation'

/** Raw gallery-row shape (the backend contract object). */
interface RawCannedRule {
  key: unknown
  name: unknown
  description: unknown
  category: unknown
  trigger: unknown
  action: unknown
  triggerParams?: unknown
  actionParams?: unknown
  priority?: unknown
  cooldownMin?: unknown
  enabledByDefault?: unknown
}

/** Known category values — used to validate the backend enum. */
const KNOWN_CATEGORIES: readonly CannedRuleCategory[] = ['notify', 'price', 'task', 'audit']

/**
 * Coerce an unknown category into the FE enum. Unknown values fall back to
 * 'audit' (the safest, log-only class) so a misbehaving registry row can never
 * be silently rendered as an immediately-acting notify/price template.
 */
function toCategory(raw: unknown): CannedRuleCategory {
  return typeof raw === 'string' && (KNOWN_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as CannedRuleCategory)
    : 'audit'
}

/** Coerce a number field to a safe number (undefined otherwise). The contract
 * types priority/cooldownMin as number — validate, don't invent a coercion. */
function toOptionalNumber(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
}

/** Pass-through for opaque param objects (validate it's a record, else drop). */
function toParams(raw: unknown): Record<string, unknown> | undefined {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : undefined
}

/**
 * Normalize a raw gallery row into the FE-canonical CannedRuleTemplate.
 * Per the Boundary Normalizer Pattern: never trust the raw backend shape.
 */
function mapCannedRule(raw: RawCannedRule): CannedRuleTemplate {
  const triggerParams = toParams(raw.triggerParams)
  const actionParams = toParams(raw.actionParams)
  const priority = toOptionalNumber(raw.priority)
  const cooldownMin = toOptionalNumber(raw.cooldownMin)
  return {
    key: String(raw.key ?? ''),
    name: typeof raw.name === 'string' ? raw.name : String(raw.name ?? ''),
    description:
      typeof raw.description === 'string' ? raw.description : String(raw.description ?? ''),
    category: toCategory(raw.category),
    // Open-ended enums — preserve the backend value as-is (string-coerced).
    trigger: typeof raw.trigger === 'string' ? raw.trigger : String(raw.trigger ?? ''),
    action: typeof raw.action === 'string' ? raw.action : String(raw.action ?? ''),
    ...(triggerParams !== undefined ? { triggerParams } : {}),
    ...(actionParams !== undefined ? { actionParams } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(cooldownMin !== undefined ? { cooldownMin } : {}),
    // enabledByDefault: undefined = enabled; only forward when explicitly set.
    ...(typeof raw.enabledByDefault === 'boolean'
      ? { enabledByDefault: raw.enabledByDefault }
      : {}),
  }
}

/**
 * Fetch the canned-rules gallery (static — same for every cabinet).
 * Returns [] on a non-array response (defensive; the contract is always an array).
 */
export async function getCannedRules(): Promise<CannedRuleTemplate[]> {
  const url = '/v1/automation/canned-rules'
  logger.debug('[Automation API] Fetching canned rules')
  const raw = (await apiClient.get<unknown>(url)) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map(item => mapCannedRule((item ?? {}) as RawCannedRule))
}

/**
 * Install a canned rule into the cabinet. POST .../:key/install.
 * @param key  stable template slug (e.g. "low-stock-notify").
 * @param body optional { name?, enabled? } overrides (name resolves 409 dup).
 * @returns the created AutomationRule (201).
 */
export async function installCannedRule(
  key: string,
  body: InstallCannedRuleBody = {}
): Promise<AutomationRule> {
  const url = `/v1/automation/canned-rules/${String(key)}/install`
  logger.debug('[Automation API] Install canned rule:', { key, body })
  return apiClient.post<AutomationRule>(url, body)
}

/**
 * Raw installed-rule row shape (GET /v1/automation/rules). The backend
 * contract object; every field is `unknown` until the boundary normalizer
 * coerces it — raw backend shapes never reach components/hooks.
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
interface RawInstalledRule {
  id: unknown
  cabinetId?: unknown
  name: unknown
  trigger: unknown
  action: unknown
  category?: unknown
  enabled?: unknown
  priority?: unknown
  cooldownMin?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

/**
 * Normalize a raw installed-rule row into the FE-canonical AutomationRule.
 * Mirrors mapCannedRule (Boundary Normalizer Pattern).
 *
 * `enabled` default choice: a non-boolean value coerces to `false` (NOT
 * `true`). The installed-rules list surfaces what is currently active in the
 * cabinet; defaulting an unknown enabled state to `true` would imply a rule is
 * live when we cannot confirm it — and for WRITEBACK_PRICE rules that would
 * misleadingly suggest prices are being changed. `false` is the safer claim.
 */
function mapInstalledRule(raw: RawInstalledRule): AutomationRule {
  const category =
    raw.category !== undefined && raw.category !== null ? toCategory(raw.category) : undefined
  const priority = toOptionalNumber(raw.priority)
  const cooldownMin = toOptionalNumber(raw.cooldownMin)
  return {
    id: String(raw.id ?? ''),
    cabinetId: typeof raw.cabinetId === 'string' ? raw.cabinetId : undefined,
    name: typeof raw.name === 'string' ? raw.name : String(raw.name ?? ''),
    // Open-ended enums — preserve the backend value as-is (string-coerced).
    trigger: typeof raw.trigger === 'string' ? raw.trigger : String(raw.trigger ?? ''),
    action: typeof raw.action === 'string' ? raw.action : String(raw.action ?? ''),
    // Non-boolean → false (see default-choice comment above).
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : false,
    ...(category !== undefined ? { category } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(cooldownMin !== undefined ? { cooldownMin } : {}),
    ...(typeof raw.createdAt === 'string' ? { createdAt: raw.createdAt } : {}),
    ...(typeof raw.updatedAt === 'string' ? { updatedAt: raw.updatedAt } : {}),
  }
}

/** Serialize the optional InstalledRulesQuery into URLSearchParams (defined only). */
function toRuleParams(params?: InstalledRulesQuery): URLSearchParams | undefined {
  if (!params) return undefined
  const sp = new URLSearchParams()
  let touched = false
  if (typeof params.enabled === 'boolean') {
    sp.set('enabled', String(params.enabled))
    touched = true
  }
  if (typeof params.trigger === 'string' && params.trigger) {
    sp.set('trigger', params.trigger)
    touched = true
  }
  if (typeof params.action === 'string' && params.action) {
    sp.set('action', params.action)
    touched = true
  }
  if (typeof params.limit === 'number' && Number.isFinite(params.limit)) {
    sp.set('limit', String(params.limit))
    touched = true
  }
  if (typeof params.offset === 'number' && Number.isFinite(params.offset)) {
    sp.set('offset', String(params.offset))
    touched = true
  }
  return touched ? sp : undefined
}

/**
 * Fetch the cabinet's installed rules (GET /v1/automation/rules).
 * Story 163.2-FE. Returns [] on a non-array response (defensive). Each row is
 * mapped through mapInstalledRule so raw backend shapes never reach consumers.
 */
export async function getInstalledRules(params?: InstalledRulesQuery): Promise<AutomationRule[]> {
  const sp = toRuleParams(params)
  const url = sp ? `/v1/automation/rules?${sp.toString()}` : '/v1/automation/rules'
  logger.debug('[Automation API] Fetching installed rules:', { url })
  const raw = (await apiClient.get<unknown>(url)) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map(item => mapInstalledRule((item ?? {}) as RawInstalledRule))
}

/** Query keys for automation (React Query caching). */
export const automationQueryKeys = {
  all: ['automation'] as const,
  cannedRules: ['automation', 'canned-rules'] as const,
  rules: ['automation', 'rules'] as const,
  // Descendant of `rules` so the existing install-success invalidation
  // (automationQueryKeys.rules) refreshes the installed list automatically.
  installedRules: (params?: InstalledRulesQuery) =>
    [...automationQueryKeys.rules, 'installed', params ?? null] as const,
  ruleDetail: (id: string) => [...automationQueryKeys.rules, String(id)] as const,
}
