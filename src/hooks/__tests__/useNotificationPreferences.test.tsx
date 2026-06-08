/**
 * Tests for useNotificationPreferences hook
 * Notification preferences fetch + optimistic update mutation
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNotificationPreferences } from '../useNotificationPreferences'
import * as notificationsApi from '@/lib/api/notifications'

vi.mock('@/lib/api/notifications')
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const mockGetPreferences = vi.mocked(notificationsApi.getNotificationPreferences)
const mockUpdatePreferences = vi.mocked(notificationsApi.updateNotificationPreferences)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockPreferences = {
  enabled: true,
  preferences: { daily_report: true, weekly_report: false },
  quiet_hours: { enabled: false, start: '22:00', end: '08:00' },
}

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPreferences.mockResolvedValue(mockPreferences as unknown as never)
    mockUpdatePreferences.mockResolvedValue({ success: true } as unknown as never)
  })

  it('fetches preferences on mount', async () => {
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockGetPreferences).toHaveBeenCalledTimes(1)
    expect(result.current.preferences).toEqual(mockPreferences)
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)
  })

  it('exposes updatePreferences function', async () => {
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(typeof result.current.updatePreferences).toBe('function')
  })

  it('isUpdating is false initially', async () => {
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isUpdating).toBe(false)
  })
})
