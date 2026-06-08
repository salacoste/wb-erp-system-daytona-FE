/**
 * Unit tests for useDataImportNotification hook
 *
 * This hook uses timeouts and refs internally, so we test:
 * - markNewImport function behavior
 * - Effect-based auto-detection (via mocked deps)
 * - Toast notifications
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataImportNotification } from '../useDataImportNotification'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn() },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ cabinetId: 'cab-1' }),
  },
}))

vi.mock('@/lib/notification-storage', () => ({
  getLastImportTimestamp: vi.fn().mockReturnValue(null),
  saveLastImportTimestamp: vi.fn(),
  getDismissedTimestamp: vi.fn().mockReturnValue(null),
  saveDismissedTimestamp: vi.fn(),
}))

import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { saveLastImportTimestamp } from '@/lib/notification-storage'

const mockToast = vi.mocked(toast.success)
const mockApiGet = vi.mocked(apiClient.get)

describe('useDataImportNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockApiGet.mockResolvedValue({ items: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns markNewImport function', () => {
    const { result } = renderHook(() => useDataImportNotification(true, false))
    expect(typeof result.current.markNewImport).toBe('function')
  })

  it('markNewImport shows success toast', () => {
    const { result } = renderHook(() => useDataImportNotification(true, false))
    act(() => {
      result.current.markNewImport()
    })

    expect(mockToast).toHaveBeenCalledWith(
      'Данные успешно загружены!',
      expect.objectContaining({ duration: 5000 })
    )
  })

  it('markNewImport saves timestamp', () => {
    const { result } = renderHook(() => useDataImportNotification(true, false))
    act(() => {
      result.current.markNewImport()
    })

    expect(saveLastImportTimestamp).toHaveBeenCalled()
  })

  it('does not show toast when hasData is false', () => {
    renderHook(() => useDataImportNotification(false, false))
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mockToast).not.toHaveBeenCalled()
  })

  it('does not show toast when isLoading is true', () => {
    renderHook(() => useDataImportNotification(true, true))
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mockToast).not.toHaveBeenCalled()
  })

  it('checks for completed products_sync tasks', async () => {
    const now = Date.now()
    mockApiGet.mockResolvedValue({
      items: [
        {
          type: 'products_sync',
          status: 'completed',
          updated_at: new Date(now).toISOString(),
        },
      ],
    })

    renderHook(() => useDataImportNotification(true, false))
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Allow async to resolve
    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(mockApiGet).toHaveBeenCalledWith('/v1/tasks?limit=50')
  })

  it('does not call API when hasData is false', () => {
    renderHook(() => useDataImportNotification(false, false))
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('markNewImport resets ref allowing subsequent toasts', () => {
    const { result } = renderHook(() => useDataImportNotification(true, false))
    act(() => {
      result.current.markNewImport()
    })
    expect(mockToast).toHaveBeenCalledTimes(1)

    // Second call without markNewImport is blocked by ref
    // But after markNewImport resets it, a new toast should fire
    act(() => {
      result.current.markNewImport()
    })
    expect(mockToast).toHaveBeenCalledTimes(2)
  })
})
