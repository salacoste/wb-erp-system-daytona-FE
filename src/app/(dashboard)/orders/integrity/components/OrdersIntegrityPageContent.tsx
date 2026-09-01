'use client'

/**
 * Orders Integrity Page Orchestrator
 *
 * Composes IntegrityStatusCard, IntegrityChecksGrid, and ReconciliationSection
 * with a 3-branch state machine (loading / error / populated).
 *
 * Pattern from CLAUDE.md § Multi-Source Orchestration: independent state machines
 * for integrity checks and reconciliation section.
 */

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useOrdersIntegrity } from '@/hooks/use-orders-integrity'
import { IntegrityStatusCard } from './IntegrityStatusCard'
import { IntegrityChecksGrid } from './IntegrityChecksGrid'
import { ReconciliationSection } from './ReconciliationSection'

export function OrdersIntegrityPageContent() {
  const { data, isLoading, isError, refetch, isRefetching } = useOrdersIntegrity()

  const hasData = !!data
  const showSkeleton = isLoading && !hasData
  const showFullError = isError && !isLoading && !hasData

  return (
    <div className="space-y-6" data-testid="orders-integrity-page">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Целостность заказов</h1>
        <p className="mt-1 text-muted-foreground">
          Проверка целостности данных заказов, дубликатов и сверка с источниками
        </p>
      </div>

      {/* Integrity health section */}
      {isError && hasData && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось обновить проверку. Показаны последние доступные результаты.
          </AlertDescription>
        </Alert>
      )}
      {showSkeleton ? (
        <div className="space-y-4" role="status" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : showFullError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные проверки. Попробуйте ещё раз.</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 shrink-0"
              onClick={() => void refetch()}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      ) : hasData ? (
        <>
          <IntegrityStatusCard
            status={data.status}
            durationMs={data.durationMs}
            lastCheck={data.lastCheck}
            onRefresh={() => void refetch()}
            isRefetching={isRefetching}
          />
          <IntegrityChecksGrid checks={data.checks} />
        </>
      ) : null}

      {/* Reconciliation section — independent state machine */}
      <ReconciliationSection />
    </div>
  )
}
