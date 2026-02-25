/**
 * Tax & VAT Settings Page
 * Story 66.3-FE: Tax & VAT Settings Page
 * Epic 66-FE: Tax & Accounting Frontend
 */

'use client'

import { TaxSettingsForm } from '@/components/custom/settings/TaxSettingsForm'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'

export default function TaxSettingsPage() {
  const cabinetId = useAuthStore(state => state.cabinetId)

  if (!cabinetId) {
    return (
      <div className="container mx-auto max-w-2xl py-6">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-6 h-4 w-96" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Налоговые настройки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Настройки системы налогообложения и НДС для расчёта чистой прибыли
        </p>
      </div>
      <TaxSettingsForm cabinetId={cabinetId} />
    </div>
  )
}
