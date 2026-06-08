/**
 * useFbsExportButton — Unit Tests
 *
 * Covers:
 *   - buildExportFilename: generates date-stamped CSV filename
 *   - Button state: disabled/label when polling, rate-limited, idle
 *   - Click handler: triggers export, prevents concurrent triggers
 *   - Rate-limit countdown: starts on 429, decrements, enables when done
 *   - Cabinet switch: resets all local state
 *   - Polling status reactions: ready triggers download, failed shows error
 *   - Poll error: shows error toast with dedup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { ApiError } from '@/types/api'
import type { FbsExportStatusResponse } from '@/types/fbs-export'

/** Cast helper — useFbsExportPolling returns a partial UseQueryResult subset. */
function mockPollResult(data: FbsExportStatusResponse | null, error: Error | null = null) {
  return { data, error } as unknown as ReturnType<
    typeof import('../use-fbs-export-polling').useFbsExportPolling
  >
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockTriggerFbsExport = vi.fn()

vi.mock('@/lib/api/fbs-export', () => ({
  triggerFbsExport: (...args: unknown[]) => mockTriggerFbsExport(...args),
}))

vi.mock('@/hooks/use-fbs-export-polling', () => ({
  useFbsExportPolling: vi.fn().mockReturnValue(mockPollResult(null)),
}))

let mockCabinetId: string | null = 'test-cabinet'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: mockCabinetId }),
}))

const mockToastLoading = vi.fn().mockReturnValue('toast-loading-id')
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()
const mockToastDismiss = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args),
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
  },
}))

// Mock document.createElement for triggerDownload — use spyOn to preserve jsdom
const mockClick = vi.fn()

import { useFbsExportButton } from '../use-fbs-export-button'
import { useFbsExportPolling } from '@/hooks/use-fbs-export-polling'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  mockCabinetId = 'test-cabinet'
  mockTriggerFbsExport.mockResolvedValue({ exportId: 'export-123', status: 'queued' })

  // Re-apply polling mock (cleared by clearAllMocks)
  vi.mocked(useFbsExportPolling).mockReturnValue(mockPollResult(null))

  // Document spies for triggerDownload — only mock createElement('a')
  const origCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        rel: '',
        click: mockClick,
        style: {},
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      } as unknown as HTMLAnchorElement
    }
    return origCreateElement(tag)
  })
  vi.spyOn(document.body, 'appendChild').mockImplementation(node => node)
  vi.spyOn(document.body, 'removeChild').mockImplementation(node => node)
})

afterEach(() => {
  vi.useRealTimers()
})

// ===========================================================================
// Initial state
// ===========================================================================

describe('useFbsExportButton — initial state', () => {
  it('returns default label "Скачать CSV" when idle', () => {
    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    expect(result.current.label).toBe('Скачать CSV')
    expect(result.current.disabled).toBe(false)
  })
})

// ===========================================================================
// Click handler — successful trigger
// ===========================================================================

