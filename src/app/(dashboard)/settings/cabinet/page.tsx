'use client'

import { CabinetInfoCard } from '@/components/custom/settings/CabinetInfoCard'
import { TargetMarginSettingsCard } from '@/components/custom/settings/TargetMarginSettingsCard'
import { JamStatusBadge } from '@/components/custom/settings/JamStatusBadge'
import { ContextBar, PageHeader } from '@/components/product'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'

export default function CabinetSettingsPage() {
  const cabinetId = useAuthStore(state => state.cabinetId)

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 py-2">
      <PageHeader
        title="Кабинет"
        description={<p>Информация о продавце, параметры аналитики и статус подписки Джем</p>}
        breadcrumbs={[{ label: 'Настройки', href: '/settings' }, { label: 'Кабинет' }]}
        busy={!cabinetId}
      />

      {!cabinetId ? (
        <div
          role="status"
          aria-label="Определение активного кабинета"
          aria-busy="true"
          className="space-y-6"
        >
          <span className="sr-only">Определяем активный кабинет</span>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : (
        <>
          <ContextBar
            cabinet={<span className="font-mono text-xs">{cabinetId}</span>}
            scope="Профиль, рейтинг, подписка и целевая маржа"
            stateLabel="Активный кабинет выбран"
          />
          <CabinetInfoCard cabinetId={cabinetId} />
          <TargetMarginSettingsCard cabinetId={cabinetId} />
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-lg">Действия с подпиской Джем</h2>
              </CardTitle>
              <CardDescription>
                Текущий тариф и безопасный переход к управлению подпиской на Wildberries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JamStatusBadge cabinetId={cabinetId} />
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}
