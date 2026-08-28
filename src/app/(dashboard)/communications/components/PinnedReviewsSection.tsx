'use client'

/**
 * PinnedReviewsSection — NEW-2 pinned reviews (live SDK passthrough, read-only).
 *
 * GET /v1/communications/feedbacks/pinned is a live WB SDK passthrough; the BE
 * keeps the `{ data, next }` envelope (the normalizer preserves `data`). Owns
 * its OWN loading/error/empty state machine (AC4). NOTE: `pinOn` is the LOCATION
 * of the pin ('nm' = product card, 'imt' = merged-card group), NOT a date — the
 * date is `changeStateAt`. No pin/unpin control (PR2 write-side).
 */

import { useCallback } from 'react'
import { Pin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePinnedFeedbacks } from '@/hooks/useCommunications'
import { formatDate } from '@/lib/utils'
import { SectionState } from './SectionState'
import { PinnedWriteControls } from './PinnedWriteControls'
import type { PinnedReviewItem } from '@/types/communications'

const PINNED_ERROR_MESSAGE = 'Не удалось загрузить закреплённые отзывы. Попробуйте ещё раз.'
const PINNED_EMPTY_MESSAGE = 'Нет закреплённых отзывов'

export interface PinnedReviewsSectionProps {
  enabled?: boolean
}

/** GET /v1/communications/feedbacks/pinned — live SDK passthrough (keeps `data`). */
export function PinnedReviewsSection({ enabled = true }: PinnedReviewsSectionProps) {
  const pinned = usePinnedFeedbacks({}, { enabled })

  const handleRetry = useCallback(() => pinned.refetch(), [pinned])
  // FUTURE: load-more via `next` cursor deferred to a follow-up (PR2) — the WB
  // pagination cursor is preserved in `pinned.data?.next` but PR1 renders only
  // the first page (read-only). Do not silently consume-and-discard it.
  const rows = pinned.data?.data ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Pin className="h-4 w-4" aria-hidden />
          Закреплённые отзывы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SectionState
          isLoading={pinned.isLoading}
          isError={pinned.isError}
          isEmpty={rows.length === 0}
          errorMessage={PINNED_ERROR_MESSAGE}
          emptyMessage={PINNED_EMPTY_MESSAGE}
          onRetry={handleRetry}
        >
          <ul className="divide-y divide-border">
            {rows.map((item, idx) => (
              <PinnedRow key={keyFor(item, idx)} item={item} />
            ))}
          </ul>
        </SectionState>
      </CardContent>
    </Card>
  )
}

/** Render a single pinned review (state badge + location + date + method). */
function PinnedRow({ item }: { item: PinnedReviewItem }) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>
          Отзыв #{' '}
          <span className="font-mono tabular-nums">
            {item.feedbackId == null ? '—' : String(item.feedbackId)}
          </span>
        </span>
        <StateBadge state={item.state} />
        {item.nmId == null ? null : (
          <span className="text-muted-foreground">
            Артикул:{' '}
            <span className="font-mono tabular-nums text-foreground">{String(item.nmId)}</span>
          </span>
        )}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{labelForLocation(item.pinOn)}</span>
        {item.pinMethod == null ? null : <span>{labelForMethod(item.pinMethod)}</span>}
        <span className="tabular-nums">
          {item.changeStateAt ? formatDate(item.changeStateAt) : 'Дата неизвестна'}
        </span>
      </div>
      {item.unpinnedCause == null ? null : (
        <div className="mt-0.5 text-xs text-muted-foreground">
          Причина открепления: {labelForCause(item.unpinnedCause)}
        </div>
      )}
      {/* PR2: gated pin/unpin surface (confirm dialog + 202→poll→terminal). */}
      <PinnedWriteControls feedbackId={item.feedbackId} />
    </li>
  )
}

/** State badge: pinned → "Закреплён", unpinned → "Откреплён", else neutral. */
function StateBadge({ state }: { state: string | null }) {
  if (state === 'pinned') return <span className="text-status-success">Закреплён</span>
  if (state === 'unpinned') return <span className="text-status-error">Откреплён</span>
  return <span>Статус неизвестен</span>
}

/** pinOn LOCATION label (nm = product card, imt = merged-card group). */
function labelForLocation(pinOn: string | null): string {
  if (pinOn === 'nm') return 'Карточка товара'
  if (pinOn === 'imt') return 'Группа карточек'
  return 'Место неизвестно'
}

/** pinMethod label (subscription = Jam subscription, tariff = paid tariff). */
function labelForMethod(pinMethod: string): string {
  if (pinMethod === 'subscription') return 'Подписка Джем'
  if (pinMethod === 'tariff') return 'Тариф'
  return pinMethod
}

/** unpinnedCause label (WB contract values → RU human-readable). */
function labelForCause(cause: string): string {
  switch (cause) {
    case 'sysTariffUnpinned':
      return 'Тариф откреплён'
    case 'sysLimitReached':
      return 'Достигнут лимит закреплений'
    case 'sysNoratingUnpinned':
      return 'Нет рейтинга'
    case 'sysAdditionalSlot':
      return 'Дополнительный слот'
    default:
      return cause
  }
}

/** Stable key for a pinned item (feedbackId may be null — fallback to index). */
function keyFor(item: PinnedReviewItem, idx: number): string {
  return item.feedbackId == null ? `pinned-${idx}` : `pinned-${String(item.feedbackId)}`
}
