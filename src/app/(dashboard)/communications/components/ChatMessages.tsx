'use client'

/**
 * ChatMessages — NEW-2 chat thread message list (read-only PR1).
 *
 * Extracted from ChatsSection for file-size compliance. Renders each message
 * with its direction (client/seller/wb) and timestamp. text is nullable (AP#8:
 * null → muted placeholder). No send control (PR2 write-side).
 */

import { formatDate } from '@/lib/utils'
import type { WbChatMessage } from '@/types/communications'

export interface ChatMessagesProps {
  messages: WbChatMessage[]
}

/** Render the message list (newest last, per WB ordering). */
export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <ul className="space-y-2">
      {messages.map(m => (
        <MessageRow key={m.id} message={m} />
      ))}
    </ul>
  )
}

/** Render a single message with direction-aware alignment + label. */
function MessageRow({ message }: { message: WbChatMessage }) {
  const isSeller = message.direction === 'seller'
  return (
    <li className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isSeller ? 'bg-red-600 text-white' : 'bg-muted text-foreground'
        }`}
      >
        <div className="mb-0.5 flex items-center gap-2 text-xs opacity-80">
          <DirectionLabel direction={message.direction} />
          <span className="tabular-nums">
            {message.createdAt ? formatDate(message.createdAt) : '—'}
          </span>
        </div>
        {message.text ? <p>{message.text}</p> : <p className="italic opacity-70">Без текста</p>}
      </div>
    </li>
  )
}

/** Human-readable RU direction label. */
function DirectionLabel({ direction }: { direction: WbChatMessage['direction'] }) {
  if (direction === 'client') return <span>Покупатель</span>
  if (direction === 'seller') return <span>Продавец</span>
  if (direction === 'wb') return <span>Wildberries</span>
  return <span>Неизвестно</span>
}
