'use client'

/**
 * ChatsSection — NEW-2 WB seller chats (read + gated send, PR2).
 *
 * Two-mode view: a thread list (no chatId selected) and a selected thread's
 * messages (chatId set) + ChatComposer. Owns its OWN loading/error/empty state
 * machine (AC4). unreadCount is a count (legit ?? 0); message text/preview are
 * nullable (AP#8). The send surface uses the thread's stored replySign.
 */

import { useState, useCallback } from 'react'
import { MessagesSquare, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useChats } from '@/hooks/useCommunications'
import { formatDate } from '@/lib/utils'
import { SectionState } from './SectionState'
import { ChatMessages } from './ChatMessages'
import { ChatComposer } from './ChatComposer'
import type { ChatsListResult, ChatThreadResult, WbChatThread } from '@/types/communications'

const CHATS_ERROR_MESSAGE = 'Не удалось загрузить чаты. Попробуйте ещё раз.'
const CHATS_EMPTY_MESSAGE = 'Нет чатов'
const THREAD_EMPTY_MESSAGE = 'В этой беседе пока нет сообщений'
const THREAD_NOT_FOUND_MESSAGE = 'Беседа не найдена'

export interface ChatsSectionProps {
  enabled?: boolean
}

/** GET /v1/communications/chats — thread list + drill-in to a single thread. */
export function ChatsSection({ enabled = true }: ChatsSectionProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined)
  const chats = useChats({ chatId: selectedChatId }, { enabled })

  const handleRetry = useCallback(() => chats.refetch(), [chats])
  const handleBack = useCallback(() => setSelectedChatId(undefined), [])

  const isThreadMode = selectedChatId !== undefined

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessagesSquare className="h-4 w-4" aria-hidden />
          Чаты
          {isThreadMode ? (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />К списку
            </Button>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isThreadMode ? (
          <ThreadBody
            data={chats.data}
            isLoading={chats.isLoading}
            isError={chats.isError}
            onRetry={handleRetry}
          />
        ) : (
          <ListBody
            data={chats.data}
            isLoading={chats.isLoading}
            isError={chats.isError}
            onRetry={handleRetry}
            onSelect={setSelectedChatId}
          />
        )}
      </CardContent>
    </Card>
  )
}

/** Thread-list body (no chatId). */
function ListBody({
  data,
  isLoading,
  isError,
  onRetry,
  onSelect,
}: {
  data: ChatsListResult | ChatThreadResult | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (chatId: string) => void
}) {
  const threads = isListResult(data) ? data.threads : []
  return (
    <SectionState
      isLoading={isLoading}
      isError={isError}
      isEmpty={threads.length === 0}
      errorMessage={CHATS_ERROR_MESSAGE}
      emptyMessage={CHATS_EMPTY_MESSAGE}
      onRetry={onRetry}
    >
      <ul className="divide-y divide-border">
        {threads.map(t => (
          <ChatThreadRow key={t.id} thread={t} onSelect={onSelect} />
        ))}
      </ul>
    </SectionState>
  )
}

/** Single-thread body (chatId set). */
function ThreadBody({
  data,
  isLoading,
  isError,
  onRetry,
}: {
  data: ChatsListResult | ChatThreadResult | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const thread = isThreadResult(data) ? data.thread : null
  const messages = isThreadResult(data) ? data.messages : []
  // chatId didn't resolve to a thread AND no messages → distinct "not found"
  // (vs the generic "no messages" empty state for a resolved-but-empty thread).
  // Guarded by !isLoading so the not-found branch never flashes while the
  // thread query is still resolving after a drill-in (data is briefly undefined).
  const threadNotFound = !isLoading && thread == null && messages.length === 0
  return (
    <SectionState
      isLoading={isLoading}
      isError={isError}
      isEmpty={messages.length === 0}
      errorMessage={CHATS_ERROR_MESSAGE}
      emptyMessage={threadNotFound ? THREAD_NOT_FOUND_MESSAGE : THREAD_EMPTY_MESSAGE}
      onRetry={onRetry}
    >
      <ChatMessages messages={messages} />
      {/* PR2: send surface — uses the thread's stored replySign (WB handshake). */}
      <ChatComposer replySign={thread?.replySign ?? null} />
    </SectionState>
  )
}

/** Render a thread row (preview + unread badge + last-updated date). */
function ChatThreadRow({
  thread,
  onSelect,
}: {
  thread: WbChatThread
  onSelect: (chatId: string) => void
}) {
  const unread = thread.unreadCount ?? 0
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(thread.chatId)}
        aria-label={`Открыть беседу ${thread.chatId}`}
        className="flex w-full items-center justify-between gap-2 rounded-md py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {thread.lastMessagePreview ?? 'Беседа без сообщения'}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {thread.updatedAt ? formatDate(thread.updatedAt) : '—'}
          </span>
        </span>
        {unread > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-medium text-white">
            {unread}
          </span>
        ) : null}
      </button>
    </li>
  )
}

/** Type guard: the threads-list branch. */
function isListResult(data: unknown): data is ChatsListResult {
  return !!data && typeof data === 'object' && 'threads' in data
}

/** Type guard: the thread+messages branch. */
function isThreadResult(data: unknown): data is ChatThreadResult {
  return !!data && typeof data === 'object' && 'messages' in data
}
