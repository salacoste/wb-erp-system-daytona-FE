/**
 * FbsExportButton — Unit Tests — Story 96.12-FE
 *
 * Covers:
 *   - button renders with "Скачать CSV" label and enabled by default
 *   - click triggers triggerFbsExport() API call
 *   - 429 response → countdown UI ticks down → button re-enables at 0
 *   - polling success (ready) → download anchor uses statusData.url (signed S3 URL)
 *   - polling ready → download anchor has rel="noopener noreferrer" (M2-1)
 *   - polling ready with null url → defensive-frontend error (H-2 fix)
 *   - polling failed/expired → error toast + button re-enables
 *   - cleanup: setInterval cleared on unmount (no leak)
 *   - retry-after-error cycle: each new exportId gets its own error toast (H2-1)
 *   - cabinet switch → polling state reset, button re-enabled (M2-2)
 *
 * Uses vi.useFakeTimers() for deterministic countdown tests.
 * Mocks sonner and polling hook to keep tests fast + focused.
 *
 * H-1+H-2 fix verified: "ready → download" test asserts link.href === statusData.url
 * (signed S3 URL), NOT a relative /v1/... path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ApiError } from '@/types/api'
import {
  readyFbsExportStatus,
  failedFbsExportStatus,
  expiredFbsExportStatus,
  pendingFbsExportTriggerResponse,
} from '@/test/fixtures/fbs-export-empty'

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports)
// ---------------------------------------------------------------------------

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => 'mock-toast-id'),
    dismiss: vi.fn(),
  },
}))

vi.mock('@/lib/api/fbs-export', () => ({
  triggerFbsExport: vi.fn(),
  // getFbsExportDownloadUrl is @deprecated — not imported by FbsExportButton (H-2 fix).
  fbsExportQueryKeys: {
    status: (cabinetId: string | null, params: { exportId: string }) => [
      'fbs-export',
      cabinetId,
      'status',
      params,
    ],
  },
}))

vi.mock('@/hooks/use-fbs-export-polling', () => ({
  useFbsExportPolling: vi.fn(() => ({ data: undefined, error: null })),
}))

// M2-2: mutable cabinetId so tests can simulate cabinet switches.
let mockCabinetId = 'test-cabinet'
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string }) => unknown) =>
    selector({ cabinetId: mockCabinetId }),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { FbsExportButton } from '../FbsExportButton'
import * as fbsExportApi from '@/lib/api/fbs-export'
import * as pollingHook from '@/hooks/use-fbs-export-polling'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderButton() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(createElement(QueryClientProvider, { client }, createElement(FbsExportButton)))
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mockCabinetId = 'test-cabinet' // M2-2: reset to default cabinet before each test
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FbsExportButton', () => {
  it('renders with "Скачать CSV" label and enabled by default', () => {
    renderButton()
    const btn = screen.getByTestId('fbs-export-button')
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
    expect(btn).toHaveTextContent(/Скачать CSV/)
  })

  it('click triggers triggerFbsExport and shows loading toast', async () => {
    vi.mocked(fbsExportApi.triggerFbsExport).mockResolvedValueOnce(
      pendingFbsExportTriggerResponse()
    )
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByTestId('fbs-export-button'))

    await waitFor(() => {
      expect(fbsExportApi.triggerFbsExport).toHaveBeenCalledTimes(1)
      expect(toast.loading).toHaveBeenCalledWith('Подготовка экспорта...', expect.anything())
    })
  })

  it('button disabled while polling (label changes to "Подготовка...")', async () => {
    vi.mocked(fbsExportApi.triggerFbsExport).mockResolvedValueOnce(
      pendingFbsExportTriggerResponse()
    )
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByTestId('fbs-export-button'))

    await waitFor(() => {
      const btn = screen.getByTestId('fbs-export-button')
      expect(btn).toBeDisabled()
      expect(btn).toHaveTextContent(/Подготовка\.\.\./)
    })
  })

  it('429 response → countdown label shows, button disabled during countdown', async () => {
    vi.useFakeTimers()
    const rateLimitError = new ApiError('Too Many Requests', 429)
    rateLimitError.retryAfter = 5
    vi.mocked(fbsExportApi.triggerFbsExport).mockRejectedValueOnce(rateLimitError)

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    renderButton()

    await user.click(screen.getByTestId('fbs-export-button'))

    await waitFor(() => {
      const btn = screen.getByTestId('fbs-export-button')
      expect(btn).toBeDisabled()
      expect(btn.textContent).toMatch(/Доступно через/)
    })

    // Advance 5 seconds → countdown reaches 0 → button re-enables
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })

    await waitFor(() => {
      const btn = screen.getByTestId('fbs-export-button')
      expect(btn).not.toBeDisabled()
      expect(btn).toHaveTextContent(/Скачать CSV/)
    })
  })

  it('polling ready → download anchor uses signed S3 URL from statusData.url (H-1+H-2 fix)', async () => {
    const readyStatus = readyFbsExportStatus()
    // readyFbsExportStatus().url === 'https://example.com/signed-url/fbs-export.csv'
    vi.mocked(pollingHook.useFbsExportPolling).mockReturnValue({
      data: readyStatus,
      error: null,
    } as ReturnType<typeof pollingHook.useFbsExportPolling>)

    const appendedLinks: HTMLAnchorElement[] = []
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
      if (node instanceof HTMLAnchorElement) appendedLinks.push(node)
      return node
    })
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(node => node)

    renderButton()

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/Экспорт готов/),
        expect.anything()
      )
    })

    // download anchor was appended + removed
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()

    // H-1+H-2: href must be the signed S3 URL, NOT a relative /v1/... path
    expect(appendedLinks).toHaveLength(1)
    expect(appendedLinks[0].href).toBe(readyStatus.url)

    // M2-1: signed S3 URL contains query-string credentials (X-Amz-Signature etc.);
    // noreferrer prevents them leaking via Referer header to third-party sites.
    expect(appendedLinks[0].rel).toBe('noopener noreferrer')

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('polling ready with null url → defensive-frontend error shown, no anchor created (H-2 fix)', async () => {
    // Simulate backend returning status=ready but url=null (should not happen per contract,
    // but Defensive Frontend Principle requires honest error surface, not silent fail).
    vi.mocked(pollingHook.useFbsExportPolling).mockReturnValue({
      data: { exportId: 'test-export-id', status: 'ready', url: null, expiresAt: null },
      error: null,
    } as ReturnType<typeof pollingHook.useFbsExportPolling>)

    // Track anchor elements appended — render() itself calls appendChild for the component
    // root div, so we filter to only <a> elements to detect download anchors specifically.
    const appendedAnchors: HTMLAnchorElement[] = []
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
      if (node instanceof HTMLAnchorElement) appendedAnchors.push(node)
      return node
    })

    renderButton()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/ссылка для скачивания отсутствует/),
        expect.anything()
      )
    })

    // No download anchor created — error branch, not download branch
    expect(appendedAnchors).toHaveLength(0)

    appendSpy.mockRestore()
  })

  it('polling failed → error toast shown', async () => {
    vi.mocked(pollingHook.useFbsExportPolling).mockReturnValue({
      data: failedFbsExportStatus(),
      error: null,
    } as ReturnType<typeof pollingHook.useFbsExportPolling>)

    renderButton()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/Не удалось подготовить экспорт/),
        expect.anything()
      )
    })
  })

  it('polling expired → error toast shown', async () => {
    vi.mocked(pollingHook.useFbsExportPolling).mockReturnValue({
      data: expiredFbsExportStatus(),
      error: null,
    } as ReturnType<typeof pollingHook.useFbsExportPolling>)

    renderButton()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/Не удалось подготовить экспорт/),
        expect.anything()
      )
    })
  })

  it('H2-1: retry-after-error cycle — second exportId gets its own error toast (not suppressed)', async () => {
    // Cycle 1: exportId-A starts, poll-error fires → toast count 1, exportId cleared.
    // Cycle 2: exportId-B starts, poll-error fires → toast count 2 (errorShownRef was reset).
    // Without H2-1 fix, errorShownRef.current would still equal exportId-A after reset,
    // so the new exportId-B would NOT match it — but the ref is reset to null on terminal
    // states, so it correctly allows the new cycle's error toast to fire.

    // Polling hook will return an error whenever exportId is set
    vi.mocked(pollingHook.useFbsExportPolling).mockImplementation(
      exportId =>
        ({
          data: undefined,
          error: exportId ? new Error(`poll error for ${exportId}`) : null,
        }) as ReturnType<typeof pollingHook.useFbsExportPolling>
    )

    vi.mocked(fbsExportApi.triggerFbsExport)
      .mockResolvedValueOnce({ exportId: 'export-id-A', status: 'queued' })
      .mockResolvedValueOnce({ exportId: 'export-id-B', status: 'queued' })

    const user = userEvent.setup()
    renderButton()

    // Cycle 1: click → poll error for exportId-A
    await user.click(screen.getByTestId('fbs-export-button'))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1)
    })

    // After error the poll-error effect clears exportId (button re-enables).
    // Cycle 2: click again → poll error for exportId-B
    await user.click(screen.getByTestId('fbs-export-button'))
    await waitFor(() => {
      // errorShownRef was reset in handleClick, so exportId-B error is NOT suppressed.
      expect(toast.error).toHaveBeenCalledTimes(2)
    })
  })

  it('M2-2: cabinet switch resets rate-limit countdown and re-enables button', async () => {
    // Use rate-limit state (not polling) as the durable "button disabled" condition,
    // since polling hook mock clears exportId instantly via poll-error effect.
    // A cabinet switch must clear all local state including rateLimitSeconds.
    vi.useFakeTimers()

    const rateLimitError = new ApiError('Too Many Requests', 429)
    rateLimitError.retryAfter = 120 // long enough to still be active after rerender
    vi.mocked(fbsExportApi.triggerFbsExport).mockRejectedValueOnce(rateLimitError)
    // Polling hook returns no error for this test
    vi.mocked(pollingHook.useFbsExportPolling).mockReturnValue({
      data: undefined,
      error: null,
    } as ReturnType<typeof pollingHook.useFbsExportPolling>)

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    const { rerender } = render(
      createElement(QueryClientProvider, { client }, createElement(FbsExportButton))
    )

    await user.click(screen.getByTestId('fbs-export-button'))

    await waitFor(() => {
      // Rate-limited → button disabled with countdown label
      expect(screen.getByTestId('fbs-export-button')).toBeDisabled()
    })

    // Simulate cabinet switch: update mockCabinetId + rerender so useEffect([cabinetId])
    // fires and resets all state including rateLimitSeconds → button re-enables.
    mockCabinetId = 'cabinet-B'
    rerender(createElement(QueryClientProvider, { client }, createElement(FbsExportButton)))

    await waitFor(() => {
      const btn = screen.getByTestId('fbs-export-button')
      expect(btn).not.toBeDisabled()
      expect(btn).toHaveTextContent(/Скачать CSV/)
    })
  })

  it('cleanup: setInterval cleared on unmount (no memory leak)', async () => {
    vi.useFakeTimers()
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')

    const rateLimitError = new ApiError('Too Many Requests', 429)
    rateLimitError.retryAfter = 60
    vi.mocked(fbsExportApi.triggerFbsExport).mockRejectedValueOnce(rateLimitError)

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    const { unmount } = renderButton()

    await user.click(screen.getByTestId('fbs-export-button'))

    // Wait for countdown to actually start before unmounting
    await waitFor(() => {
      expect(screen.getByTestId('fbs-export-button')).toBeDisabled()
    })

    // Countdown started — now unmount
    unmount()

    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})
