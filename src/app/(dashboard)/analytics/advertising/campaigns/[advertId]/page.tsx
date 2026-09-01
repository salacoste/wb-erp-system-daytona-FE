'use client'

/**
 * Campaign Detail Page — bid recommendations
 * Story 86.1: /analytics/advertising/campaigns/[advertId]
 */

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import { BidRecommendationsCard } from '@/components/custom/advertising/BidRecommendationsCard'

export default function CampaignDetailPage() {
  const params = useParams<{ advertId: string }>()
  const searchParams = useSearchParams()
  const cabinetId = useAuthStore(state => state.cabinetId)
  const advertId = Number(params.advertId)
  const nmIdParam = searchParams.get('nmId')
  const parsedNmId = nmIdParam !== null ? Number(nmIdParam) : undefined
  const nmId =
    parsedNmId !== undefined && Number.isSafeInteger(parsedNmId) && parsedNmId > 0
      ? parsedNmId
      : undefined
  const hasInvalidNmId = nmIdParam !== null && nmId === undefined

  if (!Number.isFinite(advertId)) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert variant="destructive">
          <AlertDescription>Некорректный ID кампании</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (hasInvalidNmId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <BackLink />
          <h1 className="text-2xl font-semibold">Кампания #{advertId}</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Некорректный параметр товара. Вернитесь к рекламной аналитике и выберите товар снова.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!cabinetId) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackLink />
        <h1 className="text-2xl font-semibold">Кампания #{advertId}</h1>
      </div>
      <BidRecommendationsCard cabinetId={cabinetId} advertId={advertId} nmId={nmId} />
    </div>
  )
}

/** Story 170.2: plain semantic Link (supplies/[id] canon) — no nested Button. */
function BackLink() {
  return (
    <Link
      href={ROUTES.ANALYTICS.ADVERTISING}
      className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
      Назад к рекламной аналитике
    </Link>
  )
}
