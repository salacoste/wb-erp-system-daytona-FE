/**
 * Acquiring Period Detail Page — orchestrator
 * Epic 90-FE Story 90.4: /analytics/acquiring/period
 *
 * State machine mirrors Story 90.3's AcquiringReportDetailPage:
 *   showSkeleton        = isLoading && !hasData   (first-load, no cached data)
 *   showRateLimitBanner = rateLimit.isRateLimited && !hasData
 *   showFullError       = isError && !hasData && !rateLimit.isRateLimited  (non-503 hard error, nothing to show)
 *   empty               = !isLoading && !isError && transactions.length === 0
 *   inline chip         = isError && hasData      (refetch failed, showing stale data)
 *
 * Default date range: last 7 days (narrower than reports-list 30-day default —
 * period-detail is for auditing a specific week, not a month overview).
 * Imports AcquiringTransactionsTable directly from Story 90.3 — no duplication.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ROUTES } from '@/lib/routes'
import { useAcquiringPeriodDetail } from '@/hooks/use-acquiring-period-detail'
import { getAcquiringRateLimit } from '@/hooks/use-acquiring-rate-limit'
import { AcquiringTransactionsTable } from '@/app/(dashboard)/analytics/acquiring/reports/[id]/components/AcquiringTransactionsTable'
import { AcquiringPeriodSummary } from './AcquiringPeriodSummary'
import { AcquiringRateLimitBanner } from '@/app/(dashboard)/analytics/acquiring/components/shared/AcquiringRateLimitBanner'
import type { DateRange } from '@/types/date-range'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 6)
  from.setHours(0, 0, 0, 0)
  // Last 7 days inclusive (today + 6 previous days)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function AcquiringPeriodDetailPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const { data, isLoading, isError, error, refetch } = useAcquiringPeriodDetail(apiFrom, apiTo)
  const transactions = data?.data ?? []
  const hasData = transactions.length > 0

  // 503 rate-limit detection — Story 96.9-FE, request-backend/169 § 1.1
  const rateLimit = getAcquiringRateLimit(error)

  // Show full-page skeleton ONLY on first load (no cached data yet)
  const showSkeleton = isLoading && !hasData
  // Show rate-limit banner (503) before generic error — Defensive Frontend Principle
  const showRateLimitBanner = rateLimit.isRateLimited && !hasData
  // Show generic error alert ONLY when no cached data AND not a 503
  const showFullError = isError && !hasData && !rateLimit.isRateLimited

  return (
    <div className="space-y-6" data-testid="acquiring-period-detail">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={ROUTES.ANALYTICS.ACQUIRING}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к отчётам
        </Link>
      </Button>

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Эквайринг за период</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  className="h-4 w-4 text-muted-foreground cursor-help"
                  aria-label="О странице"
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  Эта страница показывает все транзакции эквайринга за выбранный период без
                  группировки по отчётам. Используйте её, когда отчёты WB перекрываются или нужно
                  аудитировать конкретную неделю.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-muted-foreground mt-1">
          Транзакции эквайринга без группировки по отчётам
        </p>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4 flex-wrap">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="acquiring-period-range"
        />
      </div>

      {/* Body state machine — skeleton → rate-limit banner → full-error → empty/cached */}
      {showSkeleton ? (
        <div className="space-y-4" role="status" aria-busy="true" aria-label="Загрузка транзакций">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : showRateLimitBanner ? (
        <AcquiringRateLimitBanner
          retryAfterSeconds={rateLimit.retryAfterSeconds}
          onRefetch={() => void refetch()}
        />
      ) : showFullError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить транзакции. Попробуйте ещё раз.</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 shrink-0"
              onClick={() => void refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      ) : !hasData ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p>Транзакции за выбранный период не найдены.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Для не-РФ продавцов данные всегда пустые.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Inline refetch-error chip when we have cached data but the refetch failed */}
          {isError && hasData && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center justify-between">
              <span>
                {rateLimit.isRateLimited
                  ? `WB временно недоступна — показаны кэшированные данные. Повтор через ~${rateLimit.retryAfterSeconds} сек`
                  : 'Не удалось обновить. Показаны кэшированные данные.'}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Повторить
              </Button>
            </div>
          )}
          <AcquiringPeriodSummary transactions={transactions} />
          <AcquiringTransactionsTable transactions={transactions} />
        </>
      )}
    </div>
  )
}
