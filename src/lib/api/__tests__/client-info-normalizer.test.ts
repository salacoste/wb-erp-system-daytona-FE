/**
 * Client Info Normalizer Tests
 * Covers: normalizeClientInfoResponse — null safety, missing fields, empty arrays.
 */

import { describe, it, expect } from 'vitest'
import { normalizeClientInfoResponse } from '../client-info-normalizer'

describe('normalizeClientInfoResponse', () => {
  it('happy path: normalizes bare array of client info items', () => {
    const raw = [
      { orderId: 12345, clientName: 'Иван И.', clientPhone: '+7999***1234' },
      { orderId: 67890, clientName: 'Петр П.', clientPhone: '+7999***5678' },
    ]
    const result = normalizeClientInfoResponse(raw)
    expect(result).toHaveLength(2)
    expect(result[0].orderId).toBe(12345)
    expect(result[0].clientName).toBe('Иван И.')
    expect(result[0].clientPhone).toBe('+7999***1234')
    expect(result[1].orderId).toBe(67890)
  })

  it('null input returns empty array', () => {
    expect(normalizeClientInfoResponse(null)).toEqual([])
  })

  it('non-array input returns empty array', () => {
    expect(normalizeClientInfoResponse({ data: [] })).toEqual([])
    expect(normalizeClientInfoResponse('string')).toEqual([])
    expect(normalizeClientInfoResponse(42)).toEqual([])
  })

  it('empty array returns empty array', () => {
    expect(normalizeClientInfoResponse([])).toEqual([])
  })

  it('missing fields default safely (orderId=0, clientName=undefined)', () => {
    const raw = [{}]
    const result = normalizeClientInfoResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].orderId).toBe(0)
    expect(result[0].clientName).toBeUndefined()
    expect(result[0].clientPhone).toBeUndefined()
  })

  it('snake_case dual-lookup: order_id → orderId', () => {
    const raw = [{ order_id: 999, client_name: 'Test', client_phone: '+7***' }]
    const result = normalizeClientInfoResponse(raw)
    expect(result[0].orderId).toBe(999)
    expect(result[0].clientName).toBe('Test')
    expect(result[0].clientPhone).toBe('+7***')
  })

  it('string orderId is coerced to number', () => {
    const raw = [{ orderId: '12345', clientName: 'Test' }]
    const result = normalizeClientInfoResponse(raw)
    expect(result[0].orderId).toBe(12345)
  })

  it('null clientName/clientPhone become undefined', () => {
    const raw = [{ orderId: 1, clientName: null, clientPhone: null }]
    const result = normalizeClientInfoResponse(raw)
    expect(result[0].clientName).toBeUndefined()
    expect(result[0].clientPhone).toBeUndefined()
  })
})
