import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCabinet, updateWbToken } from './api'

// Mock env
vi.mock('./env', () => ({
  env: {
    apiUrl: 'http://localhost:3000/api',
  },
}))

// Mock useAuthStore - we'll control this per test
let mockAuthStore: {
  token: string | null
  cabinetId: string | null
} = {
  token: null,
  cabinetId: null,
}

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => mockAuthStore,
  },
}))

// Mock Headers object for fetch Response
const mockHeaders = {
  get: vi.fn((key: string) => {
    if (key === 'content-type') return 'application/json'
    return null
  }),
}

// Create fetch mock that can be reset between tests
const fetchMock = vi.fn()

describe('createCabinet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock for each test
    vi.stubGlobal('fetch', fetchMock)
    // Reset auth store for each test
    mockAuthStore = {
      token: null,
      cabinetId: null,
    }
  })

  it('creates cabinet successfully and returns response with newToken', async () => {
    const mockResponse = {
      id: 'cabinet-uuid',
      name: 'Test Cabinet',
      isActive: true,
      createdAt: '2025-01-12T10:00:00Z',
      updatedAt: '2025-01-12T10:00:00Z',
      newToken: 'new-jwt-token-with-updated-cabinet-ids',
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: mockHeaders,
      json: async () => mockResponse,
    })

    // Set up auth state for this test
    mockAuthStore.token = 'jwt-token'
    mockAuthStore.cabinetId = null

    const result = await createCabinet(
      { name: 'Test Cabinet' },
      { token: 'jwt-token', idempotencyKey: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0' }
    )

    const init = fetchMock.mock.calls[0][1]
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/v1/cabinets')
    expect(init.method).toBe('POST')
    expect(init.headers['Authorization']).toBe('Bearer jwt-token')
    // Story 167.8: account-scoped create never sends X-Cabinet-Id — assert on the
    // WIRE header, not on internal options leaking into fetch init.
    expect(init.headers['X-Cabinet-Id']).toBeUndefined()
    expect(init.headers['Idempotency-Key']).toBe('9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0')

    expect(result).toEqual(mockResponse)
    expect(result.newToken).toBe('new-jwt-token-with-updated-cabinet-ids')
  })

  it('throws error on creation failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      headers: mockHeaders,
      json: async () => ({ message: 'Validation error' }),
    })

    await expect(
      createCabinet({ name: '' }, { token: 'jwt-token', idempotencyKey: 'key' })
    ).rejects.toThrow('Validation error')
  })
})

describe('updateWbToken', () => {
  const cabinetId = 'cabinet-uuid'
  const keyName = 'wb_api_token'
  const newToken = 'new-wb-token'
  const jwtToken = 'jwt-token'

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock for each test
    vi.stubGlobal('fetch', fetchMock)
    // Reset auth store for each test
    mockAuthStore = {
      token: null,
      cabinetId: null,
    }
  })

  it('updates token successfully', async () => {
    const mockResponse = {
      id: 'key-uuid',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: mockHeaders,
      json: async () => mockResponse,
    })

    // Set up auth state for this test
    mockAuthStore.token = jwtToken
    mockAuthStore.cabinetId = cabinetId

    const result = await updateWbToken(cabinetId, keyName, newToken, jwtToken)

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:3000/api/v1/cabinets/${cabinetId}/keys/${keyName}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
          'X-Cabinet-Id': cabinetId, // ⚠️ ОБЯЗАТЕЛЬНО!
        },
        body: JSON.stringify({ token: newToken }),
      }
    )

    expect(result).toEqual(mockResponse)
  })

  it('throws error for invalid token', async () => {
    const mockError = {
      code: 'INVALID_TOKEN',
      message: 'WB API token is invalid or expired',
      details: [
        {
          field: 'token',
          issue: 'Token validation failed',
          recommendation: 'Get a new token from https://seller.wildberries.ru/',
        },
      ],
    }

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: mockHeaders,
      json: async () => mockError,
    })

    await expect(updateWbToken(cabinetId, keyName, 'invalid-token', jwtToken)).rejects.toThrow(
      'Get a new token from https://seller.wildberries.ru/'
    )
  })

  it('throws error for missing X-Cabinet-Id header', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: mockHeaders,
      json: async () => ({
        code: 'VALIDATION_ERROR',
        message: 'Missing X-Cabinet-Id header',
      }),
    })

    await expect(updateWbToken(cabinetId, keyName, newToken, jwtToken)).rejects.toThrow()
  })

  it('throws error for insufficient permissions', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: mockHeaders,
      json: async () => ({
        message: 'Insufficient permissions',
      }),
    })

    await expect(updateWbToken(cabinetId, keyName, newToken, jwtToken)).rejects.toThrow(
      'Insufficient permissions'
    )
  })

  it('throws error for not found', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: mockHeaders,
      json: async () => ({
        message: 'Cabinet or key not found',
      }),
    })

    await expect(updateWbToken(cabinetId, keyName, newToken, jwtToken)).rejects.toThrow(
      'Cabinet or key not found'
    )
  })
})
