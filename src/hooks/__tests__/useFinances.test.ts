/**
 * NEW-7 — Finances hooks tests.
 *
 * Covers useAccountBalance / useFinanceDocuments / useFinanceDocumentCategories
 * (fetch + error via MSW server.use), and useDownloadDocument (mutation success
 * via base64 → Blob, and error via mockRejectedValueOnce). Mirrors the
 * useLiquidity test discipline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import {
  useAccountBalance,
  useFinanceDocuments,
  useFinanceDocumentCategories,
  useDownloadDocument,
  financesQueryKeys,
} from '../useFinances'
import { renderHookWithClient, setupMockAuth, clearMockAuth } from '@/test/test-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

describe('useFinances hooks', () => {
  beforeEach(() => {
    setupMockAuth()
  })
  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('useAccountBalance', () => {
    it('fetches the populated balance (camelCase, money preserved)', async () => {
      const { result } = renderHookWithClient(() => useAccountBalance())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data).toEqual({
        currency: 'RUB',
        current: 1523400.5,
        forWithdraw: 980000,
      })
    })

    it('surfaces isError on a 503 (WB rate-limit/unavailable)', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/finances/balance`, () =>
          HttpResponse.json({ message: 'rate limited' }, { status: 503 })
        )
      )
      const { result } = renderHookWithClient(() => useAccountBalance())
      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })
      expect(result.current.data).toBeUndefined()
    })

    it('does not fire when enabled is false', async () => {
      const { result } = renderHookWithClient(() => useAccountBalance({ enabled: false }))
      // Give the query a tick to prove it never starts.
      await new Promise(r => setTimeout(r, 50))
      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  describe('useFinanceDocuments', () => {
    it('fetches the documents list (bare array)', async () => {
      const { result } = renderHookWithClient(() => useFinanceDocuments({ limit: 20 }))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data?.length).toBeGreaterThan(0)
      expect(result.current.data?.[0].serviceName).toBeDefined()
    })

    it('surfaces isError on a 503', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/finances/documents`, () =>
          HttpResponse.json({ message: 'unavailable' }, { status: 503 })
        )
      )
      const { result } = renderHookWithClient(() => useFinanceDocuments())
      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })
    })
  })

  describe('useFinanceDocumentCategories', () => {
    it('fetches categories (bare array)', async () => {
      const { result } = renderHookWithClient(() => useFinanceDocumentCategories('ru'))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data?.length).toBeGreaterThan(0)
      expect(result.current.data?.[0].title).toBeDefined()
    })
  })

  describe('queryKeys', () => {
    it('scopes documents key by the full query (dedupe + cabinet-switch isolation)', () => {
      const a = financesQueryKeys.documents({ limit: 20, offset: 0 })
      const b = financesQueryKeys.documents({ limit: 20, offset: 20 })
      expect(a).not.toEqual(b)
    })
    it('scopes categories key by locale', () => {
      expect(financesQueryKeys.categories('ru')).not.toEqual(financesQueryKeys.categories('en'))
    })
  })

  describe('useDownloadDocument', () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>
    let clickSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      // Spy on URL.createObjectURL/revokeObjectURL WITHOUT replacing the global
      // URL constructor (MSW + apiClient rely on `new URL(...)`).
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    })
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('decodes base64 → Blob → triggers the browser download (returns true)', async () => {
      const { result } = renderHookWithClient(() => useDownloadDocument())

      result.current.mutate({ serviceName: 'svc/a', extension: 'pdf' })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBe(true)
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('surfaces isError on a 503 (WB rate-limit/unavailable)', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/finances/documents/:serviceName/download`, () =>
          HttpResponse.json({ message: 'rate limited' }, { status: 503 })
        )
      )
      const { result } = renderHookWithClient(() => useDownloadDocument())
      result.current.mutate({ serviceName: 'svc/a', extension: 'pdf' })
      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 })
      expect(result.current.error).toBeInstanceOf(Error)
    })

    it('returns false for an empty base64 document (no crash, no download)', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/finances/documents/:serviceName/download`, () =>
          HttpResponse.json({ fileName: null, extension: null, document: null })
        )
      )
      const { result } = renderHookWithClient(() => useDownloadDocument())
      result.current.mutate({ serviceName: 'svc/a', extension: 'pdf' })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toBe(false)
      expect(createObjectURLSpy).not.toHaveBeenCalled()
    })
  })
})
