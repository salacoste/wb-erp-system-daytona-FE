'use client'

import { PageHeader } from '@/components/product'
import { Skeleton } from '@/components/ui/skeleton'
import { TaxSettingsForm } from '@/components/custom/settings/TaxSettingsForm'
import { useAuthStore } from '@/stores/authStore'

export default function TaxSettingsPage() {
  const cabinetId = useAuthStore(state => state.cabinetId)

  return (
    <section
      aria-label="Настройки налогов и НДС"
      className="mx-auto w-full max-w-3xl space-y-6 py-2"
    >
      <PageHeader
        title="Налоговые настройки"
        description="Настройки системы налогообложения и НДС для расчёта чистой прибыли"
        breadcrumbs={[
          { label: 'Главная', href: '/dashboard' },
          { label: 'Настройки', href: '/settings' },
          { label: 'Налоги' },
        ]}
        busy={!cabinetId}
      />

      {cabinetId ? (
        <TaxSettingsForm key={cabinetId} cabinetId={cabinetId} />
      ) : (
        <div
          role="status"
          aria-label="Подготовка налоговых настроек"
          aria-busy="true"
          className="space-y-4"
        >
          <span className="sr-only">Определяем активный кабинет</span>
          <Skeleton className="h-24 w-full" data-testid="skeleton" />
          <Skeleton className="h-64 w-full" data-testid="skeleton" />
          <Skeleton className="h-56 w-full" data-testid="skeleton" />
        </div>
      )}
    </section>
  )
}
