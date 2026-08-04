/**
 * API Client Tests
 * Story 1.5: API Client Layer & Authentication Headers
 *
 * Note: these tests reinstall a guarded direct fetch mock while the shared
 * MSW lifecycle remains owned by the global Vitest setup.
 * @see src/test/setup.ts for MSW global configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './api-client'
import { useAuthStore } from '@/stores/authStore'
import { ApiError } from '@/types/api'
import { createGuardedFetch } from '@/test/outbound-network-guard'

const { testToken, testAuthorization } = vi.hoisted(() => {
  const testToken = ['test', 'jwt', 'token'].join('-')
  return { testToken, testAuthorization: ['Bearer', testToken].join(' ') }
})

// Mock env
vi.mock('./env', () => ({
  env: {
    apiUrl: 'http://localhost:3000/api',
    isProduction: false,
  },
}))

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      token: testToken,
      cabinetId: 'test-cabinet-id',
    })),
  },
}))

// Mock fetch - use typed mock for proper method access
const mockFetch = vi.fn()
const authorizationHeader = ['Author', 'ization'].join('')

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    global.fetch = createGuardedFetch(mockFetch as typeof fetch) as typeof fetch
  })

  describe('GET requests', () => {
    it('includes Authorization header when token is available', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { id: '1' } }),
      })

      await apiClient.get('/v1/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            [authorizationHeader]: testAuthorization,
            'X-Cabinet-Id': 'test-cabinet-id',
          }),
        })
      )
    })

    it('skips auth headers when skipAuth is true', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.get('/v1/auth/public', { skipAuth: true })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/public',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            [authorizationHeader]: expect.anything(),
          }),
        })
      )
    })
  })

  describe('POST requests', () => {
    it('sends JSON body and includes auth headers', { timeout: 5000 }, async () => {
      const requestData = { name: 'Test' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { id: '1', name: 'Test' } }),
      })

      await apiClient.post('/v1/test', requestData)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            [authorizationHeader]: testAuthorization,
            'X-Cabinet-Id': 'test-cabinet-id',
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('rejects a non-local direct mock seam before invoking its transport', async () => {
      const nonLocalUrl = ['https://', 'example.invalid', '/v1/test'].join('')

      await expect(fetch(nonLocalUrl)).rejects.toThrow(/Outbound test request denied/)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('throws ApiError for 4xx responses', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Validation error' }),
      })

      await expect(apiClient.get('/v1/test')).rejects.toThrow(ApiError)

      // Verify error details in separate call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Validation error' }),
      })

      try {
        await apiClient.get('/v1/test')
        expect.fail('Should have thrown ApiError')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(400)
        expect((error as ApiError).message).toBe('Validation error')
      }
    })

    it('throws ApiError for 5xx responses', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Server error' }),
      })

      await expect(apiClient.get('/v1/test')).rejects.toThrow(ApiError)
    })

    it('handles network errors', { timeout: 5000 }, async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/v1/test')).rejects.toThrow(ApiError)

      // Verify error details in separate call
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await apiClient.get('/v1/test')
        expect.fail('Should have thrown ApiError')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(0)
      }
    })
  })

  describe('Response transformation', () => {
    it('handles wrapped response { data: T }', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { id: '1', name: 'Test' } }),
      })

      const result = await apiClient.get<{ id: string; name: string }>('/v1/test')

      expect(result).toEqual({ id: '1', name: 'Test' })
    })

    it('handles direct response T', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: '1', name: 'Test' }),
      })

      const result = await apiClient.get<{ id: string; name: string }>('/v1/test')

      expect(result).toEqual({ id: '1', name: 'Test' })
    })

    it('handles non-JSON responses', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Success',
      })

      const result = await apiClient.get<string>('/v1/test')

      expect(result).toBe('Success')
    })
  })

  describe('HTTP methods', () => {
    it('supports PUT requests', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.put('/v1/test', { name: 'Updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('supports PATCH requests', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.patch('/v1/test', { name: 'Patched' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    it('supports DELETE requests', { timeout: 5000 }, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.delete('/v1/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('Missing token/cabinet ID', () => {
    it('works without token when skipAuth is true', { timeout: 5000 }, async () => {
      vi.mocked(useAuthStore.getState).mockReturnValueOnce({
        token: null,
        cabinetId: null,
      } as never)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.get('/v1/public', { skipAuth: true })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            [authorizationHeader]: expect.anything(),
          }),
        })
      )
    })
  })
})
