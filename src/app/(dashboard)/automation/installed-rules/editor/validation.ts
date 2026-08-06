/**
 * Editor form-state + validation (Story 163.3-FE).
 *
 * Pure logic (no React) so the normalizer/serializer + validation are unit-
 * testable in isolation. The editor component wires this into useState; tests
 * import validateEditorForm / diffEditorForm / isActivatingWriteback directly.
 *
 * Rules (RU messages, AC #3): name required ≤255; threshold finite numeric;
 * cooldown 1..10080; operator ∈ {lt,lte,gt,gte,eq}; action-specific ranges.
 */
import type {
  AutomationAction,
  AutomationRuleDetail,
  AutomationThresholdOperator,
  UpdateAutomationRuleInput,
} from '@/types/automation'
import { AUTOMATION_OPERATORS } from '@/types/automation'

/** Editable form values derived from a normalized AutomationRuleDetail. */
export interface EditorFormValues {
  name: string
  enabled: boolean
  priority: string
  cooldownMin: string
  trigger: string
  action: string
  threshold: string
  operator: string
  priceAdjustPct: string
  taskType: string
  message: string
}

/** Validation errors keyed by field (RU messages). Empty = valid. */
export type EditorFormErrors = Partial<Record<keyof EditorFormValues, string>>

/** Cooldown bounds (minutes): 1 minute .. 7 days. */
export const COOLDOWN_MIN = 1
export const COOLDOWN_MAX = 10080
/** name max length (backend DTO ≤255). */
export const NAME_MAX = 255
/** priceAdjustPct bounds (percent): -100 .. 100. */
export const PRICE_PCT_MIN = -100
export const PRICE_PCT_MAX = 100

/**
 * Build initial form values from a normalized rule detail. Read-only fields
 * (id/cabinetId/timestamps/category) are NOT part of the form — they never get
 * edited or sent back. Numeric fields are stringified for <Input> controlled
 * editing; empty string when absent (the editor treats blank as "unchanged/omit").
 */
export function toEditorFormValues(rule: AutomationRuleDetail): EditorFormValues {
  return {
    name: rule.name,
    enabled: rule.enabled,
    priority: rule.priority !== undefined ? String(rule.priority) : '',
    cooldownMin: rule.cooldownMin !== undefined ? String(rule.cooldownMin) : '',
    trigger: rule.trigger,
    action: rule.action,
    threshold:
      rule.triggerParams?.threshold !== undefined ? String(rule.triggerParams.threshold) : '',
    operator: rule.triggerParams?.operator ?? '',
    priceAdjustPct:
      rule.actionParams?.priceAdjustPct !== undefined
        ? String(rule.actionParams.priceAdjustPct)
        : '',
    taskType: rule.actionParams?.taskType ?? '',
    message: rule.actionParams?.message ?? '',
  }
}

/**
 * Validate the form (AC #3). Returns a map of field → RU message; empty = valid.
 * `required`-style checks block submission; out-of-range values are flagged.
 * The action-specific checks only run for the relevant action enum.
 */
export function validateEditorForm(values: EditorFormValues): EditorFormErrors {
  const errors: EditorFormErrors = {}
  const trimmedName = values.name.trim()
  if (trimmedName === '') {
    errors.name = 'Введите название правила'
  } else if (trimmedName.length > NAME_MAX) {
    errors.name = `Название не должно превышать ${NAME_MAX} символов`
  }

  if (values.cooldownMin !== '') {
    const n = Number(values.cooldownMin)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < COOLDOWN_MIN || n > COOLDOWN_MAX) {
      errors.cooldownMin = `Введите целое число от ${COOLDOWN_MIN} до ${COOLDOWN_MAX} (минут)`
    }
  }

  if (values.priority !== '') {
    const n = Number(values.priority)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      errors.priority = 'Введите целое неотрицательное число'
    }
  }

  if (values.threshold !== '') {
    const n = Number(values.threshold)
    if (!Number.isFinite(n)) {
      errors.threshold = 'Введите число'
    }
  }

  if (
    values.operator !== '' &&
    !(AUTOMATION_OPERATORS as readonly string[]).includes(values.operator)
  ) {
    errors.operator = 'Выберите оператор из списка'
  }

  // Action-specific validation (only when the action consumes the field).
  if (values.action === 'WRITEBACK_PRICE' && values.priceAdjustPct !== '') {
    const n = Number(values.priceAdjustPct)
    if (!Number.isFinite(n) || n < PRICE_PCT_MIN || n > PRICE_PCT_MAX) {
      errors.priceAdjustPct = `Введите число от ${PRICE_PCT_MIN} до ${PRICE_PCT_MAX} (процент)`
    }
  }
  if (values.action === 'CREATE_TASK' && values.taskType.trim() === '') {
    errors.taskType = 'Укажите тип задачи'
  }
  if (values.action === 'NOTIFY' && values.message.trim() === '') {
    errors.message = 'Введите текст уведомления'
  }
  return errors
}

