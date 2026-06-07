/**
 * recovery-status normalizer — Validation F-41.
 * Pins: the apiClient-unwrapped bare array → { cabinetId, tasks }; displayName derived
 * from taskType (backend omits it); omitted config fields stay undefined (panel degrades).
 */

import { describe, it, expect } from 'vitest'
import { normalizeRecoveryStatusResponse, recoveryTaskDisplayName } from '../recovery-normalizer'

const liveItem = {
  taskType: 'adv_sync',
  status: 'healthy',
  lastAttempt: null,
  totalAttempts: 0,
  canRetry: true,
}

describe('normalizeRecoveryStatusResponse — F-41', () => {
  it('rebuilds { cabinetId, tasks } from the apiClient-unwrapped bare array (prod shape)', () => {
    const res = normalizeRecoveryStatusResponse([liveItem], 'cab-1')
    expect(res.cabinetId).toBe('cab-1')
    expect(res.tasks).toHaveLength(1)
    expect(res.tasks[0].taskType).toBe('adv_sync')
    expect(res.tasks[0].status).toBe('healthy')
  })

  it('derives displayName from taskType (backend omits it) — never blank', () => {
    const res = normalizeRecoveryStatusResponse(
      [liveItem, { ...liveItem, taskType: 'ml_training' }, { ...liveItem, taskType: 'unknown_x' }],
      'c'
    )
    expect(res.tasks[0].displayName).toBe('Синхронизация рекламы')
    expect(res.tasks[1].displayName).toBe('Обучение ML-моделей')
    // unknown taskType → falls back to the raw taskType (never blank/undefined)
    expect(res.tasks[2].displayName).toBe('unknown_x')
  })

  it('leaves the omitted config fields undefined (panel degrades, not 0)', () => {
    const t = normalizeRecoveryStatusResponse([liveItem], 'c').tasks[0]
    expect(t.maxRetries).toBeUndefined()
    expect(t.cooldownMinutes).toBeUndefined()
    expect(t.maxWindowDays).toBeUndefined()
  })

  it('#187 resolved: passes through backend displayName + config fields', () => {
    const enrichedItem = {
      ...liveItem,
      displayName: 'Синхронизация рекламных кампаний',
      maxRetries: 5,
      cooldownMinutes: 30,
      maxWindowDays: 7,
    }
    const t = normalizeRecoveryStatusResponse([enrichedItem], 'c').tasks[0]
    expect(t.displayName).toBe('Синхронизация рекламных кампаний')
    expect(t.maxRetries).toBe(5)
    expect(t.cooldownMinutes).toBe(30)
    expect(t.maxWindowDays).toBe(7)
  })

  it('#187: falls back to FE label when backend displayName is empty/absent', () => {
    const noName = { ...liveItem, displayName: '' }
    const t = normalizeRecoveryStatusResponse([noName], 'c').tasks[0]
    expect(t.displayName).toBe('Синхронизация рекламы')
  })

  it('accepts the defensive { data: [...] } and { tasks: [...] } wrappers', () => {
    expect(normalizeRecoveryStatusResponse({ data: [liveItem] }, 'c').tasks).toHaveLength(1)
    expect(normalizeRecoveryStatusResponse({ tasks: [liveItem] }, 'c').tasks).toHaveLength(1)
  })

  it('never renders a blank displayName when taskType is missing', () => {
    const res = normalizeRecoveryStatusResponse([{ ...liveItem, taskType: undefined }], 'c')
    expect(res.tasks[0].displayName).toBe('Неизвестная задача')
    expect(res.tasks[0].displayName).not.toBe('')
  })

  it('returns { tasks: [] } for null / malformed input', () => {
    expect(normalizeRecoveryStatusResponse(null, 'c').tasks).toEqual([])
    expect(normalizeRecoveryStatusResponse({ success: true }, 'c').tasks).toEqual([])
  })
})

describe('recoveryTaskDisplayName', () => {
  it('prefers the known label, then backend name, then raw taskType', () => {
    expect(recoveryTaskDisplayName('stocks_sync')).toBe('Синхронизация остатков')
    expect(recoveryTaskDisplayName('custom', 'Custom Label')).toBe('Custom Label')
    expect(recoveryTaskDisplayName('custom')).toBe('custom')
    expect(recoveryTaskDisplayName('custom', '')).toBe('custom')
  })
})
