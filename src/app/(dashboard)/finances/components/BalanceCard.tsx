'use client'

/**
 * BalanceCard — NEW-7 account balance display.
 *
 * Owns its OWN loading/empty/error state machine (AC4 — multi-source). A balance
 * failure never blanks the documents table (sibling component). Money fields are
 * nullable (AP#8): null → '—', never 0.
 *
 * Rate-limit-aware: the underlying `useAccountBalance` hook has a 60s staleTime
 * mirroring the WB 1/min limit, so this card won't refetch faster than WB allows.
 */

import { useCallback } from 'react'
import { RefreshCw, AlertTriangle, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAccountBalance } from '@/hooks/useFinances'
import { formatNullableCurrency } from '@/lib/finances/finances-formatters'

/** Canonical RU error string for the balance error/retry branch. */
const BALANCE_ERROR_MESSAGE = 'Не удалось загрузить баланс кабинета. Попробуйте ещё раз.'

export interface BalanceCardProps {
  /** Disable the query when the cabinet isn't ready (no auth/cabinet selected). */
  enabled?: boolean
}

export function BalanceCard({ enabled = true }: BalanceCardProps) {
  const { data, isLoading, isError, refetch } = useAccountBalance({ enabled })

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" aria-hidden />
          Баланс кабинета
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BalanceCardBody
          isLoading={isLoading}
          isError={isError}
          balance={data}
          onRetry={handleRetry}
        />
      </CardContent>
    </Card>
  )
}

interface BalanceCardBodyProps {
  isLoading: boolean
  isError: boolean
  balance: ReturnType<typeof useAccountBalance>['data']
  onRetry: () => void
}

function BalanceCardBody({ isLoading, isError, balance, onRetry }: BalanceCardBodyProps) {
  // Loading — scoped skeleton (page rest stays usable, AC4).
  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Загрузка баланса">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-40" />
      </div>
    )
  }

  // Error → canonical RU error + retry (rate-limit/WB-unavailable surfaces here).
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{BALANCE_ERROR_MESSAGE}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty — WB returned all-null balance (no balance data yet). AP#8: '—' not 0.
  const hasAny =
    balance &&
    (balance.currency !== null || balance.current !== null || balance.forWithdraw !== null)
  if (!hasAny) {
    return <p className="text-sm text-muted-foreground">Данные о балансе пока недоступны</p>
  }

  // Populated — money formatted RUB (null → '—', AP#8).
  return (
    <dl className="space-y-3">
      <div>
        <dt className="text-xs text-muted-foreground">Текущий баланс</dt>
        <dd className="text-2xl font-semibold tabular-nums">
          {formatNullableCurrency(balance?.current ?? null)}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <dt className="text-xs text-muted-foreground">Доступно к выводу</dt>
          <dd className="text-base font-medium tabular-nums">
            {formatNullableCurrency(balance?.forWithdraw ?? null)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Валюта</dt>
          <dd className="text-base font-medium">{balance?.currency ?? '—'}</dd>
        </div>
      </div>
    </dl>
  )
}
