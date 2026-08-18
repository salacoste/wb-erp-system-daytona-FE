/**
 * Acquiring Page orchestrator
 * Epic 90-FE Story 90.2: Acquiring Reports List Page
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAcquiringReports } from '@/hooks/use-acquiring-reports'
import { getAcquiringRateLimit } from '@/hooks/use-acquiring-rate-limit'
import { ROUTES } from '@/lib/routes'
import type { DateRange } from '@/types/date-range'
import { AcquiringSummaryCards } from './AcquiringSummaryCards'
import { AcquiringReportsTable } from './AcquiringReportsTable'
import { AcquiringRateLimitBanner } from './shared/AcquiringRateLimitBanner'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function AcquiringPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const { data, isLoading, isError, error, refetch } = useAcquiringReports(apiFrom, apiTo)
  const items = data?.data ?? []
  const hasData = items.length > 0

  // 503 rate-limit detection — Story 96.9-FE, request-backend/169 § 1.1
  const rateLimit = getAcquiringRateLimit(error)

  // Show full-page skeleton ONLY on first load (no cached data yet)
  const showSkeleton = isLoading && !hasData
  // Show rate-limit banner (503) before generic error — Defensive Frontend Principle
  const showRateLimitBanner = rateLimit.isRateLimited && !hasData
  // Show generic error alert ONLY when no cached data AND not a 503
  const showFullError = isError && !hasData && !rateLimit.isRateLimited

  return (
    <div className="space-y-6" data-testid="acquiring-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Аналитика эквайринга</h1>
        <p className="text-muted-foreground mt-1">Комиссии платёжных систем по отчётам WB</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="acquiring-date-range"
        />
        <Button variant="outline" size="sm" asChild>
          <Link href={ROUTES.ANALYTICS.ACQUIRING_PERIOD}>Детализация за период</Link>
        </Button>
      </div>

      {/* Body state machine — skeleton → rate-limit banner → full-error → empty/cached */}
      {showSkeleton ? (
        <div className="space-y-4" role="status" aria-busy="true" aria-label="Загрузка данных">
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
            <span>Не удалось загрузить отчёты. Попробуйте ещё раз.</span>
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
            <p>Отчёты за выбранный период не найдены.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Для не-РФ продавцов данные всегда пустые (см. Request #166).
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Inline refetch-error chip when we have cached data but the refetch failed */}
          {isError && hasData && (
            <div className="rounded-md border border-status-warning/30 bg-status-warning/15 px-4 py-2 text-sm text-status-warning flex items-center justify-between">
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
          <AcquiringSummaryCards items={items} />
          <AcquiringReportsTable items={items} />
        </>
      )}
    </div>
  )
}
