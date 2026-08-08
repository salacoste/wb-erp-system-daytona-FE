'use client'

/**
 * ReplyForm — NEW-2 inline reply/edit textarea (≤3000) for a feedback.
 *
 * Controlled by the parent FeedbackRow. Caps input at 3000 chars (BE DTO limit;
 * AP#8 — enforce at the boundary). Submit is disabled while the mutation/job is
 * pending OR the text is empty/whitespace. Esc/cancel returns to read-only.
 *
 * The parent mints the confirmationToken on submit (via the hook), so this form
 * is just the text + gesture surface — it does NOT touch the token directly.
 */

import { useState, useCallback, type FormEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

/** WB + BE cap on public seller-facing text (reputation protection). */
const PUBLIC_TEXT_MAX_LENGTH = 3000

export interface ReplyFormProps {
  /** Initial text (edit mode — prefilled with the existing answer). */
  initialText?: string
  /** Submit-button label (RU — "Ответить" or "Сохранить"). */
  submitLabel: string
  /** Accessible label for the textarea. */
  ariaLabel: string
  /** Fired with the trimmed text on submit (parent runs the mutation). */
  onSubmit: (text: string) => void
  /** Cancel handler (returns to read-only). */
  onCancel: () => void
  /** True while the mutation/job is pending. */
  isPending: boolean
}

/** Render the inline textarea + submit/cancel. */
export function ReplyForm({
  initialText = '',
  submitLabel,
  ariaLabel,
  onSubmit,
  onCancel,
  isPending,
}: ReplyFormProps) {
  const [text, setText] = useState(initialText)
  const remaining = PUBLIC_TEXT_MAX_LENGTH - text.length
  const canSubmit = text.trim().length > 0 && !isPending

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      if (!canSubmit) return
      onSubmit(text.trim())
    },
    [canSubmit, text, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <Label htmlFor="reply-text" className="sr-only">
        {ariaLabel}
      </Label>
      <Textarea
        id="reply-text"
        value={text}
        onChange={e => setText(e.target.value.slice(0, PUBLIC_TEXT_MAX_LENGTH))}
        maxLength={PUBLIC_TEXT_MAX_LENGTH}
        aria-label={ariaLabel}
        placeholder="Введите ответ…"
        rows={3}
        disabled={isPending}
        data-testid="reply-textarea"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-muted-foreground" data-testid="reply-counter">
          {remaining} символов осталось
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit} data-testid="reply-submit">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
