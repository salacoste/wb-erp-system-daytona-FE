/**
 * Loading skeleton for the Supply Detail Page
 * Extracted from page.tsx for file size compliance (Epic 74)
 */

import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/product/PageHeader'

const DETAIL_BREADCRUMBS = [
  { label: 'Главная', href: '/' },
  { label: 'Назад к списку', href: '/supplies' },
  { label: 'Детали поставки' },
]

export function SupplyDetailRouteHeader({ busy = false }: { busy?: boolean }) {
  return (
    <PageHeader
      title="Детали поставки"
      description="Состав, документы и текущее состояние поставки."
      breadcrumbs={DETAIL_BREADCRUMBS}
      compact
      busy={busy}
    />
  )
}

export function SupplyDetailAnnouncements({
  message,
  channel: activeChannel,
}: {
  message: string
  channel: 0 | 1
}) {
  return ([0, 1] as const).map(channel => (
    <div
      key={channel}
      data-testid={`supply-detail-announcement-${channel}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="sr-only"
    >
      {activeChannel === channel ? message : ''}
    </div>
  ))
}

export function SupplyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <SupplyDetailRouteHeader busy />

      <div role="status" aria-label="Загрузка поставки" aria-busy="true" className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>

        <Skeleton className="h-24 w-full" />

        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}
