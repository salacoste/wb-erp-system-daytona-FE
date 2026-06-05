/**
 * FeedbackButtons component tests — Story 110.4-FE.
 * Covers: render, aria-labels, click → mutation, pending disable, success/error states,
 * stopPropagation, focus-visible ring class, auto-reset via fake timers.
 * 1st-pass review fixes (2026-05-19):
 *   F-3: pending test fires second click + asserts called-once.
 *   F-4: control baseline proves jsdom event propagation works.
 *   F-7: 403 error renders "Нет доступа"; other errors render generic message.
 *   F-9: success span has role="status"; getByRole('status') asserts it.
 * 2nd-pass review fixes (2026-05-19):
 *   F-3: replaced plain new Error(...) with new ApiError(..., 500) per anti-pattern #3 (two tests).
 *   F-4: added second-click-after-auto-reset test for state-machine re-fire.
 *   F-5: added vi.useRealTimers() defensive reset to beforeEach.
 *   F-8: added isPending Loader2 spinner test.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeedbackButtons } from '../FeedbackButtons'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import { ApiError } from '@/types/api'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')

const mockPostFeedback = vi.mocked(systemApi.postFeedback)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderButtons(props: { forecastId: string; modelId?: string } = { forecastId: 'fc-1' }) {
  return render(React.createElement(FeedbackButtons, props), { wrapper: createWrapper() })
}

describe('FeedbackButtons', () => {
  beforeEach(() => {
    vi.useRealTimers() // F-5: defensive reset — prevents cross-test fake-timer leaks
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-1' }))
    mockPostFeedback.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Render ───────────────────────────────────────────────────────────────────

  it('renders both thumb buttons in idle state', () => {
    renderButtons()
    expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Бесполезный прогноз' })).toBeTruthy()
  })

  it('aria-label "Полезный прогноз" on thumbs-up button', () => {
    renderButtons()
    const btn = screen.getByRole('button', { name: 'Полезный прогноз' })
    expect(btn).toHaveAttribute('aria-label', 'Полезный прогноз')
  })

  it('aria-label "Бесполезный прогноз" on thumbs-down button', () => {
    renderButtons()
    const btn = screen.getByRole('button', { name: 'Бесполезный прогноз' })
    expect(btn).toHaveAttribute('aria-label', 'Бесполезный прогноз')
  })

  it('title attribute matches aria-label on both buttons', () => {
    renderButtons()
    expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toHaveAttribute(
      'title',
      'Полезный прогноз'
    )
    expect(screen.getByRole('button', { name: 'Бесполезный прогноз' })).toHaveAttribute(
      'title',
      'Бесполезный прогноз'
    )
  })

  it('focus-visible:ring-2 class present on both buttons (WCAG 2.4.7)', () => {
    renderButtons()
    const up = screen.getByRole('button', { name: 'Полезный прогноз' })
    const down = screen.getByRole('button', { name: 'Бесполезный прогноз' })
    expect(up.className).toContain('focus-visible:ring-2')
    expect(down.className).toContain('focus-visible:ring-2')
  })

  // ── Click triggers mutation ───────────────────────────────────────────────────

  it('click thumbs-up calls postFeedback with feedbackType thumbs_up', async () => {
    renderButtons({ forecastId: 'fc-999' })
    fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    await waitFor(() => expect(mockPostFeedback).toHaveBeenCalledOnce())
    expect(mockPostFeedback).toHaveBeenCalledWith({
      forecastId: 'fc-999',
      feedbackType: 'thumbs_up',
    })
  })

  it('click thumbs-down calls postFeedback with feedbackType thumbs_down', async () => {
    renderButtons({ forecastId: 'fc-888' })
    fireEvent.click(screen.getByRole('button', { name: 'Бесполезный прогноз' }))
    await waitFor(() => expect(mockPostFeedback).toHaveBeenCalledOnce())
    expect(mockPostFeedback).toHaveBeenCalledWith({
      forecastId: 'fc-888',
      feedbackType: 'thumbs_down',
    })
  })

  // ── stopPropagation ───────────────────────────────────────────────────────────

  // F-4 control baseline: proves jsdom event propagation works before the stop-test.
  it('control: click on non-stopPropagating child DOES propagate to parent', () => {
    const parentClick = vi.fn()
    const { container } = render(
      React.createElement(
        'div',
        { onClick: parentClick },
        React.createElement('span', { 'data-testid': 'passthrough' }, 'text')
      )
    )
    fireEvent.click(container.querySelector('[data-testid="passthrough"]')!)
    expect(parentClick).toHaveBeenCalledOnce()
  })

  it('click does NOT propagate to parent onClick (stopPropagation)', () => {
    const parentClick = vi.fn()
    const { container } = render(
      React.createElement(
        'div',
        { onClick: parentClick },
        React.createElement(FeedbackButtons, { forecastId: 'fc-stop' })
      ),
      { wrapper: createWrapper() }
    )
    const up = container.querySelector('button[aria-label="Полезный прогноз"]')!
    fireEvent.click(up)
    expect(parentClick).not.toHaveBeenCalled()
  })

  // ── Pending state ─────────────────────────────────────────────────────────────

  // F-3: asserts disabled state AND that a second click does not fire the mutation again.
  it('both buttons disabled while mutation is pending; second click does not fire mutation', async () => {
    // Never resolves during test
    mockPostFeedback.mockReturnValue(new Promise(() => {}))

    renderButtons()
    const upButton = screen.getByRole('button', { name: 'Полезный прогноз' })
    fireEvent.click(upButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Бесполезный прогноз' })).toBeDisabled()
    })

    // Second click on now-disabled button — mutation must NOT be called again.
    fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    expect(mockPostFeedback).toHaveBeenCalledOnce()
  })

  // ── Success state ─────────────────────────────────────────────────────────────

  it('success state renders Check icon text and "Спасибо" (no buttons)', async () => {
    vi.useFakeTimers()
    renderButtons()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })

    await waitFor(() => expect(screen.getByText('Спасибо')).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'Полезный прогноз' })).toBeNull()
  })

  // F-9: success span has role="status" for screen-reader announcement.
  it('success state has role="status" aria-live="polite" for screen-reader announcement', async () => {
    vi.useFakeTimers()
    renderButtons()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })

    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())
    expect(screen.getByRole('status')).toHaveTextContent('Спасибо')
  })

  it('success state auto-resets to idle after 2s', async () => {
    vi.useFakeTimers()
    renderButtons()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })
    await waitFor(() => expect(screen.getByText('Спасибо')).toBeTruthy())

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toBeTruthy()
    )
    expect(screen.queryByText('Спасибо')).toBeNull()
  })

  // ── Error state ───────────────────────────────────────────────────────────────

  it('error state renders Alert with role="alert" and generic error text (non-403 ApiError)', async () => {
    vi.useFakeTimers()
    mockPostFeedback.mockRejectedValueOnce(new ApiError('Internal Server Error', 500))

    renderButtons()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Не удалось сохранить отзыв')).toBeTruthy()
  })

  it('error state auto-resets to idle after 5s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockPostFeedback.mockRejectedValueOnce(new ApiError('Internal Server Error', 500))

    renderButtons()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toBeTruthy()
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  // F-7: 403 errors render "Нет доступа" (Defensive Frontend Principle).
  it('403 error renders "Нет доступа"', async () => {
    vi.useFakeTimers()
    mockPostFeedback.mockRejectedValueOnce(new ApiError('Forbidden', 403))

    renderButtons()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Нет доступа')).toBeTruthy()
  })

  // F-7: non-403 API errors render generic message.
  it('non-403 API error (e.g. 500) renders "Не удалось сохранить отзыв"', async () => {
    vi.useFakeTimers()
    mockPostFeedback.mockRejectedValueOnce(new ApiError('Internal Server Error', 500))

    renderButtons()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Не удалось сохранить отзыв')).toBeTruthy()
  })

  // F-4 (2nd-pass): second successful click after auto-reset shows 'Спасибо' again.
  // Verifies the useEffect state machine re-fires on subsequent mutations.
  it('shows success indicator on second click after auto-reset', async () => {
    vi.useFakeTimers()
    mockPostFeedback.mockResolvedValue(undefined)

    renderButtons()

    // First click → success
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())

    // Auto-reset after 2s
    act(() => {
      vi.advanceTimersByTime(2001)
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Полезный прогноз' })).toBeTruthy()
    )
    expect(screen.queryByRole('status')).toBeNull()

    // Second click → success indicator must appear again
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))
    })
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy())
    expect(screen.getByRole('status')).toHaveTextContent('Спасибо')
  })

  // F-8 (2nd-pass): Loader2 spinner visible during isPending state.
  it('renders pending spinner (Loader2) while mutation is in flight', async () => {
    // Never resolves — keeps isPending true
    mockPostFeedback.mockReturnValue(new Promise(() => {}))

    renderButtons()
    fireEvent.click(screen.getByRole('button', { name: 'Полезный прогноз' }))

    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeTruthy())
  })
})
