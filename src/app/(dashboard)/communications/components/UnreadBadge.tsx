'use client'

/**
 * UnreadBadge — NEW-2 live unread indicator (feedbacks + questions).
 *
 * Renders a small dot/badge in the page header from GET /v1/communications/unread.
 * Owns its OWN loading/empty/error handling (AC4): a badge failure never blanks
 * the page. While loading or on error, renders nothing (no stale/false signal).
 */

import { useUnreadBadge } from '@/hooks/useCommunications'

export interface UnreadBadgeProps {
  /** Disable the query when the cabinet isn't ready (no auth/cabinet selected). */
  enabled?: boolean
}

/** A red dot shown when either feedbacks or questions are unread. */
export function UnreadBadge({ enabled = true }: UnreadBadgeProps) {
  const { data, isLoading, isError } = useUnreadBadge({ enabled })

  // Loading / error / no-data → render nothing (never a false "all read" signal).
  if (isLoading || isError || !data) return null
  const hasUnread = data.hasNewFeedbacks || data.hasNewQuestions
  if (!hasUnread) return null

  return (
    <span
      role="status"
      title="Есть новые отзывы или вопросы"
      className="inline-flex h-2.5 w-2.5 rounded-full bg-destructive"
      data-testid="unread-dot"
    >
      <span className="sr-only">Есть новые сообщения</span>
    </span>
  )
}