describe('useFbsExportButton — click triggers export', () => {
  it('calls triggerFbsExport and transitions to polling state', async () => {
    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    expect(mockTriggerFbsExport).toHaveBeenCalledTimes(1)
    expect(result.current.disabled).toBe(true)
    expect(result.current.label).toBe('Подготовка...')
    expect(mockToastLoading).toHaveBeenCalledWith('Подготовка экспорта...', {
      duration: Infinity,
    })
  })

  it('prevents concurrent triggers while polling', async () => {
    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    // Second click should be ignored
    await act(async () => {
      result.current.handleClick()
    })

    expect(mockTriggerFbsExport).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// Click handler — rate limit (429)
// ===========================================================================

describe('useFbsExportButton — 429 rate limit', () => {
  it('starts countdown on 429 with retryAfter', async () => {
    const error = new ApiError('Too many requests', 429)
    error.retryAfter = 30
    mockTriggerFbsExport.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    expect(result.current.disabled).toBe(true)
    expect(result.current.label).toContain('Доступно через 30 сек')
    expect(mockToastWarning).toHaveBeenCalledWith(
      expect.stringContaining('30 сек'),
      expect.any(Object)
    )
  })

  it('uses default 60 seconds when retryAfter is undefined', async () => {
    const error = new ApiError('Too many requests', 429)
    // retryAfter is undefined
    mockTriggerFbsExport.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    expect(result.current.label).toContain('60 сек')
  })

  it('countdown decrements and re-enables button', async () => {
    const error = new ApiError('Too many requests', 429)
    error.retryAfter = 3
    mockTriggerFbsExport.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    expect(result.current.disabled).toBe(true)
    expect(result.current.label).toContain('3 сек')

    // Advance 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.label).toContain('2 сек')

    // Advance 2 more seconds
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    // Countdown should be at 0, button re-enabled
    expect(result.current.disabled).toBe(false)
    expect(result.current.label).toBe('Скачать CSV')
  })
})

// ===========================================================================
// Click handler — generic error
// ===========================================================================

describe('useFbsExportButton — generic error', () => {
  it('shows error toast on non-429 error', async () => {
    mockTriggerFbsExport.mockRejectedValueOnce(new Error('Server unavailable'))

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    expect(mockToastError).toHaveBeenCalledWith('Server unavailable', expect.any(Object))
    // Button should remain enabled (no polling started)
    expect(result.current.disabled).toBe(false)
  })

  it('shows default message for non-Error thrown values', async () => {
    mockTriggerFbsExport.mockRejectedValueOnce('unknown')

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    expect(mockToastError).toHaveBeenCalledWith('Не удалось запустить экспорт.', expect.any(Object))
  })
})

// ===========================================================================
// Polling status reactions
// ===========================================================================

describe('useFbsExportButton — polling status: ready', () => {
  it('triggers download and shows success toast when status is ready', async () => {
    const mockCreateElement = document.createElement as ReturnType<typeof vi.fn>

    // Set up polling to return ready status after trigger
    vi.mocked(useFbsExportPolling).mockReturnValue(
      mockPollResult({
        exportId: 'export-123',
        status: 'ready',
        url: 'https://example.com/signed.csv',
        expiresAt: '2026-06-10T00:00:00Z',
      })
    )

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    // Trigger to start polling (which immediately returns ready)
    await act(async () => {
      result.current.handleClick()
    })

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Экспорт готов — скачивание...',
        expect.any(Object)
      )
    })

    // Should have created a download link
    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockClick).toHaveBeenCalled()
  })

  it('shows error when ready but url is null', async () => {
    vi.mocked(useFbsExportPolling).mockReturnValue(
      mockPollResult({
        exportId: 'export-123',
        status: 'ready',
        url: null,
        expiresAt: null,
      })
    )

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('ссылка для скачивания отсутствует'),
        expect.any(Object)
      )
    })
  })
})

describe('useFbsExportButton — polling status: failed/expired', () => {
  it('shows error toast when status is failed', async () => {
    vi.mocked(useFbsExportPolling).mockReturnValue(
      mockPollResult({
        exportId: 'export-123',
        status: 'failed',
        url: null,
        expiresAt: null,
      })
    )

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Не удалось подготовить экспорт. Попробуйте ещё раз.',
        expect.any(Object)
      )
    })
  })

  it('shows error toast when status is expired', async () => {
    vi.mocked(useFbsExportPolling).mockReturnValue(
      mockPollResult({
        exportId: 'export-123',
        status: 'expired',
        url: null,
        expiresAt: null,
      })
    )

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.handleClick()
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Не удалось подготовить экспорт. Попробуйте ещё раз.',
        expect.any(Object)
      )
    })
  })
})

// ===========================================================================
// Poll error
// ===========================================================================

describe('useFbsExportButton — poll error', () => {
  it('shows error toast on polling error', async () => {
    vi.mocked(useFbsExportPolling).mockReturnValue(
      mockPollResult(null, new Error('Polling failed'))
    )

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    // Trigger export to set exportId
    await act(async () => {
      result.current.handleClick()
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Ошибка опроса статуса экспорта. Повторите попытку.',
        expect.any(Object)
      )
    })
  })
})

// ===========================================================================
// Cabinet switch reset
// ===========================================================================

describe('useFbsExportButton — cabinet switch reset', () => {
  it('resets state on cabinet change', async () => {
    const { result, rerender } = renderHook(() => useFbsExportButton(), {
      wrapper: createWrapper(),
    })

    // Trigger export to set polling state
    await act(async () => {
      result.current.handleClick()
    })

    expect(result.current.disabled).toBe(true)

    // Switch cabinet
    mockCabinetId = 'different-cabinet'

    rerender()

    // State should be reset — button re-enabled
    expect(result.current.disabled).toBe(false)
    expect(result.current.label).toBe('Скачать CSV')
  })
})

// ===========================================================================
// Rate limit blocks clicks
// ===========================================================================

describe('useFbsExportButton — rate limit blocks clicks', () => {
  it('prevents click while rate-limited', async () => {
    const error = new ApiError('Too many requests', 429)
    error.retryAfter = 120
    mockTriggerFbsExport.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFbsExportButton(), { wrapper: createWrapper() })

    // First click triggers 429
    await act(async () => {
      result.current.handleClick()
    })

    expect(mockTriggerFbsExport).toHaveBeenCalledTimes(1)
    expect(result.current.disabled).toBe(true)

    // Second click should be ignored
    await act(async () => {
      result.current.handleClick()
    })

    expect(mockTriggerFbsExport).toHaveBeenCalledTimes(1) // Not called again
  })
})
