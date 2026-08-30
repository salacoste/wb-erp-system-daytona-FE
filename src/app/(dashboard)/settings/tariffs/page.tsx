'use client'

// ============================================================================
// Tariff Settings Admin Page
// Epic 52-FE: Story 52-FE.7 - Page Layout, Types & Integration
// Admin-only page for managing global Wildberries tariff settings
// ============================================================================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTariffSettings } from '@/hooks/useTariffSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ContextBar, PageHeader } from '@/components/product'
import {
  RateLimitIndicator,
  VersionHistoryTable,
  AuditLogTable,
  TariffSettingsForm,
} from '@/components/custom/tariffs-admin'
import { getUnavailableTariffFieldLabels } from '@/components/custom/tariffs-admin/tariffSettingsSchema'

// ============================================================================
// Loading Skeleton Component
// ============================================================================

/**
 * Loading skeleton displayed while auth is loading
 */
function TariffSettingsPageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Проверка доступа к тарифам"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl space-y-6 py-2"
    >
      <span className="sr-only">Проверяем доступ к управлению тарифами</span>
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-4 w-48" data-testid="skeleton" />

      {/* Title skeleton */}
      <Skeleton className="h-8 w-64" data-testid="skeleton" />

      {/* Subtitle skeleton */}
      <Skeleton className="h-4 w-full max-w-96" data-testid="skeleton" />

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full max-w-md" data-testid="skeleton" />

      {/* Content skeleton */}
      <Skeleton className="h-96 w-full" data-testid="skeleton" />
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * Tariff Settings Admin Page
 *
 * Access Control: Admin only (role = 'Owner')
 * Non-admin users are redirected to dashboard
 *
 * Layout:
 * - Breadcrumbs: Главная > Настройки > Тарифы
 * - Header with title and rate limit indicator
 * - 3 tabs: Текущие настройки, История версий, Журнал изменений
 */
export default function TariffSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const isOwner = user?.role === 'Owner'

  // Admin check (AC2): Only Owner role can access this page.
  // Redirect after mount to avoid mutating Next router during render.
  useEffect(() => {
    if (user && !isOwner) {
      router.push('/dashboard')
    }
  }, [isOwner, router, user])

  // Loading/redirect state (AC9): Show skeleton while auth is unresolved or redirecting.
  if (!user || !isOwner) {
    return <TariffSettingsPageSkeleton />
  }

  return <TariffSettingsContent />
}

function TariffSettingsContent() {
  const { data: settings, isLoading, isFetching, error } = useTariffSettings()
  const unavailableFieldLabels = getUnavailableTariffFieldLabels(settings)
  const contextState =
    isLoading || isFetching
      ? { state: 'refreshing' as const, label: 'Загружаем тарифные данные' }
      : error
        ? { state: 'unavailable' as const, label: 'Тарифные данные временно недоступны' }
        : unavailableFieldLabels.length > 0
          ? { state: 'partial' as const, label: 'Часть тарифных данных недоступна' }
          : { state: 'fresh' as const, label: 'Тарифные данные доступны для управления' }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 py-2">
      <PageHeader
        title="Управление тарифами"
        description="Настройки глобальных тарифов Wildberries"
        breadcrumbs={[
          { label: 'Главная', href: '/dashboard' },
          { label: 'Настройки', href: '/settings' },
          { label: 'Тарифы' },
        ]}
        actions={<RateLimitIndicator />}
      />

      <ContextBar
        scope="Текущие настройки, история версий и журнал изменений"
        state={contextState.state}
        stateLabel={contextState.label}
      />

      <div className="min-w-0">
        {/* Tabs (AC3) */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:max-w-2xl sm:grid-cols-3">
            <TabsTrigger value="current">Текущие настройки</TabsTrigger>
            <TabsTrigger value="history">История версий</TabsTrigger>
            <TabsTrigger value="audit">Журнал изменений</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6">
            <TariffSettingsForm />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <VersionHistoryTable />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditLogTable />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
