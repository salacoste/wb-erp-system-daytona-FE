/**
 * Backfill Admin Page
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Owner-only admin page for managing historical data backfill.
 * Provides status monitoring and control for FBS data loading.
 */

'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database, RefreshCw, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBackfillStatus } from '@/hooks/useBackfillAdmin'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BackfillStatusTable } from './components/BackfillStatusTable'
import { StartBackfillDialog } from './components/StartBackfillDialog'
import { useBackfillHandlers } from './use-backfill-handlers'

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function BackfillPageSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      <Skeleton className="h-4 w-48" data-testid="skeleton" />
      <Skeleton className="h-8 w-64" data-testid="skeleton" />
      <Skeleton className="h-4 w-96" data-testid="skeleton" />
      <Skeleton className="h-10 w-full max-w-md" data-testid="skeleton" />
      <Skeleton className="h-96 w-full" data-testid="skeleton" />
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function BackfillAdminPage() {
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const { user } = useAuth()
  const isOwner = user?.role === 'Owner'
  const {
    isStartDialogOpen,
    setIsStartDialogOpen,
    pausingId,
    resumingId,
    retryingId,
    startMutation,
    handleStart,
    handlePause,
    handleResume,
    handleRetry,
  } = useBackfillHandlers()

  // Fetch backfill status with polling only for owners; managers must not call owner-only API.
  const {
    data: cabinets = [],
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useBackfillStatus({
    enabled: isOwner,
  })

  // Owner check - redirect non-owners after mount to avoid router updates during render.
  useEffect(() => {
    if (user && !isOwner) {
      router.push('/dashboard')
    }
  }, [isOwner, router, user])

  // Loading/redirect state while checking auth or redirecting non-owners.
  if (!user || !isOwner) {
    return <BackfillPageSkeleton />
  }

  // Europe/Moscow freshness stamp (project rule: all times are Moscow, not browser-local).
  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' })
    : null

  return (
    <section className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/dashboard" className="hover:text-foreground">
              Главная
            </Link>
            {' > '}
            <Link href="/settings" className="hover:text-foreground">
              Настройки
            </Link>
            {' > '}
            <span className="text-foreground">Бэкфилл</span>
          </nav>

          {/* Header */}
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Управление бэкфиллом</h1>
              <p className="text-muted-foreground">Загрузка исторических данных FBS за 365 дней</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button
            ref={startButtonRef}
            onClick={() => setIsStartDialogOpen(true)}
            disabled={startMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Запустить бэкфилл
          </Button>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">Обновлено: {lastUpdated}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </div>

        {/* Status Table */}
        <BackfillStatusTable
          cabinets={cabinets}
          isLoading={isLoading}
          onPause={handlePause}
          onResume={handleResume}
          onRetry={handleRetry}
          pausingCabinetId={pausingId}
          resumingCabinetId={resumingId}
          retryingCabinetId={retryingId}
        />

        {/* Start Dialog */}
        <StartBackfillDialog
          cabinets={cabinets}
          isOpen={isStartDialogOpen}
          onOpenChange={setIsStartDialogOpen}
          onStart={handleStart}
          isStarting={startMutation.isPending}
          returnFocusRef={startButtonRef}
        />
      </div>
    </section>
  )
}
