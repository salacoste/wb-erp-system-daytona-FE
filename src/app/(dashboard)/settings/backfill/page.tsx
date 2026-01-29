/**
 * Backfill Admin Page
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Owner-only admin page for managing historical data backfill.
 * Provides status monitoring and control for FBS data loading.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Database, RefreshCw, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  useBackfillStatus,
  useStartBackfill,
  usePauseBackfill,
  useResumeBackfill,
} from '@/hooks/useBackfillAdmin'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { BackfillStatusTable } from './components/BackfillStatusTable'
import { StartBackfillDialog } from './components/StartBackfillDialog'
import type { StartBackfillRequest } from '@/types/backfill'

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
  const router = useRouter()
  const { user } = useAuth()
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [resumingId, setResumingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  // Fetch backfill status with polling
  const { data: cabinets = [], isLoading, refetch, dataUpdatedAt } = useBackfillStatus()

  // Mutations
  const startMutation = useStartBackfill()
  const pauseMutation = usePauseBackfill()
  const resumeMutation = useResumeBackfill()

  // Owner check - redirect non-owners
  if (user && user.role !== 'Owner') {
    router.push('/dashboard')
    return null
  }

  // Loading state while checking auth
  if (!user) {
    return <BackfillPageSkeleton />
  }

  // Handlers
  const handleStart = async (request: StartBackfillRequest) => {
    try {
      await startMutation.mutateAsync(request)
      toast.success('Бэкфилл запущен успешно')
      setIsStartDialogOpen(false)
    } catch {
      toast.error('Ошибка запуска бэкфилла')
    }
  }

  const handlePause = async (cabinetId: string) => {
    setPausingId(cabinetId)
    try {
      await pauseMutation.mutateAsync(cabinetId)
      toast.success('Бэкфилл приостановлен')
    } catch {
      toast.error('Ошибка приостановки бэкфилла')
    } finally {
      setPausingId(null)
    }
  }

  const handleResume = async (cabinetId: string) => {
    setResumingId(cabinetId)
    try {
      await resumeMutation.mutateAsync(cabinetId)
      toast.success('Бэкфилл возобновлён')
    } catch {
      toast.error('Ошибка возобновления бэкфилла')
    } finally {
      setResumingId(null)
    }
  }

  const handleRetry = async (cabinetId: string) => {
    setRetryingId(cabinetId)
    try {
      await startMutation.mutateAsync({ cabinet_id: cabinetId })
      toast.success('Бэкфилл перезапущен')
    } catch {
      toast.error('Ошибка перезапуска бэкфилла')
    } finally {
      setRetryingId(null)
    }
  }

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ru-RU') : null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-600 mb-2" aria-label="Breadcrumb">
            <Link href="/dashboard" className="hover:text-gray-900">
              Главная
            </Link>
            {' > '}
            <Link href="/settings" className="hover:text-gray-900">
              Настройки
            </Link>
            {' > '}
            <span className="text-gray-900">Бэкфилл</span>
          </nav>

          {/* Header */}
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Управление бэкфиллом</h1>
              <p className="text-muted-foreground">Загрузка исторических данных FBS за 365 дней</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button onClick={() => setIsStartDialogOpen(true)} disabled={startMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Запустить бэкфилл
          </Button>

          <div className="flex items-center gap-4">
            {lastUpdated && <span className="text-sm text-gray-500">Обновлено: {lastUpdated}</span>}
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
        />
      </div>
    </main>
  )
}
