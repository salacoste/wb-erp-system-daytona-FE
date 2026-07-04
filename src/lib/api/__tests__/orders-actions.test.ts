/**
 * Story O2 (confirm) / O3 (cancel) / O4 (meta): orders action API tests.
 * Verifies the exact URL + body each mutation sends.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import { confirmOrder } from '../orders-actions'

vi.spyOn(console, 'debug').mockImplementation(() => {})

describe('Orders Actions API (Story O2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirmOrder POSTs to /v1/orders/:uuid/confirm', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    vi.mocked(apiClient.post).mockResolvedValue({ confirmed: true })

    const result = await confirmOrder(uuid)

    expect(apiClient.post).toHaveBeenCalledWith(`/v1/orders/${uuid}/confirm`)
    expect(result).toEqual({ confirmed: true })
  })

  it('confirmOrder passes the UUID through String() (AP#10)', async () => {
    const uuid = '11111111-2222-3333-4444-555555555555'
    vi.mocked(apiClient.post).mockResolvedValue({ confirmed: true })
    await confirmOrder(uuid)
    const url = vi.mocked(apiClient.post).mock.calls[0][0]
    expect(url).toBe(`/v1/orders/${uuid}/confirm`)
  })
})
