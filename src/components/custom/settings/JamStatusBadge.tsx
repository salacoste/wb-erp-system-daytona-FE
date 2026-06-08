'use client'

import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useJamStatus } from '@/hooks/useJamStatus'
import { JAM_TIER_LABELS, JAM_TIER_LEVEL } from '@/types/cabinet'
import type { JamTier } from '@/types/cabinet'
import { jamUrls } from '@/config/features'
import { cn } from '@/lib/utils'

const JAM_TIER_STYLES: Record<JamTier, string> = {
  none: 'bg-gray-100 text-gray-700 border-gray-200',
  standard: 'bg-blue-50 text-blue-700 border-blue-200',
  advanced: 'bg-purple-50 text-purple-700 border-purple-200',
  unknown: 'bg-amber-50 text-amber-700 border-amber-200',
}

/**
 * Standalone Jam subscription badge with upgrade CTA.
 * Shows current tier as a colored badge and a "Повысить" button
 * for non-advanced tiers linking to the WB Jam subscription page.
 */
export function JamStatusBadge({ cabinetId }: { cabinetId: string }) {
  const { data: jam, isLoading } = useJamStatus(cabinetId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    )
  }

  if (!jam) return null

  const tier = jam.tier
  const showUpgrade =
    jam.available && tier !== 'advanced' && JAM_TIER_LEVEL[tier] < JAM_TIER_LEVEL['advanced']

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className={cn('text-sm', JAM_TIER_STYLES[tier])}>
        {JAM_TIER_LABELS[tier]}
      </Badge>
      {showUpgrade && (
        <Button variant="outline" size="sm" asChild>
          <a href={jamUrls.subscription} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Повысить
          </a>
        </Button>
      )}
    </div>
  )
}
