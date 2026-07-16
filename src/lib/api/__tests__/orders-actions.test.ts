/**
 * Story O2 (confirm) / O3 (cancel) / O4 (meta): orders action API tests.
 * Verifies the exact URL + body each mutation sends.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  confirmOrder,
  cancelOrder,
  updateOrderExpiration,
  autoFillOrderExpiration,
  updateOrderMeta,
} from '../orders-actions'

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

describe('Orders Actions API (Story O3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cancelOrder POSTs to /v1/orders/:uuid/cancel', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    vi.mocked(apiClient.post).mockResolvedValue({ canceled: true })

    const result = await cancelOrder(uuid)

    expect(apiClient.post).toHaveBeenCalledWith(`/v1/orders/${uuid}/cancel`)
    expect(result).toEqual({ canceled: true })
  })
})

describe('Orders Actions API (Story O4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updateOrderMeta PATCHes /v1/orders/:uuid/meta with {metaType,value}', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    vi.mocked(apiClient.patch).mockResolvedValue({ updated: true })

    const result = await updateOrderMeta(uuid, { metaType: 'IMEI', value: '123456789012345' })

    expect(apiClient.patch).toHaveBeenCalledWith(`/v1/orders/${uuid}/meta`, {
      metaType: 'IMEI',
      value: '123456789012345',
    })
    expect(result).toEqual({ updated: true })
  })
})

describe('Orders Actions API (expiration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PUTs the ISO date to the dedicated UUID route', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    const response = {
      updated: true as const,
      expirationDate: '2030-09-12',
      decision: 'filled' as const,
    }
    vi.mocked(apiClient.put).mockResolvedValue(response)

    await expect(updateOrderExpiration(uuid, { expirationDate: '2030-09-12' })).resolves.toEqual(
      response
    )
    expect(apiClient.put).toHaveBeenCalledWith(`/v1/orders/${uuid}/meta/expiration`, {
      expirationDate: '2030-09-12',
    })
  })

  it('PUTs no body to the controlled FEFO auto-fill route', async () => {
    const uuid = '2405776e-4660-4857-ab4f-a56a3134dda9'
    vi.mocked(apiClient.put).mockResolvedValue({
      updated: true,
      expirationDate: '2030-09-12',
      decision: 'filled',
      reservationId: 'reservation-1',
      batchId: 'batch-1',
    })

    await autoFillOrderExpiration(uuid)

    expect(apiClient.put).toHaveBeenCalledWith(
      `/v1/orders/${uuid}/meta/expiration/from-stock-batch`
    )
  })
})
