/**
 * Story 167.9: prove the immutable initiating request context actually reaches
 * transport. The store holds a DIFFERENT (live account B) token than the
 * initiating session (account A) — the request must be sent with A's token and
 * the Story 167.8 Idempotency-Key, not the store's mutable state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCabinet, getCabinetCreationOperation } from './api'

vi.mock('./env', () => ({
  env: {
    apiUrl: 'http://localhost:3000/api',
  },
}))

let mockAuthStore: { token: string | null; cabinetId: string | null; sessionNonce: string | null } =
  {
    token: null,
    cabinetId: null,
    sessionNonce: null,
  }

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => mockAuthStore,
  },
}))

const mockHeaders = {
  get: vi.fn((key: string) => {
    if (key === 'content-type') return 'application/json'
    return null
  }),
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  mockAuthStore = { token: 'store-token-B', cabinetId: 'cabinet-B', sessionNonce: 'nonce-b' }
  fetchMock.mockResolvedValue({
    ok: true,
    headers: mockHeaders,
    json: async () => ({ id: 'c1', newToken: 't' }),
  })
})

describe('createCabinet immutable transport context (Story 167.9)', () => {
  it('sends the INITIATING token, not the live store token', async () => {
    await createCabinet(
      { name: 'A Cabinet' },
      { token: 'initiating-token-A', idempotencyKey: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0' }
    )

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> }
    expect(init.headers['Authorization']).toBe('Bearer initiating-token-A')
    expect(init.headers['Authorization']).not.toContain('store-token-B')
  })

  it('sends the Story 167.8 UUID v4 Idempotency-Key header', async () => {
    await createCabinet(
      { name: 'A Cabinet' },
      { token: 'initiating-token-A', idempotencyKey: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0' }
    )

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> }
    expect(init.headers['Idempotency-Key']).toBe('9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0')
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/v1/cabinets')
  })

  it('does NOT attach the store cabinet id (create is account-scoped, no X-Cabinet-Id)', async () => {
    await createCabinet(
      { name: 'A Cabinet' },
      { token: 'initiating-token-A', idempotencyKey: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0' }
    )

    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> }
    expect(init.headers['X-Cabinet-Id']).toBeUndefined()
  })
})

describe('getCabinetCreationOperation transport (Story 167.8/167.9)', () => {
  it('authorizes with the initiating token and targets the operation route', async () => {
    await getCabinetCreationOperation('11111111-1111-4111-8111-111111111111', 'initiating-token-A')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:3000/api/v1/cabinets/creation-operations/11111111-1111-4111-8111-111111111111'
    )
    const init = fetchMock.mock.calls[0][1] as { headers: Record<string, string> }
    expect(init.headers['Authorization']).toBe('Bearer initiating-token-A')
  })
})
