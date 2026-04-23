/**
 * Acquiring Report Detail Page — orchestrator
 * Epic 90-FE Story 90.3: /analytics/acquiring/reports/[id]
 *
 * State machine mirrors Story 90.2's AcquiringPageContent:
 *   showSkeleton  = isLoading && !hasData   (first-load, no cached data)
 *   showFullError = isError && !hasData     (hard error, nothing to show)
 *   empty         = !isLoading && !isError && transactions.length === 0
 *   inline chip   = isError && hasData      (refetch failed, showing stale data)
 *
 * Period derived from min(saleDate) → max(acqDate) across transactions.
 * No backend metadata endpoint for report-level fields (Story 90.3 dev notes).
 */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { useAcquiringReportDetail } from '@/hooks/use-acquiring-report-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDate } from '@/lib/utils'
import { AcquiringTransactionsTable } from './AcquiringTransactionsTable'
import { AcquiringReportDetailSummary } from './AcquiringReportDetailSummary'

interface AcquiringReportDetailPageProps {
  reportId: number
}

export function AcquiringReportDetailPage({ reportId }: AcquiringReportDetailPageProps) {
  const { data, isLoading, isError, refetch } = useAcquiringReportDetail(reportId)
  const transactions = data?.data ?? []
  const hasData = transactions.length > 0

  const showSkeleton = isLoading && !hasData
  const showFullError = isError && !hasData

  // Derive period from transactions — no report-level metadata in detail endpoint.
  // H-1: Use saleDate for both ends — matches spec's "min(sale_date) → max(sale_date)" and
  // avoids inconsistent axis bug where acqDate could be BEFORE saleDate (batch reversal).
  const periodLabel = useMemo(() => {
    if (!transactions.length) return null
    const saleDates = transactions
      .map(t => t.saleDate)
      .filter(Boolean)
      .sort()
    if (!saleDates.length) return null
    const from = saleDates[0]
    const to = saleDates[saleDates.length - 1]
    if (!from || !to) return null
    return `${formatDate(from)} — ${formatDate(to)}`
  }, [transactions])

  return (
    <div className="space-y-6" data-testid="acquiring-report-detail">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={ROUTES.ANALYTICS.ACQUIRING}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к отчётам
        </Link>
      </Button>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Отчёт #{reportId}</h1>
        <p className="text-muted-foreground mt-1">{periodLabel ?? 'Период транзакций'}</p>
      </div>

      {/* State machine */}
      {showSkeleton ? (
        <div className="space-y-4" role="status" aria-busy="true" aria-label="Загрузка данных">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
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
            <p>Транзакции для этого отчёта не найдены.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Для не-РФ продавцов данные всегда пустые (см. Request #166).
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Inline refetch-error chip when we have cached data but the refetch failed */}
          {isError && hasData && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center justify-between">
              <span>Не удалось обновить. Показаны кэшированные данные.</span>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Повторить
              </Button>
            </div>
          )}
          <AcquiringReportDetailSummary transactions={transactions} />
          <AcquiringTransactionsTable transactions={transactions} />
        </>
      )}
    </div>
  )
}
