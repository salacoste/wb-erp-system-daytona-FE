'use client'

import { CabinetInfoCard } from '@/components/custom/settings/CabinetInfoCard'
import { TargetMarginSettingsCard } from '@/components/custom/settings/TargetMarginSettingsCard'
import { JamStatusBadge } from '@/components/custom/settings/JamStatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'

export default function CabinetSettingsPage() {
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
        <h1 className="text-2xl font-bold">Кабинет</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Информация о продавце и статус подписки Джем
        </p>
      </div>
      <CabinetInfoCard cabinetId={cabinetId} />
      <div className="mt-6">
        <TargetMarginSettingsCard cabinetId={cabinetId} />
      </div>
      <div className="mt-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Подписка Джем</h2>
        <JamStatusBadge cabinetId={cabinetId} />
      </div>
    </div>
  )
}