/**
 * Diff form values against the original rule and serialize ONLY changed editable
 * fields (AC #5). Read-only fields are never emitted. Returns undefined when
 * nothing changed (caller treats undefined as "no PATCH").
 */
export function diffEditorForm(
  original: AutomationRuleDetail,
  values: EditorFormValues
): UpdateAutomationRuleInput | undefined {
  const patch: UpdateAutomationRuleInput = {}
  if (values.name !== original.name) patch.name = values.name.trim()
  if (values.enabled !== original.enabled) patch.enabled = values.enabled

  const priority = values.priority === '' ? undefined : Number(values.priority)
  const origPriority = original.priority
  if (!sameNum(priority, origPriority)) patch.priority = priority

  const cooldown = values.cooldownMin === '' ? undefined : Number(values.cooldownMin)
  const origCooldown = original.cooldownMin
  if (!sameNum(cooldown, origCooldown)) patch.cooldownMin = cooldown

  if (values.trigger !== original.trigger) patch.trigger = values.trigger as AutomationAction
  if (values.action !== original.action) patch.action = values.action as AutomationAction

  // triggerParams — only include when threshold/operator changed.
  const threshold = values.threshold === '' ? undefined : Number(values.threshold)
  const origThreshold = original.triggerParams?.threshold
  const operator =
    values.operator === '' ? undefined : (values.operator as AutomationThresholdOperator)
  const origOperator = original.triggerParams?.operator
  if (!sameNum(threshold, origThreshold) || operator !== origOperator) {
    patch.triggerParams = {}
    if (threshold !== undefined) patch.triggerParams.threshold = threshold
    if (operator !== undefined) patch.triggerParams.operator = operator
  }

  // actionParams — include when any action-specific field changed.
  const pricePct = values.priceAdjustPct === '' ? undefined : Number(values.priceAdjustPct)
  const origPricePct = original.actionParams?.priceAdjustPct
  const taskType = values.taskType.trim() === '' ? undefined : values.taskType.trim()
  const origTaskType = original.actionParams?.taskType
  const message = values.message.trim() === '' ? undefined : values.message.trim()
  const origMessage = original.actionParams?.message
  if (!sameNum(pricePct, origPricePct) || taskType !== origTaskType || message !== origMessage) {
    patch.actionParams = {}
    if (pricePct !== undefined) patch.actionParams.priceAdjustPct = pricePct
    if (taskType !== undefined) patch.actionParams.taskType = taskType
    if (message !== undefined) patch.actionParams.message = message
  }

  return Object.keys(patch).length > 0 ? patch : undefined
}

/** Structured equality for optional numbers (treats undefined === undefined). */
function sameNum(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined && b === undefined) return true
  if (a === undefined || b === undefined) return false
  return a === b
}

/**
 * Does saving the current form "could activate" price writeback (AC #4)?
 * True when the rule will be a WRITEBACK_PRICE rule AND enabled after the save.
 * Covers both (a) enabling an already-writeback rule and (b) switching action →
 * WRITEBACK_PRICE while enabled. The editor gates Save behind an ack checkbox.
 */
export function isActivatingWriteback(
  original: AutomationRuleDetail,
  values: EditorFormValues
): boolean {
  const willBeWriteback = values.action === 'WRITEBACK_PRICE' || original.category === 'price'
  if (!willBeWriteback) return false
  // "Activating" only when the rule is enabled after save AND either it was
  // disabled before, or it was not previously a writeback rule.
  const enablingNow = values.enabled && !original.enabled
  const switchingToWriteback =
    values.enabled && original.action !== 'WRITEBACK_PRICE' && values.action === 'WRITEBACK_PRICE'
  return enablingNow || switchingToWriteback
}
