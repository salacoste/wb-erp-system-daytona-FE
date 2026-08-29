'use client'

import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useJamStatus } from '@/hooks/useJamStatus'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'
import { JAM_TIER_LABELS } from '@/types/cabinet'
import type { JamTier } from '@/types/cabinet'
import { jamUrls } from '@/config/features'
import { cn } from '@/lib/utils'

const JAM_TIER_STYLES: Record<JamTier, string> = {
  none: 'border-border bg-muted text-muted-foreground',
  standard: 'border-status-information/30 bg-status-information/10 text-status-information',
  advanced: 'border-status-success/30 bg-status-success/10 text-status-success',
  unknown: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
}

/**
 * Standalone Jam subscription badge with upgrade CTA.
 * Shows current tier as a colored badge and a "Повысить" button
 * for non-advanced tiers linking to the WB Jam subscription page.
 */
export function JamStatusBadge({ cabinetId }: { cabinetId: string }) {
  const { data: jam, isLoading } = useJamStatus(cabinetId)
  const isDelayed = useDelayedLoadingState(isLoading)

  if (isLoading && !isDelayed) {
    return (
      <div
        className="flex flex-wrap items-center gap-3"
        role="status"
        aria-label="Загрузка статуса Джем"
        aria-busy="true"
      >
        <span className="sr-only">Загружаем статус Джем</span>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    )
  }

  if (isLoading && isDelayed) {
    return (
      <span role="status" className="text-sm text-muted-foreground">
        Статус Джем загружается дольше обычного
      </span>
    )
  }

  if (!jam) {
    return (
      <span role="status" className="text-sm text-muted-foreground">
        Статус Джем сейчас недоступен
      </span>
    )
  }

  const tier = jam.tier
  const showUpgrade = jam.available && (tier === 'none' || tier === 'standard')

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="outline" className={cn('text-sm', JAM_TIER_STYLES[tier])}>
        {JAM_TIER_LABELS[tier]}
      </Badge>
      {showUpgrade && (
        <Button variant="outline" size="sm" asChild>
          <a href={jamUrls.subscription} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            Повысить
          </a>
        </Button>
      )}
    </div>
  )
}
