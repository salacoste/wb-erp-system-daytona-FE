/**
 * AT1: automation API tests (canned-rules GET + install).
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import { getCannedRules, installCannedRule, automationQueryKeys } from '../automation'

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
    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/automation/canned-rules/key-x/install',
      {}
    )
  })
})

describe('automationQueryKeys', () => {
  it('exposes stable canned-rules + rules keys', () => {
    expect(automationQueryKeys.cannedRules).toEqual(['automation', 'canned-rules'])
    expect(automationQueryKeys.rules).toEqual(['automation', 'rules'])
    expect(automationQueryKeys.ruleDetail('abc')).toEqual(['automation', 'rules', 'abc'])
  })
})
