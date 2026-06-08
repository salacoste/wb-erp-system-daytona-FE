/**
 * Unit tests for useExportAnalytics hook
 *
 * Note: Pure function tests (formatBytes, formatExpirationDate, shouldContinuePolling,
 * buildTimeoutStatus) are in useExportAnalytics-utils.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useExportAnalytics } from '../useExportAnalytics'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'

const mockPost = vi.mocked(apiClient.post)
const mockGet = vi.mocked(apiClient.get)

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useExportAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useExportAnalytics(), { wrapper: createWrapper() })

    expect(result.current.isCreating).toBe(false)
    expect(result.current.status).toBeNull()
    expect(result.current.isPolling).toBe(false)
    expect(result.current.isTimedOut).toBe(false)
    expect(result.current.createError).toBeNull()
    expect(typeof result.current.createExport).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  it('calls createExport and sets exportId on success', async () => {
    mockPost.mockResolvedValue({ export_id: 'exp-123' })

    const { result } = renderHook(() => useExportAnalytics(), { wrapper: createWrapper() })

    act(() => {
      result.current.createExport({
        type: 'by-sku',
        week: '2025-W03',
        format: 'xlsx',
      })
    })

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/v1/exports/analytics', expect.any(Object))
    })

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false)
    })
  })

  it('polls status after creation', async () => {
    mockPost.mockResolvedValue({ export_id: 'exp-456' })
    mockGet.mockResolvedValue({
      export_id: 'exp-456',
      status: 'processing',
      progress: 50,
    })

    const { result } = renderHook(() => useExportAnalytics(), { wrapper: createWrapper() })

    act(() => {
      result.current.createExport({
        type: 'by-sku',
        week: '2025-W03',
        format: 'xlsx',
      })
    })

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/v1/exports/exp-456')
    })
  })

  it('reset clears state', async () => {
    mockPost.mockResolvedValue({ export_id: 'exp-789' })

    const { result } = renderHook(() => useExportAnalytics(), { wrapper: createWrapper() })

    act(() => {
      result.current.createExport({
        type: 'by-sku',
        week: '2025-W03',
        format: 'xlsx',
      })
    })

    await waitFor(() => {
      expect(result.current.isPolling).toBe(true)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBeNull()
    expect(result.current.isPolling).toBe(false)
    expect(result.current.isTimedOut).toBe(false)
  })

  it('handles creation error', async () => {
    mockPost.mockRejectedValueOnce(new Error('Server error'))

    const { result } = renderHook(() => useExportAnalytics(), { wrapper: createWrapper() })

    act(() => {
      result.current.createExport({
        type: 'by-sku',
        week: '2025-W03',
        format: 'xlsx',
      })
    })

    await waitFor(() => {
      expect(result.current.createError).toBeTruthy()
    })

    expect(result.current.isCreating).toBe(false)
  })

  it('stops polling when export completes', async () => {
    mockPost.mockResolvedValue({ export_id: 'exp-done' })
    mockGet.mockResolvedValue({
      export_id: 'exp-done',
      status: 'completed',
      file_url: 'https://example.com/file.xlsx',
      file_size: 1024,
    })

    const { result } = renderHook(() => useExportAnalytics(), { wrapper: createWrapper() })

    act(() => {
      result.current.createExport({
        type: 'by-sku',
        week: '2025-W03',
        format: 'xlsx',
      })
    })

    await waitFor(() => {
      expect(result.current.status?.status).toBe('completed')
    })

    expect(result.current.isPolling).toBe(false)
  })
})
