/**
 * Tariff Admin (Audit Log) Boundary Normalizer Tests
 */

import { describe, it, expect } from 'vitest'
import { normalizeTariffAuditResponse } from '../tariffs-admin-normalizer'

describe('normalizeTariffAuditResponse', () => {
  it('normalizes a fully-populated audit response', () => {
    const raw = {
      data: [
        {
          id: 1,
          action: 'update',
          field_name: 'base_rate',
          old_value: '50.00',
          new_value: '55.00',
          user_id: 'user-1',
          user_email: 'admin@example.com',
          ip_address: '192.168.1.1',
          created_at: '2026-01-15T10:00:00Z',
        },
        {
          id: 2,
          action: 'create',
          field_name: 'warehouse_coefficient',
          old_value: null,
          new_value: '1.25',
          user_id: 'user-2',
          user_email: 'ops@example.com',
          ip_address: '10.0.0.1',
          created_at: '2026-01-16T12:00:00Z',
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 45,
        total_pages: 3,
      },
    }
    const result = normalizeTariffAuditResponse(raw)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].id).toBe(1)
    expect(result.data[0].action).toBe('update')
    expect(result.data[0].field_name).toBe('base_rate')
    expect(result.data[0].old_value).toBe('50.00')
    expect(result.data[0].new_value).toBe('55.00')
    expect(result.data[0].user_id).toBe('user-1')
    expect(result.data[0].user_email).toBe('admin@example.com')
    expect(result.data[0].ip_address).toBe('192.168.1.1')
    expect(result.data[0].created_at).toBe('2026-01-15T10:00:00Z')
    expect(result.data[1].old_value).toBeNull()
    expect(result.meta.page).toBe(1)
    expect(result.meta.limit).toBe(20)
    expect(result.meta.total).toBe(45)
    expect(result.meta.total_pages).toBe(3)
  })

  it('handles camelCase field aliases', () => {
    const raw = {
      data: [
        {
          id: 10,
          action: 'delete',
          fieldName: 'logistics_rate',
          oldValue: '30.00',
          newValue: null,
          userId: 'user-3',
          userEmail: 'dev@example.com',
          ipAddress: '172.16.0.1',
          createdAt: '2026-02-01',
        },
      ],
      meta: { page: 2, limit: 10, total: 15, totalPages: 2 },
    }
    const result = normalizeTariffAuditResponse(raw)
    expect(result.data[0].field_name).toBe('logistics_rate')
    expect(result.data[0].old_value).toBe('30.00')
    expect(result.data[0].new_value).toBeNull()
    expect(result.data[0].user_id).toBe('user-3')
    expect(result.data[0].user_email).toBe('dev@example.com')
    expect(result.data[0].ip_address).toBe('172.16.0.1')
    expect(result.data[0].created_at).toBe('2026-02-01')
    expect(result.meta.total_pages).toBe(2)
  })

  it('defaults data to empty array when missing', () => {
    const raw = { meta: { page: 1, limit: 10, total: 0 } }
    const result = normalizeTariffAuditResponse(raw)
    expect(result.data).toEqual([])
  })

  it('defaults meta fields to 0 when missing', () => {
    const result = normalizeTariffAuditResponse({ data: [], meta: {} })
    expect(result.meta.page).toBe(0)
    expect(result.meta.limit).toBe(0)
    expect(result.meta.total).toBe(0)
    expect(result.meta.total_pages).toBe(0)
  })

  it('preserves null for nullable string fields', () => {
    const raw = {
      data: [{ id: 1, old_value: null, new_value: null }],
      meta: {},
    }
    const result = normalizeTariffAuditResponse(raw)
    expect(result.data[0].old_value).toBeNull()
    expect(result.data[0].new_value).toBeNull()
  })

  it('handles null input', () => {
    const result = normalizeTariffAuditResponse(null)
    expect(result.data).toEqual([])
    expect(result.meta.page).toBe(0)
  })
})
