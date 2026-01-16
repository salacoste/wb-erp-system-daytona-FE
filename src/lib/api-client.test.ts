/**
 * API Client Tests
 * Story 1.5: API Client Layer & Authentication Headers
 *
 * Note: MSW is disabled for these tests to allow direct fetch mocking.
 * @see src/test/setup.ts for MSW global configuration
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { apiClient } from './api-client'
import { useAuthStore } from '@/stores/authStore'
import { ApiError } from '@/types/api'
import { server } from '@/mocks/server'

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
      token: 'test-jwt-token',
      cabinetId: 'test-cabinet-id',
    })),
  },
}))

// Mock fetch - use typed mock for proper method access
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  // Disable MSW for these tests - we need direct fetch mocking
  beforeAll(() => {
    server.close()
  })

  afterAll(() => {
    server.listen({ onUnhandledRequest: 'warn' })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('GET requests', () => {
    it(
      'includes Authorization header when token is available',
      async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { id: '1' } }),
      })

      await apiClient.get('/v1/test')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
            'X-Cabinet-Id': 'test-cabinet-id',
          }),
        }),
      )
    },
      { timeout: 5000 },
    )

    it(
      'skips auth headers when skipAuth is true',
      async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.get('/v1/auth/public', { skipAuth: true })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/public',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        }),
      )
    },
      { timeout: 5000 },
    )
  })

  describe('POST requests', () => {
    it(
      'sends JSON body and includes auth headers',
      async () => {
        const requestData = { name: 'Test' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: { id: '1', name: 'Test' } }),
        })

        await apiClient.post('/v1/test', requestData)

        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/v1/test',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(requestData),
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-jwt-token',
              'X-Cabinet-Id': 'test-cabinet-id',
            }),
          }),
        )
      },
      { timeout: 5000 },
    )
  })

  describe('Error handling', () => {
    it(
      'throws ApiError for 4xx responses',
      async () => {
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
      },
      { timeout: 5000 },
    )

    it(
      'throws ApiError for 5xx responses',
      async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ message: 'Server error' }),
        })

        await expect(apiClient.get('/v1/test')).rejects.toThrow(ApiError)
      },
      { timeout: 5000 },
    )

    it(
      'handles network errors',
      async () => {
        mockFetch.mockRejectedValueOnce(
          new Error('Network error'),
        )

        await expect(apiClient.get('/v1/test')).rejects.toThrow(ApiError)

        // Verify error details in separate call
        mockFetch.mockRejectedValueOnce(
          new Error('Network error'),
        )

        try {
          await apiClient.get('/v1/test')
          expect.fail('Should have thrown ApiError')
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError)
          expect((error as ApiError).status).toBe(0)
        }
      },
      { timeout: 5000 },
    )
  })

  describe('Response transformation', () => {
    it(
      'handles wrapped response { data: T }',
      async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: { id: '1', name: 'Test' } }),
        })

        const result = await apiClient.get<{ id: string; name: string }>(
          '/v1/test',
        )

        expect(result).toEqual({ id: '1', name: 'Test' })
      },
      { timeout: 5000 },
    )

    it(
      'handles direct response T',
      async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: '1', name: 'Test' }),
      })

      const result = await apiClient.get<{ id: string; name: string }>(
        '/v1/test',
      )

      expect(result).toEqual({ id: '1', name: 'Test' })
    },
      { timeout: 5000 },
    )

    it(
      'handles non-JSON responses',
      async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Success',
      })

      const result = await apiClient.get<string>('/v1/test')

      expect(result).toBe('Success')
    },
      { timeout: 5000 },
    )
  })

  describe('HTTP methods', () => {
    it(
      'supports PUT requests',
      async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.put('/v1/test', { name: 'Updated' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' }),
      )
    },
      { timeout: 5000 },
    )

    it(
      'supports PATCH requests',
      async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.patch('/v1/test', { name: 'Patched' })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' }),
      )
    },
      { timeout: 5000 },
    )

    it(
      'supports DELETE requests',
      async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: {} }),
      })

      await apiClient.delete('/v1/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' }),
      )
    },
      { timeout: 5000 },
    )
  })

  describe('Missing token/cabinet ID', () => {
    it(
      'works without token when skipAuth is true',
      async () => {
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

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        }),
      )
    },
      { timeout: 5000 },
    )
  })
})

