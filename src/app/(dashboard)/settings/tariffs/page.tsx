'use client'

// ============================================================================
// Tariff Settings Admin Page
// Epic 52-FE: Story 52-FE.7 - Page Layout, Types & Integration
// Admin-only page for managing global Wildberries tariff settings
// ============================================================================

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings2 } from 'lucide-react'
import {
  RateLimitIndicator,
  VersionHistoryTable,
  AuditLogTable,
  TariffSettingsForm,
} from '@/components/custom/tariffs-admin'

// ============================================================================
// Loading Skeleton Component
// ============================================================================

/**
 * Loading skeleton displayed while auth is loading
 */
function TariffSettingsPageSkeleton() {
  return (
    <div className="container py-6 space-y-6">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-4 w-48" data-testid="skeleton" />

      {/* Title skeleton */}
      <Skeleton className="h-8 w-64" data-testid="skeleton" />

      {/* Subtitle skeleton */}
      <Skeleton className="h-4 w-96" data-testid="skeleton" />

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

  // Admin check (AC2): Only Owner role can access this page
  // Redirect non-admin users to dashboard
  if (user && user.role !== 'Owner') {
    router.push('/dashboard')
    return null
  }

  // Loading state (AC9): Show skeleton while user is null
  if (!user) {
    return <TariffSettingsPageSkeleton />
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumbs (AC7) */}
          <nav className="text-sm text-gray-600 mb-2">
            <Link href="/dashboard" className="hover:text-gray-900">
              Главная
            </Link>
            {' > '}
            <Link href="/settings" className="hover:text-gray-900">
              Настройки
            </Link>
            {' > '}
            <span className="text-gray-900">Тарифы</span>
          </nav>

          {/* Header with title and rate limit indicator */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Settings2 className="h-8 w-8 text-gray-700" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Управление тарифами
                </h1>
                <p className="text-muted-foreground">
                  Настройки глобальных тарифов Wildberries
                </p>
              </div>
            </div>
            <RateLimitIndicator />
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs (AC3) */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
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
    </main>
  )
}
