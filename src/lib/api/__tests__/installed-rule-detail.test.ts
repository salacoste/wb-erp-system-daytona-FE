/**
 * Story 163.3-FE: installed-rule detail/update API normalizer + serializer tests.
 * Covers mapInstalledRuleDetail edge cases (null/undefined/non-finite/wrong-type
 * per GET field incl. param objects) and the toUpdateBody editable-only contract
 * (read-only fields NEVER emitted). getInstalledRule/updateInstalledRule use
 * mockRejectedValueOnce for error paths.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  getInstalledRule,
  mapInstalledRuleDetail,
  toUpdateBody,
  updateInstalledRule,
} from '../installed-rule-detail'

vi.spyOn(console, 'debug').mockImplementation(() => {})

describe('mapInstalledRuleDetail (163.3)', () => {
  it('normalizes a fully-populated detail row (typed params + scope)', () => {
    const detail = mapInstalledRuleDetail({
      id: 'r1',
      name: 'Низкий остаток',
      trigger: 'STOCK_LEVEL',
      action: 'NOTIFY',
      category: 'notify',
      enabled: true,
      priority: 5,
      cooldownMin: 60,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
      triggerParams: { threshold: 10, operator: 'lt', nmIds: [1, 2], scope: 'cabinet' },
      actionParams: { message: 'Внимание', priceAdjustPct: -5, taskType: 'supply' },
      scope: { nmIds: [1, 2], categoryIds: ['a', 'b'] },
    })
    expect(detail.triggerParams).toEqual({
      threshold: 10,
      operator: 'lt',
      nmIds: [1, 2],
      scope: 'cabinet',
    })
    expect(detail.actionParams).toEqual({
      message: 'Внимание',
      priceAdjustPct: -5,
      taskType: 'supply',
    })
    expect(detail.scope).toEqual({ nmIds: [1, 2], categoryIds: ['a', 'b'] })
  })

  it('drops malformed param objects (non-record / arrays / null) without crashing', () => {
    const detail = mapInstalledRuleDetail({
      id: 'r',
      name: 'n',
      trigger: 'X',
      action: 'Y',
      enabled: true,
      triggerParams: 'nope',
      actionParams: [1, 2],
      scope: null,
    })
    expect(detail.triggerParams).toBeUndefined()
    expect(detail.actionParams).toBeUndefined()
    expect(detail.scope).toBeUndefined()
  })

  it('coerces string threshold to number, drops non-finite + invalid operator', () => {
    const detail = mapInstalledRuleDetail({
      id: 'r',
      name: 'n',
      trigger: 'X',
      action: 'Y',
      enabled: true,
      triggerParams: { threshold: '15.5', operator: 'bogus', nmIds: ['1', 'x', 2] },
    })
    expect(detail.triggerParams?.threshold).toBe(15.5)
    expect(detail.triggerParams?.operator).toBeUndefined()
    expect(detail.triggerParams?.nmIds).toEqual([1, 2]) // 'x' dropped
  })

  it('drops non-finite numeric params and returns undefined when nothing valid remains', () => {
    const detail = mapInstalledRuleDetail({
      id: 'r',
      name: 'n',
      trigger: 'X',
      action: 'Y',
      enabled: true,
      triggerParams: { threshold: Number.NaN, nmIds: 'no' },
      actionParams: { priceAdjustPct: Infinity },
    })
    expect(detail.triggerParams).toBeUndefined()
    expect(detail.actionParams).toBeUndefined()
  })

  it('coerces non-boolean enabled to false (safest default)', () => {
    const detail = mapInstalledRuleDetail({
      id: 'r',
      name: 'n',
      trigger: 'X',
      action: 'WRITEBACK_PRICE',
      enabled: null,
    })
    expect(detail.enabled).toBe(false)
  })
})

describe('toUpdateBody (163.3) — editable-only contract', () => {
  it('emits only the editable fields present', () => {
    const body = toUpdateBody({
      name: 'New',
      enabled: true,
      priority: 3,
      cooldownMin: 30,
      triggerParams: { threshold: 5, operator: 'gt' },
    })
    expect(body).toEqual({
      name: 'New',
      enabled: true,
      priority: 3,
      cooldownMin: 30,
      triggerParams: { threshold: 5, operator: 'gt' },
    })
  })

  it('NEVER emits read-only fields (id, cabinetId, createdAt, updatedAt, category)', () => {
    // Simulate a caller that mistakenly includes read-only fields. The serializer
    // only reads known editable keys, so the read-only ones are dropped at runtime
    // regardless of what the caller passes (typed input forbids them by design).
    const body = toUpdateBody({
      name: 'New',
      ...({ id: 'r1', cabinetId: 'c1', createdAt: 't', category: 'price' } as object),
    })
    expect(body).toEqual({ name: 'New' })
    expect(body).not.toHaveProperty('id')
    expect(body).not.toHaveProperty('cabinetId')
    expect(body).not.toHaveProperty('createdAt')
    expect(body).not.toHaveProperty('category')
  })

  it('drops undefined nested keys and omits empty nested objects', () => {
    const body = toUpdateBody({
      triggerParams: { threshold: 5, operator: undefined },
      actionParams: { message: undefined },
    })
    expect(body.triggerParams).toEqual({ threshold: 5 })
    expect(body.actionParams).toBeUndefined() // empty after trim
  })

  // Pass-2 hardening: pin that undefined TOP-LEVEL scalars are also dropped
  // before the wire. toUpdateBody only emits priority/cooldownMin when they are
  // `typeof === 'number'`, so an undefined value (simulating a cleared scalar
  // field that survived diffEditorForm) is NEVER serialized — guarding against
  // a regression that flipped the guard to a truthiness/`!== undefined` check.
  it('drops undefined top-level scalars (priority/cooldownMin) from the body', () => {
    const body = toUpdateBody({
      name: 'New',
      priority: undefined,
      cooldownMin: undefined,
    })
    expect(body).toEqual({ name: 'New' })
    expect(body).not.toHaveProperty('priority')
    expect(body).not.toHaveProperty('cooldownMin')
  })

  it('returns an empty object when nothing editable is set', () => {
    expect(toUpdateBody({})).toEqual({})
  })
})

describe('getInstalledRule (163.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs /v1/automation/rules/:id and normalizes the detail', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      id: 'r1',
      name: 'N',
      trigger: 'STOCK_LEVEL',
      action: 'NOTIFY',
      enabled: true,
      triggerParams: { threshold: 1, operator: 'lt' },
    })
    const detail = await getInstalledRule('r1')
    expect(apiClient.get).toHaveBeenCalledWith('/v1/automation/rules/r1')
    expect(detail.id).toBe('r1')
    expect(detail.triggerParams?.threshold).toBe(1)
  })

  it('rejects on a non-object (malformed-response) response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([])
    await expect(getInstalledRule('r1')).rejects.toThrow(/Некорректный ответ сервера/)
  })

  it('rejects on a null response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(null)
    await expect(getInstalledRule('r1')).rejects.toThrow(/Некорректный ответ сервера/)
  })

  it('propagates a 404 once (mockRejectedValueOnce)', async () => {
    const { ApiError } = await import('@/types/api')
    vi.mocked(apiClient.get).mockRejectedValueOnce(new ApiError('Not found', 404, {}))
    await expect(getInstalledRule('missing')).rejects.toMatchObject({ status: 404 })
  })
})

describe('updateInstalledRule (163.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCHes /v1/automation/rules/:id with the editable-only body and returns the detail', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      id: 'r1',
      name: 'Updated',
      trigger: 'STOCK_LEVEL',
      action: 'NOTIFY',
      enabled: false,
    })
    const detail = await updateInstalledRule('r1', { name: 'Updated', enabled: false })
    expect(apiClient.patch).toHaveBeenCalledWith('/v1/automation/rules/r1', {
      name: 'Updated',
      enabled: false,
    })
    expect(detail.name).toBe('Updated')
  })

  it('propagates a 400 once (mockRejectedValueOnce)', async () => {
    const { ApiError } = await import('@/types/api')
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new ApiError('Bad request', 400, {}))
    await expect(updateInstalledRule('r1', { priority: -1 })).rejects.toMatchObject({ status: 400 })
  })

  it('rejects on a non-object PATCH response (malformed)', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue('oops')
    await expect(updateInstalledRule('r1', { name: 'X' })).rejects.toThrow(
      /Некорректный ответ сервера/
    )
  })
})
