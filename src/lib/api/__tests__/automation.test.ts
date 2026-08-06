/**
 * AT1: automation API tests (canned-rules GET + install).
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  getCannedRules,
  installCannedRule,
  getInstalledRules,
  automationQueryKeys,
} from '../automation'

vi.spyOn(console, 'debug').mockImplementation(() => {})

describe('getCannedRules (AT1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs /v1/automation/canned-rules and normalizes the array', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        key: 'low-stock-notify',
        name: 'Низкий остаток → уведомление',
        description: 'Уведомляет при остатке < порога',
        category: 'notify',
        trigger: 'STOCK_LEVEL',
        action: 'NOTIFY',
        triggerParams: { threshold: 10, operator: '<' },
        priority: 5,
        cooldownMin: 60,
        enabledByDefault: true,
      },
      {
        key: 'price-gap-markdown',
        name: 'Дрейф цены → уценка',
        description: 'Уценивает при дрейфе > порога',
        category: 'price',
        trigger: 'PRICE_GAP',
        action: 'WRITEBACK_PRICE',
        actionParams: { priceAdjustPct: -5 },
        enabledByDefault: false,
      },
    ])

    const result = await getCannedRules()

    expect(apiClient.get).toHaveBeenCalledWith('/v1/automation/canned-rules')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      key: 'low-stock-notify',
      name: 'Низкий остаток → уведомление',
      description: 'Уведомляет при остатке < порога',
      category: 'notify',
      trigger: 'STOCK_LEVEL',
      action: 'NOTIFY',
      triggerParams: { threshold: 10, operator: '<' },
      priority: 5,
      cooldownMin: 60,
      enabledByDefault: true,
    })
    expect(result[1].category).toBe('price')
    expect(result[1].enabledByDefault).toBe(false)
  })

  it('coerces an unknown category to "audit" (safest fallback)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        key: 'weird',
        name: 'N',
        description: 'D',
        category: 'explosive', // unknown → audit
        trigger: 'UNKNOWN_TRIGGER',
        action: 'UNKNOWN_ACTION',
      },
    ])
    const [rule] = await getCannedRules()
    expect(rule.category).toBe('audit')
    // trigger/action preserved as-is (open-ended enums).
    expect(rule.trigger).toBe('UNKNOWN_TRIGGER')
    expect(rule.action).toBe('UNKNOWN_ACTION')
  })

  it('omits optional fields when absent and drops non-record params', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        key: 'minimal',
        name: 42, // non-string → stringified
        description: 'd',
        category: 'audit',
        trigger: 'STOCK_LEVEL',
        action: 'LOG_ONLY',
        triggerParams: 'not-an-object', // dropped
        priority: 'oops', // non-numeric → undefined
      },
    ])
    const [rule] = await getCannedRules()
    expect(rule.name).toBe('42')
    expect(rule.priority).toBeUndefined()
    expect(rule.triggerParams).toBeUndefined()
    expect(rule.enabledByDefault).toBeUndefined()
  })

  it('returns [] when the response is not an array (defensive)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ unexpected: true })
    const result = await getCannedRules()
    expect(result).toEqual([])
  })
})

describe('installCannedRule (AT1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs to /v1/automation/canned-rules/:key/install with the body', async () => {
    const created = { id: 'rule-1', name: 'Low stock', enabled: true }
    vi.mocked(apiClient.post).mockResolvedValue(created)

    const result = await installCannedRule('low-stock-notify', { name: 'Low stock' })

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/automation/canned-rules/low-stock-notify/install',
      { name: 'Low stock' }
    )
    expect(result).toEqual(created)
  })

  it('defaults the body to {} when no overrides are passed', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: 'r', name: 'n', enabled: true })
    await installCannedRule('key-x')
    expect(apiClient.post).toHaveBeenCalledWith('/v1/automation/canned-rules/key-x/install', {})
  })
})

describe('automationQueryKeys', () => {
  it('exposes stable canned-rules + rules keys', () => {
    expect(automationQueryKeys.cannedRules).toEqual(['automation', 'canned-rules'])
    expect(automationQueryKeys.rules).toEqual(['automation', 'rules'])
    expect(automationQueryKeys.ruleDetail('abc')).toEqual(['automation', 'rules', 'abc'])
  })

  it('installedRules is a descendant of rules (covered by rules invalidation)', () => {
    expect(automationQueryKeys.installedRules()).toEqual(['automation', 'rules', 'installed', null])
    expect(automationQueryKeys.installedRules({ enabled: true })).toEqual([
      'automation',
      'rules',
      'installed',
      { enabled: true },
    ])
  })
})

describe('getInstalledRules (163.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs /v1/automation/rules (no params) and normalizes the array', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        id: 'rule-1',
        name: 'Низкий остаток',
        trigger: 'STOCK_LEVEL',
        action: 'NOTIFY',
        category: 'notify',
        enabled: true,
        priority: 5,
        cooldownMin: 60,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])

    const [rule] = await getInstalledRules()

    expect(apiClient.get).toHaveBeenCalledWith('/v1/automation/rules')
    expect(rule).toEqual({
      id: 'rule-1',
      cabinetId: undefined,
      name: 'Низкий остаток',
      trigger: 'STOCK_LEVEL',
      action: 'NOTIFY',
      enabled: true,
      category: 'notify',
      priority: 5,
      cooldownMin: 60,
      createdAt: '2026-01-01T00:00:00Z',
    })
  })

  it('coerces a non-boolean enabled to false (safest default, never claims live)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      { id: 'r', name: 'n', trigger: 'STOCK_LEVEL', action: 'WRITEBACK_PRICE', enabled: null },
      { id: 'r2', name: 'n', trigger: 'X', action: 'Y' }, // enabled missing
    ])
    const [a, b] = await getInstalledRules()
    expect(a.enabled).toBe(false) // null → false
    expect(b.enabled).toBe(false) // missing → false
  })

  it('coerces an unknown category to "audit" and preserves unknown trigger/action', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        id: 'r',
        name: 'n',
        trigger: 'NEW_TRIGGER',
        action: 'NEW_ACTION',
        category: 'mystery',
        enabled: true,
      },
    ])
    const [rule] = await getInstalledRules()
    expect(rule.category).toBe('audit')
    expect(rule.trigger).toBe('NEW_TRIGGER') // preserved raw (open-ended enum)
    expect(rule.action).toBe('NEW_ACTION')
  })

  it('omits optional fields when absent and stringifies non-string id/name', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        id: 42, // number → stringified
        name: 7, // non-string → stringified
        trigger: 'STOCK_LEVEL',
        action: 'LOG_ONLY',
        enabled: true,
        priority: 'oops', // non-number → dropped
      },
    ])
    const [rule] = await getInstalledRules()
    expect(rule.id).toBe('42')
    expect(rule.name).toBe('7')
    expect(rule.priority).toBeUndefined()
    expect(rule.category).toBeUndefined()
  })

  it('returns [] when the response is not an array (defensive)', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ unexpected: true })
    expect(await getInstalledRules()).toEqual([])
  })

  it('builds the query string only from defined params', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([])
    await getInstalledRules({ enabled: true, trigger: 'STOCK_LEVEL', limit: 10 })
    const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
    expect(url).toContain('/v1/automation/rules?')
    expect(url).toContain('enabled=true')
    expect(url).toContain('trigger=STOCK_LEVEL')
    expect(url).toContain('limit=10')
  })

  it('omits the query string entirely when no params are defined', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([])
    await getInstalledRules({ enabled: undefined })
    expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/v1/automation/rules')
  })
})
