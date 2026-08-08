/**
 * PinnedReviewsSection tests — NEW-2 (independent states, AC4).
 *
 * Mocks usePinnedFeedbacks and verifies: loading skeleton, populated (live SDK
 * `data` envelope — state badge, pinOn LOCATION label, changeStateAt via
 * formatDate, pinMethod, nmId as String AP#10, nullable fields AP#8 → '—'),
 * the unpinned variant (state:'unpinned' + unpinnedCause note), empty, and
 * error + retry. The envelope-preservation contract itself is locked in
 * useCommunications.test.ts (the hook test).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { PinnedReviewsSection } from '../PinnedReviewsSection'
import { usePinnedFeedbacks } from '@/hooks/useCommunications'
import type { PinnedReviewsResult } from '@/types/communications'

vi.mock('@/hooks/useCommunications', () => ({
  usePinnedFeedbacks: vi.fn(),
}))

// PR2: each row now renders a gated pin/unpin surface (PinnedWriteControls).
// Pass-2: WRITEBACK_TIMEOUT_* re-exported so WritebackStatus's import resolves.
vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  usePinFeedback: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useUnpinFeedback: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  WRITEBACK_TIMEOUT_MESSAGE: 'Не удалось проверить статус отправки. Попробуйте ещё раз',
  WRITEBACK_TIMEOUT_STATUS: 'timeout',
}))
vi.mock('@/hooks/useWritebackJob', () => ({
  useWritebackJob: () => ({
    jobId: null,
    status: undefined,
    effectiveStatus: undefined,
    error: null,
    isTerminal: false,
    pollError: false,
    setJobId: vi.fn(),
    setActionKind: vi.fn(),
  }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

const usePinnedMock = usePinnedFeedbacks as unknown as ReturnType<typeof vi.fn>

function mockResult(
  result: Partial<{
    data: PinnedReviewsResult | undefined
    isLoading: boolean
    isError: boolean
    refetch: ReturnType<typeof vi.fn>
  }>
) {
  usePinnedMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...result,
  })
}

describe('PinnedReviewsSection — independent states (AC4)', () => {
  beforeEach(() => {
    usePinnedMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a scoped skeleton while loading', () => {
    mockResult({ isLoading: true })
    const { container } = render(<PinnedReviewsSection />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders a pinned review (state badge, location, method, nmId, date)', () => {
    mockResult({
      data: {
        data: [
          {
            feedbackId: 'fb-1',
            state: 'pinned',
            pinOn: 'nm',
            pinMethod: 'subscription',
            changeStateAt: '2026-07-01T10:00:00Z',
            nmId: 12345678,
            imtId: 99,
            pinId: 5,
            unpinnedCause: null,
          },
        ],
        next: 2,
      },
    })
    render(<PinnedReviewsSection />)
    // feedbackId rendered via String() (AP#10).
    expect(screen.getByText('fb-1')).toBeInTheDocument()
    // state badge (pinned).
    expect(screen.getByText('Закреплён')).toBeInTheDocument()
    // pinOn LOCATION (nm → product card), NOT a date.
    expect(screen.getByText('Карточка товара')).toBeInTheDocument()
    // pinMethod label.
    expect(screen.getByText('Подписка Джем')).toBeInTheDocument()
    // nmId via String() (AP#10).
    expect(screen.getByText('12345678')).toBeInTheDocument()
    // changeStateAt via formatDate (the actual date).
    expect(screen.getByText('01.07.2026')).toBeInTheDocument()
  })

  it('renders the unpinned variant (state badge + unpinnedCause note)', () => {
    mockResult({
      data: {
        data: [
          {
            feedbackId: 'fb-2',
            state: 'unpinned',
            pinOn: 'imt',
            pinMethod: 'tariff',
            changeStateAt: '2026-07-02T10:00:00Z',
            nmId: 12345678,
            imtId: 99,
            pinId: 6,
            unpinnedCause: 'sysLimitReached',
          },
        ],
        next: null,
      },
    })
    render(<PinnedReviewsSection />)
    expect(screen.getByText('Откреплён')).toBeInTheDocument()
    // pinOn LOCATION (imt → merged-card group).
    expect(screen.getByText('Группа карточек')).toBeInTheDocument()
    expect(screen.getByText('Тариф')).toBeInTheDocument()
    // unpinnedCause rendered as a RU note.
    expect(screen.getByText(/Достигнут лимит закреплений/)).toBeInTheDocument()
  })

  it('renders "—" / neutral labels for nullable pinned fields (AP#8)', () => {
    mockResult({
      data: {
        data: [
          {
            feedbackId: null,
            state: null,
            pinOn: null,
            pinMethod: null,
            changeStateAt: null,
            nmId: null,
            imtId: null,
            pinId: null,
            unpinnedCause: null,
          },
        ],
        next: null,
      },
    })
    render(<PinnedReviewsSection />)
    // null feedbackId → '—'.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    // null pinOn → "Место неизвестно" (NOT a formatted date).
    expect(screen.getByText('Место неизвестно')).toBeInTheDocument()
    // null state → neutral "Статус неизвестен".
    expect(screen.getByText('Статус неизвестен')).toBeInTheDocument()
    // null changeStateAt → "Дата неизвестна".
    expect(screen.getByText('Дата неизвестна')).toBeInTheDocument()
  })

  it('renders the empty state when there are no pinned reviews', () => {
    mockResult({ data: { data: [], next: null } })
    render(<PinnedReviewsSection />)
    expect(screen.getByText('Нет закреплённых отзывов')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU canonical string)', () => {
    mockResult({ isError: true })
    render(<PinnedReviewsSection />)
    expect(
      screen.getByText('Не удалось загрузить закреплённые отзывы. Попробуйте ещё раз.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('retry button invokes refetch', () => {
    const refetch = vi.fn()
    mockResult({ isError: true, refetch })
    render(<PinnedReviewsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
