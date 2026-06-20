'use client'

/**
 * RequireJam — Jam subscription gating component
 * Story 71.3-FE: Shows blurred preview + upgrade CTA for insufficient tier
 */

import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useJamStatus } from '@/hooks/useJamStatus'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'
import { useAuthStore } from '@/stores/authStore'
import { isJamTierSufficient, JAM_TIER_LABELS } from '@/types/cabinet'
import type { JamTier } from '@/types/cabinet'
import { features } from '@/config/features'

const JAM_TIER_COLORS: Record<JamTier, string> = {
  none: 'bg-gray-100 text-gray-600',
  standard: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
  unknown: 'bg-amber-100 text-amber-700', // indicate an unrecognised backend tier
}

interface RequireJamProps {
  requiredTier: JamTier
  children: ReactNode
  /**
   * Safe static preview shown behind the upgrade overlay for insufficient tiers.
   * Do not pass data-fetching components here: the default preview is intentionally
   * non-sensitive and does not mount protected children.
   */
  previewContent?: ReactNode
}

function DefaultPreview() {
  return (
    <div className="space-y-4" data-testid="jam-default-preview">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export function RequireJam({ requiredTier, children, previewContent }: RequireJamProps) {
  const { cabinetId } = useAuthStore()
  const { data, isLoading, isError } = useJamStatus(cabinetId ?? '')
  const loadingDelayed = useDelayedLoadingState(isLoading || (!cabinetId && !data))

  // Loading → short skeleton placeholder (no flash of content or gate).
  if (isLoading && !loadingDelayed) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    )
  }

  // Slow/error/no data → fail closed with explicit state instead of indefinite shimmer.
  if (isError || !data) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
        Статус подписки WB Джем недоступен или загружается дольше обычного. Доступ закрыт до
        подтверждения подписки.
      </div>
    )
  }

  // Sufficient tier → render children normally
  if (isJamTierSufficient(data.tier, requiredTier)) return <>{children}</>

  // Insufficient tier → fail closed: do NOT mount protected children by default.
  // Mounting real children here can trigger protected API calls and leak business data
  // behind a blur. Only explicitly provided previewContent is rendered.
  return (
    <div className="relative">
      <div className="blur-[8px] opacity-40 pointer-events-none select-none" aria-hidden="true">
        {previewContent ?? <DefaultPreview />}
      </div>
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center"
        role="region"
        aria-label="Требуется подписка WB Джем"
      >
        <div className="text-center px-6">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-700 mb-2">Доступно с подпиской WB Джем</p>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-4 ${JAM_TIER_COLORS[requiredTier]}`}
          >
            {JAM_TIER_LABELS[requiredTier]}
          </span>
          <div>
            <Button variant="default" size="sm" asChild aria-label="Подробнее о подписке WB Джем">
              <a href={features.jamUrls.subscription} target="_blank" rel="noopener noreferrer">
                Подробнее о WB Джем
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
