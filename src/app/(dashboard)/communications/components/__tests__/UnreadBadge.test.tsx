/**
 * UnreadBadge tests — NEW-2 (independent query, AC4).
 *
 * Mocks useUnreadBadge and verifies: loading → nothing, error → nothing (never a
 * false "all read" signal), no-unread → nothing, has-unread → red dot.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { UnreadBadge } from '../UnreadBadge'
import { useUnreadBadge } from '@/hooks/useCommunications'
import type { UnreadBadge as UnreadBadgeData } from '@/types/communications'

vi.mock('@/hooks/useCommunications', () => ({
  useUnreadBadge: vi.fn(),
}))

const useUnreadBadgeMock = useUnreadBadge as unknown as ReturnType<typeof vi.fn>

function mockResult(
  result: Partial<{
    data: UnreadBadgeData | undefined
    isLoading: boolean
    isError: boolean
  }>
) {
  useUnreadBadgeMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...result,
  })
}

describe('UnreadBadge — independent query (AC4)', () => {
  beforeEach(() => {
    useUnreadBadgeMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders nothing while loading', () => {
    mockResult({ isLoading: true })
    render(<UnreadBadge />)
    expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument()
  })

  it('renders nothing on error (never a false all-read signal)', () => {
    mockResult({ isError: true })
    render(<UnreadBadge />)
    expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument()
  })

  it('renders nothing when there are no unread items', () => {
    mockResult({ data: { hasNewFeedbacks: false, hasNewQuestions: false } })
    render(<UnreadBadge />)
    expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument()
  })

  it('renders the red dot when feedbacks or questions are unread', () => {
    mockResult({ data: { hasNewFeedbacks: true, hasNewQuestions: false } })
    render(<UnreadBadge />)
    expect(screen.getByTestId('unread-dot')).toBeInTheDocument()
  })
})
