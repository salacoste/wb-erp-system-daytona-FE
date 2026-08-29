'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBackfillStatus } from '@/hooks/useBackfillAdmin'
import { Button } from '@/components/ui/button'
import { ContextBar, PageHeader } from '@/components/product'
import { BackfillStatusTable } from './components/BackfillStatusTable'
import { StartBackfillDialog } from './components/StartBackfillDialog'
import {
  BackfillInitialErrorState,
  BackfillInitialLoadingState,
  BackfillPageSkeleton,
  BackfillStaleState,
} from './components/backfill-presentation'
import { useBackfillHandlers } from './use-backfill-handlers'

export default function BackfillAdminPage() {
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const manualRefreshInFlightRef = useRef(false)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const isOwner = user?.role === 'Owner'
  const {
    isStartDialogOpen,
    setIsStartDialogOpen,
    pausingId,
    resumingId,
    retryingId,
    retryingSourceKeys,
    startMutation,
    handleStart,
    handlePause,
    handleResume,
    handleRetry,
    handleRetrySource,
  } = useBackfillHandlers()

  const {
    data: cabinets,
    isFetching,
    isError = false,
    isRefetchError = false,
    refetch,
    dataUpdatedAt,
  } = useBackfillStatus({ enabled: isOwner })

  useEffect(() => {
    if (user && !isOwner) router.push('/dashboard')
  }, [isOwner, router, user])

  if (!user || !isOwner) return <BackfillPageSkeleton />
  const hasUsableData = cabinets !== undefined
  const visibleCabinets = cabinets ?? []
  const isInitialError = !hasUsableData && isError
  const isInitialPending = !hasUsableData && !isInitialError
  const isBackgroundError = hasUsableData && isRefetchError
  const isRetainedRetryFetching = isBackgroundError && isFetching
  const isRefreshBlocked = isManualRefreshing || isRetainedRetryFetching
  const lastUpdated =
    hasUsableData && dataUpdatedAt
      ? new Date(dataUpdatedAt).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' })
      : null

  const isActive = (status: (typeof visibleCabinets)[number]['status']) =>
    status === 'pending' || status === 'in_progress'
  const pipelineStatuses = visibleCabinets.flatMap(cabinet => [
    cabinet.status,
    cabinet.analytics_status,
  ])
  const activeCount = pipelineStatuses.filter(isActive).length
  const completedCount = pipelineStatuses.filter(status => status === 'completed').length
  const pausedCount = pipelineStatuses.filter(status => status === 'paused').length
  const failedCount = pipelineStatuses.filter(status => status === 'failed').length
  const contextState = isInitialError
    ? 'unavailable'
    : isBackgroundError
      ? 'stale'
      : lastUpdated
        ? 'fresh'
        : 'default'
  const handleManualRefresh = async () => {
    if (manualRefreshInFlightRef.current || isRetainedRetryFetching) return

    manualRefreshInFlightRef.current = true
    setIsManualRefreshing(true)
    try {
      await refetch()
    } finally {
      manualRefreshInFlightRef.current = false
      setIsManualRefreshing(false)
    }
  }
  const statusTable = (
    <BackfillStatusTable
      cabinets={visibleCabinets}
      onPause={handlePause}
      onResume={handleResume}
      onRetry={handleRetry}
      onRetrySource={handleRetrySource}
      pausingCabinetId={pausingId}
      resumingCabinetId={resumingId}
      retryingCabinetId={retryingId}
      retryingSourceKeys={retryingSourceKeys}
    />
  )

  return (
    <section className="space-y-6 py-2">
      <PageHeader
        title="Управление бэкфиллом"
        description="Загрузка исторических данных FBS за 365 дней"
        breadcrumbs={[
          { label: 'Главная', href: '/dashboard' },
          { label: 'Настройки', href: '/settings' },
          { label: 'Бэкфилл' },
        ]}
        busy={isInitialPending}
        actions={
          <Button
            ref={startButtonRef}
            onClick={() => !startMutation.isPending && hasUsableData && setIsStartDialogOpen(true)}
            disabled={!hasUsableData}
            aria-disabled={startMutation.isPending || !hasUsableData}
            className="min-h-11 whitespace-normal"
          >
            <Plus className="mr-2 h-4 w-4" />
            Запустить бэкфилл
          </Button>
        }
        status={
          hasUsableData && activeCount > 0 ? (
            <p className="rounded-md border border-status-information/40 bg-status-information/10 px-3 py-2 text-sm text-status-information">
              Загрузка продолжится в фоне — страницу можно безопасно закрыть.
            </p>
          ) : undefined
        }
      />
      <ContextBar
        freshness={
          lastUpdated
            ? `Обновлено: ${lastUpdated} (МСК)`
            : hasUsableData
              ? 'Успешный ответ получен'
              : 'Данные ещё не получены'
        }
        items={
          hasUsableData
            ? [
                { id: 'completed-pipelines', label: 'Завершено источников', value: completedCount },
                { id: 'active-pipelines', label: 'В работе источников', value: activeCount },
                { id: 'paused-pipelines', label: 'На паузе источников', value: pausedCount },
                { id: 'failed-pipelines', label: 'С ошибкой источников', value: failedCount },
              ]
            : []
        }
        state={contextState}
        stateLabel={isInitialPending ? 'Получаем данные' : undefined}
        onRefresh={
          hasUsableData && (!isRetainedRetryFetching || isManualRefreshing)
            ? () => void handleManualRefresh()
            : undefined
        }
        isRefreshing={isManualRefreshing}
        refreshLabel="Обновить"
      />

      {isInitialError ? (
        <BackfillInitialErrorState
          isRefreshing={isManualRefreshing}
          onRetry={handleManualRefresh}
        />
      ) : isInitialPending ? (
        <BackfillInitialLoadingState />
      ) : isBackgroundError ? (
        <BackfillStaleState
          isRefreshing={isRefreshBlocked}
          lastUpdated={lastUpdated}
          onRetry={() => void handleManualRefresh()}
        >
          {statusTable}
        </BackfillStaleState>
      ) : (
        statusTable
      )}

      <StartBackfillDialog
        cabinets={visibleCabinets}
        isOpen={isStartDialogOpen}
        onOpenChange={setIsStartDialogOpen}
        onStart={handleStart}
        isStarting={startMutation.isPending}
        returnFocusRef={startButtonRef}
      />
    </section>
  )
}
