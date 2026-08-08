'use client'

/**
 * ClaimsSection — NEW-2 WB seller claims / disputes (read-only PR1).
 *
 * Owns its OWN loading/error/empty state machine (AC4). Lists claims with nmId
 * (String, AP#10), orderId, status, and date. No resolve/respond UI (PR2).
 */

import { useCallback } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useClaims } from '@/hooks/useCommunications'
import { formatDate } from '@/lib/utils'
import { SectionState } from './SectionState'
import type { WbClaim } from '@/types/communications'

const CLAIMS_ERROR_MESSAGE = 'Не удалось загрузить претензии. Попробуйте ещё раз.'
const CLAIMS_EMPTY_MESSAGE = 'Нет претензий'

export interface ClaimsSectionProps {
  enabled?: boolean
}

/** GET /v1/communications/claims — all claims (no status filter by default). */
export function ClaimsSection({ enabled = true }: ClaimsSectionProps) {
  const claims = useClaims({}, { enabled })

  const handleRetry = useCallback(() => claims.refetch(), [claims])
  const rows = claims.data?.rows ?? []
  const total = claims.data?.total ?? 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            Претензии
          </span>
          <span className="text-xs font-normal text-muted-foreground">Всего: {total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SectionState
          isLoading={claims.isLoading}
          isError={claims.isError}
          isEmpty={rows.length === 0}
          errorMessage={CLAIMS_ERROR_MESSAGE}
          emptyMessage={CLAIMS_EMPTY_MESSAGE}
          onRetry={handleRetry}
        >
          <ul className="divide-y divide-border">
            {rows.map(c => (
              <ClaimRow key={c.id} claim={c} />
            ))}
          </ul>
        </SectionState>
      </CardContent>
    </Card>
  )
}

/** Render a single claim: nmId + orderId + status + date (read-only). */
function ClaimRow({ claim }: { claim: WbClaim }) {
  const { nmId, orderId, status, createdAt } = claim
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>
          Артикул:{' '}
          <span className="font-mono tabular-nums">{nmId == null ? '—' : String(nmId)}</span>
        </span>
        <span>
          Заказ: <span className="font-mono">{orderId ?? '—'}</span>
        </span>
        <span>
          Статус: <span className="text-muted-foreground">{status ?? '—'}</span>
        </span>
      </div>
      <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
        {createdAt ? formatDate(createdAt) : '—'}
      </div>
    </li>
  )
}
