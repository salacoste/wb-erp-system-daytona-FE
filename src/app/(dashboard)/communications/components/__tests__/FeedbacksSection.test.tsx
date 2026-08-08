/**
 * FeedbacksSection tests — NEW-2 (independent states, AC4).
 *
 * Mocks useFeedbacks and verifies: loading skeleton, populated (rating stars +
 * nmId rendered with String, AP#8 null rating → '—'), empty, and error + retry.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { FeedbacksSection } from '../FeedbacksSection'
import { useFeedbacks } from '@/hooks/useCommunications'
import type { FeedbacksResult } from '@/types/communications'

vi.mock('@/hooks/useCommunications', () => ({
  useFeedbacks: vi.fn(),
}))

// PR2: the row now renders a gated write surface (FeedbackWriteControls). Mock
// its write hooks + the coordinator so the read-only assertions stay focused.
// Pass-2: WRITEBACK_TIMEOUT_* re-exported so WritebackStatus's import resolves.
vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  useReplyFeedback: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useUpdateFeedbackReply: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
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

const useFeedbacksMock = useFeedbacks as unknown as ReturnType<typeof vi.fn>

function mockResult(
  result: Partial<{
    data: FeedbacksResult | undefined
    isLoading: boolean
    isError: boolean
    refetch: ReturnType<typeof vi.fn>
  }>
) {
  useFeedbacksMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...result,
  })
}

describe('FeedbacksSection — independent states (AC4)', () => {
  beforeEach(() => {
    useFeedbacksMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a scoped skeleton while loading', () => {
    mockResult({ isLoading: true })
    const { container } = render(<FeedbacksSection />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders populated feedbacks with rating stars + nmId as String (AP#10)', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'fb-1',
            cabinetId: 'c',
            feedbackId: '1001',
            nmId: 12345678,
            productId: null,
            rating: 5,
            text: 'Отличный товар',
            answer: null,
            isAnswered: false,
            createdAt: '2026-08-01T10:00:00Z',
            updatedAt: '2026-08-01T10:00:00Z',
          },
        ],
        total: 1,
        unansweredCount: 1,
      },
    })
    render(<FeedbacksSection />)
    expect(screen.getByText('Отличный товар')).toBeInTheDocument()
    // nmId rendered with String (AP#10) — not locale-grouped.
    expect(screen.getByText('12345678')).toBeInTheDocument()
    // 5 stars filled.
    expect(screen.getByLabelText('Оценка 5 из 5')).toBeInTheDocument()
    // Counts rendered — filtered label ("Всего без ответа", not misleading "Всего").
    expect(screen.getByTestId('feedbacks-count')).toHaveTextContent('Всего без ответа: 1')
  })

  it('renders "—" for a null rating (AP#8 — never 0 stars)', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'fb-2',
            cabinetId: 'c',
            feedbackId: '1002',
            nmId: null,
            productId: null,
            rating: null,
            text: null,
            answer: null,
            isAnswered: null,
            createdAt: null,
            updatedAt: '2026-08-02T10:00:00Z',
          },
        ],
        total: 1,
        unansweredCount: 1,
      },
    })
    render(<FeedbacksSection />)
    // null rating → '—' (the SectionState populated branch renders the row).
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    // nmId null → '—' (not "NaN" or "0").
    expect(screen.queryByText('NaN')).not.toBeInTheDocument()
    // null isAnswered → neutral status (Defensive FE: no green "Отвечено" chip).
    expect(screen.getByText('Статус неизвестен')).toBeInTheDocument()
    expect(screen.queryByText('Отвечено')).not.toBeInTheDocument()
  })

  it('renders "Без ответа" only when isAnswered === false (never from answer text)', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'fb-3',
            cabinetId: 'c',
            feedbackId: '1003',
            nmId: 1,
            productId: null,
            rating: 4,
            text: 'ok',
            // Non-empty answer but isAnswered=false → must NOT show "Отвечено".
            answer: 'Заранее спасибо',
            isAnswered: false,
            createdAt: '2026-08-03T10:00:00Z',
            updatedAt: '2026-08-03T10:00:00Z',
          },
        ],
        total: 1,
        unansweredCount: 1,
      },
    })
    render(<FeedbacksSection />)
    expect(screen.getByText('Без ответа')).toBeInTheDocument()
    expect(screen.queryByText('Отвечено')).not.toBeInTheDocument()
  })

  it('renders "Отвечено" only when isAnswered === true', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'fb-4',
            cabinetId: 'c',
            feedbackId: '1004',
            nmId: 1,
            productId: null,
            rating: 5,
            text: 'great',
            answer: 'Спасибо за отзыв',
            isAnswered: true,
            createdAt: '2026-08-04T10:00:00Z',
            updatedAt: '2026-08-04T10:00:00Z',
          },
        ],
        total: 1,
        unansweredCount: 0,
      },
    })
    render(<FeedbacksSection />)
    expect(screen.getByText('Отвечено')).toBeInTheDocument()
  })

  it('renders the empty state when there are no rows', () => {
    mockResult({ data: { rows: [], total: 0, unansweredCount: 0 } })
    render(<FeedbacksSection />)
    expect(screen.getByText('Нет отзывов')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU canonical string)', () => {
    mockResult({ isError: true })
    render(<FeedbacksSection />)
    expect(screen.getByText('Не удалось загрузить отзывы. Попробуйте ещё раз.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('retry button invokes refetch', () => {
    const refetch = vi.fn()
    mockResult({ isError: true, refetch })
    render(<FeedbacksSection />)
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
