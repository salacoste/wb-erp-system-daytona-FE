/**
 * Installed-rules API — list + shared coercers/query keys.
 * Stories 163.2-FE (list) + 163.3-FE (detail/update live in installed-rule-detail.ts).
 *
 * Extracted from automation.ts (Story 163.3) to respect the 200-effective-line
 * source cap. Canned-rules gallery functions remain in automation.ts.
 *
 * Boundary Normalizer Pattern: every backend field is `unknown` until coerced.
 * No `as` on backend data, no `any`.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  CannedRuleCategory,
  AutomationRule,
  AutomationThresholdOperator,
  InstalledRulesQuery,
} from '@/types/automation'
import { AUTOMATION_OPERATORS } from '@/types/automation'

/** Known category values — used to validate the backend enum. */
const KNOWN_CATEGORIES: readonly CannedRuleCategory[] = ['notify', 'price', 'task', 'audit']

/**
 * Coerce an unknown category into the FE enum. Unknown values fall back to
 * 'audit' (the safest, log-only class). Duplicated from automation.ts (same
 * helper; extracted modules intentionally do not cross-import private utils).
 */
export function toCategory(raw: unknown): CannedRuleCategory {
  return typeof raw === 'string' && (KNOWN_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as CannedRuleCategory)
    : 'audit'
}

/** Coerce a number field to a safe finite number (undefined otherwise). */
export function toOptionalNumber(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
}

/** Coerce an unknown value into a finite threshold number (undefined otherwise). */
export function toThreshold(raw: unknown): number | undefined {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

/** Validate the operator against the known enum (undefined for anything else). */
export function toOperator(raw: unknown): AutomationThresholdOperator | undefined {
  return typeof raw === 'string' && (AUTOMATION_OPERATORS as readonly string[]).includes(raw)
    ? (raw as AutomationThresholdOperator)
    : undefined
}

/** Coerce an unknown value into a number[] of finite numbers (undefined otherwise). */
export function toNumberArray(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: number[] = []
  for (const item of raw) {
    if (typeof item === 'number' && Number.isFinite(item)) out.push(item)
    else if (typeof item === 'string' && item.trim() !== '') {
      const n = Number(item)
      if (Number.isFinite(n)) out.push(n)
    }
  }
  return out.length > 0 ? out : undefined
}

/** Coerce an unknown value into a string[] (undefined for non-array / empty). */
export function toStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out = raw.filter((item): item is string => typeof item === 'string' && item !== '')
  return out.length > 0 ? out : undefined
}

/** Raw installed-rule row shape (GET /v1/automation/rules + GET .../:id). */
export interface RawInstalledRule {
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
  triggerParams?: unknown
  actionParams?: unknown
  scope?: unknown
}

/**
 * Normalize a raw installed-rule row into the FE-canonical AutomationRule.
 *
 * `enabled` default choice: a non-boolean value coerces to `false` (NOT `true`).
 * The installed-rules list surfaces what is currently active; defaulting an
 * unknown enabled state to `true` would imply a rule is live when we cannot
 * confirm it — and for WRITEBACK_PRICE rules that would misleadingly suggest
 * prices are being changed. `false` is the safer claim.
 */
export function mapInstalledRule(raw: RawInstalledRule): AutomationRule {
  const category =
    raw.category !== undefined && raw.category !== null ? toCategory(raw.category) : undefined
  const priority = toOptionalNumber(raw.priority)
  const cooldownMin = toOptionalNumber(raw.cooldownMin)
  return {
    id: String(raw.id ?? ''),
    cabinetId: typeof raw.cabinetId === 'string' ? raw.cabinetId : undefined,
    name: typeof raw.name === 'string' ? raw.name : String(raw.name ?? ''),
    trigger: typeof raw.trigger === 'string' ? raw.trigger : String(raw.trigger ?? ''),
    action: typeof raw.action === 'string' ? raw.action : String(raw.action ?? ''),
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
 * Fetch the cabinet's installed rules (GET /v1/automation/rules). Story 163.2-FE.
 * Returns [] on a non-array response (defensive). Each row is mapped through
 * mapInstalledRule so raw backend shapes never reach consumers.
 */
export async function getInstalledRules(params?: InstalledRulesQuery): Promise<AutomationRule[]> {
  const sp = toRuleParams(params)
  const url = sp ? `/v1/automation/rules?${sp.toString()}` : '/v1/automation/rules'
  logger.debug('[Installed Rules API] Fetching installed rules:', { url })
  const raw = (await apiClient.get<unknown>(url)) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map(item => mapInstalledRule((item ?? {}) as RawInstalledRule))
}

/** Query keys for automation (React Query caching). Shared with automation.ts. */
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
