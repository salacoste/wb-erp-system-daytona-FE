'use client'

/**
 * Campaign Detail Page — bid recommendations
 * Story 86.1: /analytics/advertising/campaigns/[advertId]
 */

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import { BidRecommendationsCard } from '@/components/custom/advertising/BidRecommendationsCard'

export default function CampaignDetailPage() {
  const params = useParams<{ advertId: string }>()
  const cabinetId = useAuthStore(state => state.cabinetId)
  const advertId = Number(params.advertId)

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
      <BidRecommendationsCard cabinetId={cabinetId} advertId={advertId} />
    </div>
  )
}

function BackLink() {
  return (
    <Link href={ROUTES.ANALYTICS.ADVERTISING}>
      <Button variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к рекламной аналитике
      </Button>
    </Link>
  )
}
