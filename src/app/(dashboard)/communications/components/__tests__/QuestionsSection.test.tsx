/**
 * QuestionsSection tests — NEW-2 (independent states, AC4).
 *
 * Mocks useQuestions and verifies: loading skeleton, populated (text + nmId as
 * String, AP#10), empty, and error + retry. Also locks the three-state
 * AnswerStatus behavior (Defensive FE: no fabricated "Отвечено" from answer text).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { QuestionsSection } from '../QuestionsSection'
import { useQuestions } from '@/hooks/useCommunications'
import type { QuestionsResult } from '@/types/communications'

vi.mock('@/hooks/useCommunications', () => ({
  useQuestions: vi.fn(),
}))

// PR2: the row now renders a gated answer surface (QuestionWriteControls).
// Pass-2: WRITEBACK_TIMEOUT_* re-exported so WritebackStatus's import resolves.
vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  useAnswerQuestion: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
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

const useQuestionsMock = useQuestions as unknown as ReturnType<typeof vi.fn>

function mockResult(
  result: Partial<{
    data: QuestionsResult | undefined
    isLoading: boolean
    isError: boolean
    refetch: ReturnType<typeof vi.fn>
  }>
) {
  useQuestionsMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...result,
  })
}

describe('QuestionsSection — independent states (AC4)', () => {
  beforeEach(() => {
    useQuestionsMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a scoped skeleton while loading', () => {
    mockResult({ isLoading: true })
    const { container } = render(<QuestionsSection />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders populated questions with text + nmId as String (AP#10)', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'q-1',
            cabinetId: 'c',
            questionId: '2001',
            nmId: 12345678,
            text: 'Есть ли другие цвета?',
            answer: null,
            status: '0',
            isAnswered: false,
            createdAt: '2026-08-01T11:00:00Z',
            updatedAt: '2026-08-01T11:00:00Z',
          },
        ],
        total: 1,
      },
    })
    render(<QuestionsSection />)
    expect(screen.getByText('Есть ли другие цвета?')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('Без ответа')).toBeInTheDocument()
  })

  it('renders "Статус неизвестен" when isAnswered is null (never fabricates answered)', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'q-2',
            cabinetId: 'c',
            questionId: '2002',
            nmId: null,
            // Non-empty answer but isAnswered=null → neutral, never "Отвечено".
            text: 'Вопрос',
            answer: 'Спасибо',
            status: null,
            isAnswered: null,
            createdAt: null,
            updatedAt: '2026-08-02T11:00:00Z',
          },
        ],
        total: 1,
      },
    })
    render(<QuestionsSection />)
    expect(screen.getByText('Статус неизвестен')).toBeInTheDocument()
    expect(screen.queryByText('Отвечено')).not.toBeInTheDocument()
  })

  it('renders "Отвечено" only when isAnswered === true', () => {
    mockResult({
      data: {
        rows: [
          {
            id: 'q-3',
            cabinetId: 'c',
            questionId: '2003',
            nmId: 1,
            text: 'ok',
            answer: 'Да',
            status: '1',
            isAnswered: true,
            createdAt: '2026-08-03T11:00:00Z',
            updatedAt: '2026-08-03T11:00:00Z',
          },
        ],
        total: 1,
      },
    })
    render(<QuestionsSection />)
    expect(screen.getByText('Отвечено')).toBeInTheDocument()
  })

  it('renders the empty state when there are no rows', () => {
    mockResult({ data: { rows: [], total: 0 } })
    render(<QuestionsSection />)
    expect(screen.getByText('Нет вопросов')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU canonical string)', () => {
    mockResult({ isError: true })
    render(<QuestionsSection />)
    expect(
      screen.getByText('Не удалось загрузить вопросы. Попробуйте ещё раз.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('retry button invokes refetch', () => {
    const refetch = vi.fn()
    mockResult({ isError: true, refetch })
    render(<QuestionsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
