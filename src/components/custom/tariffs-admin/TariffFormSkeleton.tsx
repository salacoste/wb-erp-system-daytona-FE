'use client'

// ============================================================================
// Tariff Form Skeleton & Error States
// Epic 52-FE / Story 74.6: Extracted from TariffSettingsForm.tsx
// Loading and error display components
// ============================================================================

import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Loading skeleton for tariff settings form.
 * Shows placeholder UI while settings are being fetched.
 */
export function TariffFormSkeleton() {
  return (
    <Card
      data-testid="form-skeleton"
      role="status"
      aria-label="Загрузка настроек тарифов"
      aria-busy="true"
    >
      <span className="sr-only">Загружаем актуальные значения тарифов</span>
      <CardHeader className="border-b">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error state for tariff settings form.
 * Shows when settings fail to load from the API.
 */
export function TariffFormError() {
  return (
    <Card>
      <CardContent className="py-8">
        <Alert variant="destructive" aria-label="Ошибка загрузки настроек тарифов">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка загрузки настроек тарифов. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
