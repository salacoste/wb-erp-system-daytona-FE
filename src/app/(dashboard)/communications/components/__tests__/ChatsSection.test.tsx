/**
 * ChatsSection tests — NEW-2 (independent states, AC4, BOTH modes).
 *
 * Mocks useChats and exercises the discriminated union: list mode (no chatId)
 * and thread mode (chatId set). Covers loading/error/empty/populated for each,
 * the distinct "Беседа не найдена" thread-null message, and the thread-row
 * a11y (aria-label identifies the chat).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ChatsSection } from '../ChatsSection'
import { useChats } from '@/hooks/useCommunications'
import type {
  ChatsListResult,
  ChatThreadResult,
  WbChatThread,
  WbChatMessage,
} from '@/types/communications'

vi.mock('@/hooks/useCommunications', () => ({
  useChats: vi.fn(),
}))

// PR2: thread mode now renders a ChatComposer (gated send surface).
// Pass-2: WRITEBACK_TIMEOUT_* re-exported so WritebackStatus's import resolves.
vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  useSendChatMessage: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
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

const useChatsMock = useChats as unknown as ReturnType<typeof vi.fn>

const THREAD: WbChatThread = {
  id: 't-1',
  cabinetId: 'c',
  chatId: 'chat-1',
  replySign: null,
  lastMessagePreview: 'Здравствуйте!',
  unreadCount: 3,
  updatedAt: '2026-08-01T12:00:00Z',
  createdAt: '2026-08-01T11:30:00Z',
}

const MESSAGE: WbChatMessage = {
  id: 'm-1',
  cabinetId: 'c',
  chatId: 'chat-1',
  messageId: 'msg-1',
  text: 'Здравствуйте!',
  direction: 'client',
  createdAt: '2026-08-01T12:00:00Z',
  updatedAt: '2026-08-01T12:00:00Z',
}

type MockArgs = {
  /** Shape returned in list mode (chatId falsy). Omit to leave data undefined. */
  list?: ChatsListResult
  /** Shape returned in thread mode (chatId truthy). Omit to leave data undefined. */
  thread?: ChatThreadResult
  isLoading?: boolean
  /** Loading flag for the thread branch only (list stays not-loading). */
  threadLoading?: boolean
  isError?: boolean
  refetch?: ReturnType<typeof vi.fn>
}

function mockChats(args: MockArgs = {}) {
  useChatsMock.mockImplementation((query: { chatId?: string } = {}) => {
    // Discriminate by the requested branch so list vs thread rendering matches.
    const isThread = !!query.chatId
    const data = isThread ? args.thread : args.list
    const branchLoading = isThread
      ? (args.threadLoading ?? args.isLoading ?? false)
      : (args.isLoading ?? false)
    return {
      data,
      isLoading: branchLoading,
      isError: args.isError ?? false,
      refetch: args.refetch ?? vi.fn(),
    }
  })
}

describe('ChatsSection — list mode (no chatId)', () => {
  beforeEach(() => {
    useChatsMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a scoped skeleton while loading', () => {
    mockChats({ isLoading: true })
    const { container } = render(<ChatsSection />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders populated threads with preview + unread count + a11y label', () => {
    mockChats({ list: { threads: [THREAD] } })
    render(<ChatsSection />)
    expect(screen.getByText('Здравствуйте!')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    // Thread button exposes its chat identity to screen readers.
    expect(screen.getByRole('button', { name: 'Открыть беседу chat-1' })).toBeInTheDocument()
  })

  it('renders the empty state when there are no threads', () => {
    mockChats({ list: { threads: [] } })
    render(<ChatsSection />)
    expect(screen.getByText('Нет чатов')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU canonical string)', () => {
    mockChats({ isError: true })
    render(<ChatsSection />)
    expect(screen.getByText('Не удалось загрузить чаты. Попробуйте ещё раз.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('retry button invokes refetch', () => {
    const refetch = vi.fn()
    mockChats({ isError: true, refetch })
    render(<ChatsSection />)
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})

describe('ChatsSection — thread mode (chatId selected)', () => {
  beforeEach(() => {
    useChatsMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the thread messages after selecting a chat', () => {
    mockChats({ list: { threads: [THREAD] }, thread: { thread: THREAD, messages: [MESSAGE] } })
    render(<ChatsSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Открыть беседу chat-1' }))
    expect(screen.getByText('Здравствуйте!', { exact: true })).toBeInTheDocument()
  })

  it('renders the generic empty state for a resolved-but-empty thread', () => {
    mockChats({ list: { threads: [THREAD] }, thread: { thread: THREAD, messages: [] } })
    render(<ChatsSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Открыть беседу chat-1' }))
    expect(screen.getByText('В этой беседе пока нет сообщений')).toBeInTheDocument()
  })

  it('renders "Беседа не найдена" when the chatId did not resolve (thread null)', () => {
    mockChats({ list: { threads: [THREAD] }, thread: { thread: null, messages: [] } })
    render(<ChatsSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Открыть беседу chat-1' }))
    expect(screen.getByText('Беседа не найдена')).toBeInTheDocument()
  })

  it('does NOT flash "Беседа не найдена" while the thread query is loading', () => {
    // Transition window: the list loaded (button is clickable), the user drills
    // in, and the new thread query key is loading with data briefly undefined.
    // The not-found branch must stay suppressed until loading resolves
    // (isLoading guard on threadNotFound). threadLoading isolates the loading
    // flag to the thread branch so the list still renders its rows.
    mockChats({ list: { threads: [THREAD] }, thread: undefined, threadLoading: true })
    render(<ChatsSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Открыть беседу chat-1' }))
    // Loading skeleton wins (SectionState loading branch), not-found does not.
    expect(screen.queryByText('Беседа не найдена')).not.toBeInTheDocument()
  })
})
