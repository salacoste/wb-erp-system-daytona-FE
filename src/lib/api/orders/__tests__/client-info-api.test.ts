/**
 * Tests for client-info API — Story 86.2
 * Validates: batch size guards, endpoint shape, error propagation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
import { getClientInfo, CLIENT_INFO_MAX_BATCH } from '../client-info-api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getClientInfo', () => {
  it('calls correct endpoint with comma-separated orderIds and skipDataUnwrap', async () => {
    const mockResponse = [
      { orderId: 123, clientName: 'Иван И.', clientPhone: '+7999***1234' },
      { orderId: 456, clientName: 'Мария П.', clientPhone: '+7999***5678' },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

    const result = await getClientInfo('cab-1', ['123', '456'])

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/cabinets/cab-1/orders/client-info?orderIds=123%2C456',
      { skipDataUnwrap: true }
    )
    expect(result).toEqual(mockResponse)
  })

  it('URL-encodes cabinetId for defense-in-depth (L1)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([])
    // A cabinetId containing special chars should be URL-encoded — UUIDs do not
    // need this in practice but the encoding protects against malformed values.
    await getClientInfo('cab/with spaces', ['123'])
    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/cabinets/cab%2Fwith%20spaces/orders/client-info?orderIds=123',
      { skipDataUnwrap: true }
    )
  })

  it('rejects when cabinetId is empty', async () => {
    await expect(getClientInfo('', ['123'])).rejects.toThrow('cabinetId is required')
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('rejects when orderIds array is empty', async () => {
    await expect(getClientInfo('cab-1', [])).rejects.toThrow(
      'orderIds must contain at least one value'
    )
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('rejects when orderIds exceeds max batch size (100)', async () => {
    const tooMany = Array.from({ length: 101 }, (_, i) => String(i + 1))
    await expect(getClientInfo('cab-1', tooMany)).rejects.toThrow(
      'Maximum 100 orderIds per request'
    )
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('accepts exactly the max batch size (100 orderIds)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([])
    const exactly100 = Array.from({ length: CLIENT_INFO_MAX_BATCH }, (_, i) => String(i + 1))
    await expect(getClientInfo('cab-1', exactly100)).resolves.toEqual([])
    expect(apiClient.get).toHaveBeenCalledTimes(1)
  })

  it('returns empty array when backend has no DBW orders for the batch', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([])
    const result = await getClientInfo('cab-1', ['999'])
    expect(result).toEqual([])
  })

  it('propagates backend errors (e.g., 503 rate limit)', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Rate limit exceeded'))
    await expect(getClientInfo('cab-1', ['123'])).rejects.toThrow('Rate limit exceeded')
  })

  it('propagates 503 error with status field intact (G3 — testarch gap)', async () => {
    // Backend test-api/03-cabinets.http example #15f: 503 with retry guidance
    const rateLimitError = Object.assign(new Error('Rate limit exceeded. Retry after 60s'), {
      status: 503,
    })
    vi.mocked(apiClient.get).mockRejectedValueOnce(rateLimitError)

    await expect(getClientInfo('cab-1', ['123'])).rejects.toMatchObject({
      message: expect.stringContaining('Rate limit'),
      status: 503,
    })
  })

  it('handles BigInt orderIds as strings without precision loss', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([])
    // Order ID exceeds Number.MAX_SAFE_INTEGER — must be passed as string to URL
    await getClientInfo('cab-1', ['9007199254740993'])
    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/cabinets/cab-1/orders/client-info?orderIds=9007199254740993',
      { skipDataUnwrap: true }
    )
  })

  // ============================================================================
  // PRIVACY GUARDRAIL — module never logs PII (NFR3)
  // ============================================================================

  it('does NOT log PII to any console method on success (NFR3, M1)', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(apiClient.get).mockResolvedValueOnce([
      {
        orderId: 100,
        clientName: 'API_LEVEL_PII_NAME',
        clientPhone: 'API_LEVEL_PII_PHONE',
      },
    ])

    await getClientInfo('cab-1', ['100'])

    const allCalls = [
      ...infoSpy.mock.calls,
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ].flat()
    const serialized = JSON.stringify(allCalls)
    expect(serialized).not.toContain('API_LEVEL_PII_NAME')
    expect(serialized).not.toContain('API_LEVEL_PII_PHONE')
    // Stronger assertion: zero console.* calls during a successful API invocation
    expect(infoSpy).not.toHaveBeenCalled()
    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()

    infoSpy.mockRestore()
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('does NOT log orderIds to console (URLs could be tied back to PII)', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    vi.mocked(apiClient.get).mockResolvedValueOnce([])
    await getClientInfo('cab-1', ['DISTINCTIVE_ORDER_ID_42'])

    const serialized = JSON.stringify([...infoSpy.mock.calls.flat(), ...logSpy.mock.calls.flat()])
    expect(serialized).not.toContain('DISTINCTIVE_ORDER_ID_42')

    infoSpy.mockRestore()
    logSpy.mockRestore()
  })
})
