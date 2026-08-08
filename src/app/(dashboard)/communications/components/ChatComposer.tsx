'use client'

/**
 * ChatComposer — NEW-2 send-a-message surface for a chat thread (PR2).
 *
 * Orchestrates the 202→poll→terminal flow for sending a seller chat message
 * (deterministic jobId dedup). `replySign` is the WB handshake sourced from the
 * chat thread (WbChatThread.replySign). On terminal `completed` → toast +
 * invalidate the chats read query; on `failed`/error → WritebackStatus.
 * 403 from the gate → kill-switch RU message (Defensive Frontend).
 *
 * The hook mints the confirmationToken; the user gesture is the submit click.
 */

import { useState, useCallback, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { WritebackStatus } from './WritebackStatus'
import {
  useSendChatMessage,
  WRITEBACK_TIMEOUT_MESSAGE,
  WRITEBACK_TIMEOUT_STATUS,
} from '@/hooks/useCommunicationsWriteback'
import { useWritebackJob } from '@/hooks/useWritebackJob'
import { communicationsQueryKeys } from '@/hooks/useCommunications-utils'
import { isWritebackCompleted } from '@/lib/communications-writeback-utils'

/** WB + BE cap on public seller-facing text (reputation protection). */
const PUBLIC_TEXT_MAX_LENGTH = 3000

export interface ChatComposerProps {
  /** WB handshake for the thread (null/empty → send is disabled, no crash). */
  replySign: string | null
}

/** Render the message textarea + send button + async status. */
export function ChatComposer({ replySign }: ChatComposerProps) {
  const [message, setMessage] = useState('')
  const send = useSendChatMessage()
  const queryClient = useQueryClient()

  const invalidateChats = useCallback(
    () => queryClient.invalidateQueries({ queryKey: communicationsQueryKeys.chats() }),
    [queryClient]
  )

  const job = useWritebackJob((status, _error, _meta) => {
    if (isWritebackCompleted(status)) {
      toast.success('Сообщение отправлено')
      invalidateChats()
      setMessage('')
    } else if (status === WRITEBACK_TIMEOUT_STATUS) {
      // Pass-2 P2-1: RU timeout toast (distinct from the generic failure toast).
      toast.error(WRITEBACK_TIMEOUT_MESSAGE)
    } else {
      toast.error('Не удалось отправить сообщение')
    }
  })

  const isPending = send.isPending || (!!job.jobId && !job.isTerminal)
  const canSend = !!replySign && message.trim().length > 0 && !isPending

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      if (!canSend || !replySign) return
      job.setActionKind('send_chat')
      send.mutate(
        { replySign, message: message.trim() },
        {
          onSuccess: enqueued => job.setJobId(enqueued.jobId),
        }
      )
    },
    [canSend, replySign, message, send, job]
  )

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <Textarea
        value={message}
        onChange={e => setMessage(e.target.value.slice(0, PUBLIC_TEXT_MAX_LENGTH))}
        maxLength={PUBLIC_TEXT_MAX_LENGTH}
        aria-label="Сообщение в чат"
        placeholder={replySign ? 'Введите сообщение…' : 'Беседа недоступна для ответа'}
        rows={2}
        disabled={isPending || !replySign}
        data-testid="chat-message-textarea"
      />
      <div className="flex items-center justify-between gap-2">
        <WritebackStatus
          isInflight={isPending}
          error={send.error}
          status={job.effectiveStatus}
          pollError={job.pollError}
          jobError={
            job.isTerminal && !isWritebackCompleted(job.status)
              ? (job.error ?? undefined)
              : undefined
          }
          testId="chat-writeback-status"
        />
        <Button type="submit" size="sm" disabled={!canSend} data-testid="chat-send-btn">
          Отправить
        </Button>
      </div>
    </form>
  )
}
