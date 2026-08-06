/**
 * Installed-rule detail + update API (Story 163.3-FE).
 *
 * Sibling of installed-rules.ts (split for the 200-effective-line source cap).
 * Holds GET /v1/automation/rules/:id + PATCH .../:id + their typed param
 * normalizers + the editable-only PATCH serializer.
 *
 * Boundary Normalizer Pattern: every backend field is `unknown` until coerced.
 * No `as` on backend data, no `any`. Read-only fields (id, cabinetId, createdAt,
 * updatedAt, category derived) are NEVER serialized on PATCH — see toUpdateBody.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  AutomationRuleActionParams,
  AutomationRuleDetail,
  AutomationRuleScope,
  AutomationRuleTriggerParams,
  UpdateAutomationRuleInput,
} from '@/types/automation'
import {
  mapInstalledRule,
  toNumberArray,
  toOperator,
  toOptionalNumber,
  toThreshold,
  toStringArray,
  type RawInstalledRule,
} from './installed-rules'

/** Coerce the raw triggerParams object into the typed shape (drop unknowns). */
function mapTriggerParams(raw: unknown): AutomationRuleTriggerParams | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const obj = raw as Record<string, unknown>
  const threshold = toThreshold(obj.threshold)
  const operator = toOperator(obj.operator)
  const nmIds = toNumberArray(obj.nmIds)
  const scope = typeof obj.scope === 'string' ? obj.scope : undefined
  const defined: AutomationRuleTriggerParams = {}
  if (threshold !== undefined) defined.threshold = threshold
  if (operator !== undefined) defined.operator = operator
  if (nmIds !== undefined) defined.nmIds = nmIds
  if (scope !== undefined) defined.scope = scope
  return Object.keys(defined).length > 0 ? defined : undefined
}

/** Coerce the raw actionParams object into the typed shape (drop unknowns). */
function mapActionParams(raw: unknown): AutomationRuleActionParams | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const obj = raw as Record<string, unknown>
  const priceAdjustPct = toOptionalNumber(obj.priceAdjustPct)
  const taskType = typeof obj.taskType === 'string' ? obj.taskType : undefined
  const message = typeof obj.message === 'string' ? obj.message : undefined
  const defined: AutomationRuleActionParams = {}
  if (priceAdjustPct !== undefined) defined.priceAdjustPct = priceAdjustPct
  if (taskType !== undefined) defined.taskType = taskType
  if (message !== undefined) defined.message = message
  return Object.keys(defined).length > 0 ? defined : undefined
}

/** Coerce the raw scope object into the typed shape (drop unknowns). */
function mapScope(raw: unknown): AutomationRuleScope | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const obj = raw as Record<string, unknown>
  const nmIds = toNumberArray(obj.nmIds)
  const categoryIds = toStringArray(obj.categoryIds)
  const defined: AutomationRuleScope = {}
  if (nmIds !== undefined) defined.nmIds = nmIds
  if (categoryIds !== undefined) defined.categoryIds = categoryIds
  return Object.keys(defined).length > 0 ? defined : undefined
}

/**
 * Normalize a raw detail row into AutomationRuleDetail (Story 163.3-FE). Adds
 * the typed trigger/action/scope params on top of mapInstalledRule. Malformed
 * param objects are dropped (never crash) — the editor never sees raw backend.
 */
export function mapInstalledRuleDetail(raw: RawInstalledRule): AutomationRuleDetail {
  const base = mapInstalledRule(raw)
  const triggerParams = mapTriggerParams(raw.triggerParams)
  const actionParams = mapActionParams(raw.actionParams)
  const scope = mapScope(raw.scope)
  return {
    ...base,
    ...(triggerParams !== undefined ? { triggerParams } : {}),
    ...(actionParams !== undefined ? { actionParams } : {}),
    ...(scope !== undefined ? { scope } : {}),
  }
}

/** Keep only keys whose value is not undefined; return undefined when empty. */
function trimDefined(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Serialize an UpdateAutomationRuleInput into the PATCH body, sending ONLY
 * editable fields. Read-only fields (id, cabinetId, createdAt, updatedAt,
 * category) are never emitted. Nested param objects are rebuilt with only their
 * defined keys so undefined optionals are dropped. Empty nested objects are
 * omitted entirely. Exported for unit tests (toUpdateBody serializer contract).
 */
export function toUpdateBody(input: UpdateAutomationRuleInput): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (typeof input.name === 'string') body.name = input.name
  if (typeof input.enabled === 'boolean') body.enabled = input.enabled
  if (typeof input.priority === 'number') body.priority = input.priority
  if (typeof input.cooldownMin === 'number') body.cooldownMin = input.cooldownMin
  if (typeof input.trigger === 'string') body.trigger = input.trigger
  if (typeof input.action === 'string') body.action = input.action
  if (input.triggerParams !== undefined) {
    const tp = trimDefined(input.triggerParams as Record<string, unknown>)
    if (tp) body.triggerParams = tp
  }
  if (input.actionParams !== undefined) {
    const ap = trimDefined(input.actionParams as Record<string, unknown>)
    if (ap) body.actionParams = ap
  }
  if (input.scope !== undefined) {
    const sc = trimDefined(input.scope as Record<string, unknown>)
    if (sc) body.scope = sc
  }
  return body
}

/**
 * Fetch a single installed rule by id (GET /v1/automation/rules/:id). Story 163.3.
 * A non-object response is rejected so the hook surfaces a malformed-response
 * error (the editor never receives a partially-shaped rule).
 */
export async function getInstalledRule(id: string): Promise<AutomationRuleDetail> {
  const url = `/v1/automation/rules/${encodeURIComponent(id)}`
  logger.debug('[Installed Rule Detail API] Fetching:', { url })
  const raw = (await apiClient.get<unknown>(url)) as unknown
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Некорректный ответ сервера: ожидался объект правила')
  }
  return mapInstalledRuleDetail(raw as RawInstalledRule)
}

/**
 * Update an installed rule (PATCH /v1/automation/rules/:id). Story 163.3-FE.
 * Only editable fields are sent (toUpdateBody). Returns the updated detail.
 */
export async function updateInstalledRule(
  id: string,
  patch: UpdateAutomationRuleInput
): Promise<AutomationRuleDetail> {
  const url = `/v1/automation/rules/${encodeURIComponent(id)}`
  const body = toUpdateBody(patch)
  logger.debug('[Installed Rule Detail API] Patching:', { url, body })
  const raw = (await apiClient.patch<unknown>(url, body)) as unknown
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Некорректный ответ сервера: ожидался объект правила')
  }
  return mapInstalledRuleDetail(raw as RawInstalledRule)
}
