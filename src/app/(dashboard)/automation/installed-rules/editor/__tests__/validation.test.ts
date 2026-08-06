/**
 * Story 163.3-FE: editor validation pure-function tests.
 * Covers toEditorFormValues, validateEditorForm (RU messages), diffEditorForm
 * (editable-only, change detection), and isActivatingWriteback (AC #4).
 */
import { describe, it, expect } from 'vitest'
import {
  diffEditorForm,
  isActivatingWriteback,
  toEditorFormValues,
  validateEditorForm,
} from '../validation'
import type { AutomationRuleDetail } from '@/types/automation'

function makeRule(overrides: Partial<AutomationRuleDetail> = {}): AutomationRuleDetail {
  return {
    id: 'r1',
    name: 'Rule',
    trigger: 'STOCK_LEVEL',
    action: 'NOTIFY',
    enabled: true,
    ...overrides,
  }
}

describe('toEditorFormValues (163.3)', () => {
  it('stringifies numerics and reads typed params', () => {
    const v = toEditorFormValues(
      makeRule({
        priority: 5,
        cooldownMin: 60,
        triggerParams: { threshold: 10, operator: 'lt' },
        actionParams: { message: 'hi', priceAdjustPct: -3 },
      })
    )
    expect(v.priority).toBe('5')
    expect(v.cooldownMin).toBe('60')
    expect(v.threshold).toBe('10')
    expect(v.operator).toBe('lt')
    expect(v.priceAdjustPct).toBe('-3')
    expect(v.message).toBe('hi')
  })

  it('uses empty strings when optional numerics are absent', () => {
    const v = toEditorFormValues(makeRule())
    expect(v.priority).toBe('')
    expect(v.cooldownMin).toBe('')
    expect(v.threshold).toBe('')
  })
})

describe('validateEditorForm (163.3) — RU messages', () => {
  it('requires a name', () => {
    const e = validateEditorForm({ ...toEditorFormValues(makeRule({ name: ' ' })), name: '   ' })
    expect(e.name).toMatch(/Введите название/)
  })

  it('enforces name length ≤ 255', () => {
    const e = validateEditorForm({ ...toEditorFormValues(makeRule()), name: 'x'.repeat(256) })
    expect(e.name).toMatch(/255 символов/)
  })

  it('validates cooldown range 1..10080 (integer)', () => {
    const base = toEditorFormValues(makeRule())
    expect(validateEditorForm({ ...base, cooldownMin: '0' }).cooldownMin).toMatch(/от 1 до 10080/)
    expect(validateEditorForm({ ...base, cooldownMin: '10081' }).cooldownMin).toMatch(
      /от 1 до 10080/
    )
    expect(validateEditorForm({ ...base, cooldownMin: '1.5' }).cooldownMin).toMatch(/целое/)
    expect(validateEditorForm({ ...base, cooldownMin: '60' }).cooldownMin).toBeUndefined()
  })

  it('validates priority is a non-negative integer', () => {
    const base = toEditorFormValues(makeRule())
    expect(validateEditorForm({ ...base, priority: '-1' }).priority).toMatch(/неотрицательное/)
    expect(validateEditorForm({ ...base, priority: 'abc' }).priority).toMatch(/неотрицательное/)
    expect(validateEditorForm({ ...base, priority: '0' }).priority).toBeUndefined()
  })

  it('rejects non-finite threshold', () => {
    const base = toEditorFormValues(makeRule())
    expect(validateEditorForm({ ...base, threshold: 'abc' }).threshold).toMatch(/Введите число/)
  })

  it('validates priceAdjustPct range for WRITEBACK_PRICE only', () => {
    const base = toEditorFormValues(makeRule({ action: 'WRITEBACK_PRICE' }))
    expect(validateEditorForm({ ...base, priceAdjustPct: '-101' }).priceAdjustPct).toMatch(
      /от -100 до 100/
    )
    expect(validateEditorForm({ ...base, priceAdjustPct: '5' }).priceAdjustPct).toBeUndefined()
    // ignored for non-writeback actions
    const notify = validateEditorForm({ ...base, action: 'NOTIFY', priceAdjustPct: '-999' })
    expect(notify.priceAdjustPct).toBeUndefined()
  })

  it('requires taskType for CREATE_TASK and message for NOTIFY', () => {
    const base = toEditorFormValues(makeRule({ action: 'CREATE_TASK' }))
    expect(validateEditorForm({ ...base, taskType: '' }).taskType).toMatch(/тип задачи/)
    const notify = toEditorFormValues(makeRule({ action: 'NOTIFY' }))
    expect(validateEditorForm({ ...base, ...notify, message: '' }).message).toMatch(/уведомления/)
  })

  it('returns empty (valid) for a clean NOTIFY rule', () => {
    const v = { ...toEditorFormValues(makeRule({ action: 'NOTIFY' })), message: 'ok' }
    expect(validateEditorForm(v)).toEqual({})
  })
})

describe('diffEditorForm (163.3) — editable-only + change detection', () => {
  it('returns undefined when nothing changed', () => {
    const rule = makeRule({ name: 'Rule', enabled: true, priority: 5 })
    const v = toEditorFormValues(rule)
    expect(diffEditorForm(rule, v)).toBeUndefined()
  })

  it('emits only changed editable fields', () => {
    const rule = makeRule({ name: 'Rule', enabled: true, priority: 5, cooldownMin: 60 })
    const v = { ...toEditorFormValues(rule), name: 'New', cooldownMin: '90' }
    expect(diffEditorForm(rule, v)).toEqual({ name: 'New', cooldownMin: 90 })
  })

  it('detects triggerParams change (threshold + operator)', () => {
    const rule = makeRule({ triggerParams: { threshold: 10, operator: 'lt' } })
    const v = { ...toEditorFormValues(rule), threshold: '20', operator: 'gt' }
    expect(diffEditorForm(rule, v)?.triggerParams).toEqual({ threshold: 20, operator: 'gt' })
  })

  it('detects actionParams change', () => {
    const rule = makeRule({ action: 'NOTIFY', actionParams: { message: 'old' } })
    const v = { ...toEditorFormValues(rule), message: 'new' }
    expect(diffEditorForm(rule, v)?.actionParams).toEqual({ message: 'new' })
  })
})

describe('isActivatingWriteback (163.3, AC #4)', () => {
  it('true when enabling a writeback rule that was disabled', () => {
    const rule = makeRule({ action: 'WRITEBACK_PRICE', enabled: false })
    const v = { ...toEditorFormValues(rule), enabled: true }
    expect(isActivatingWriteback(rule, v)).toBe(true)
  })

  it('true when switching action to WRITEBACK_PRICE while enabled', () => {
    const rule = makeRule({ action: 'NOTIFY', enabled: true })
    const v = { ...toEditorFormValues(rule), action: 'WRITEBACK_PRICE' }
    expect(isActivatingWriteback(rule, v)).toBe(true)
  })

  it('false when a writeback rule stays disabled', () => {
    const rule = makeRule({ action: 'WRITEBACK_PRICE', enabled: false })
    const v = toEditorFormValues(rule)
    expect(isActivatingWriteback(rule, v)).toBe(false)
  })

  it('false for a non-writeback action that stays non-writeback', () => {
    const rule = makeRule({ action: 'NOTIFY', enabled: true })
    const v = toEditorFormValues(rule)
    expect(isActivatingWriteback(rule, v)).toBe(false)
  })
})
