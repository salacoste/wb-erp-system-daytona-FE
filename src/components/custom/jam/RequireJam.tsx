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

// Wave-4 boundary sweep (debt/p2-w4-component-families): semantic tokens. These chips
// render over the gate overlay (bg-popover/60 below) on the page background — measured
// over stack background > popover/60 (light 4.98-7.87 / dark 6.77-12.13, all AA;
// warning/10 = 4.24 light FAIL -> /5 = 4.52). Same map as SidebarCabinetInfo JAM_TIER_COLORS.
const JAM_TIER_COLORS: Record<JamTier, string> = {
  none: 'bg-muted text-muted-foreground',
  standard: 'bg-status-information/10 text-status-information',
  advanced: 'bg-status-pending/10 text-status-pending',
  unknown: 'bg-status-warning/5 text-status-warning', // indicate an unrecognised backend tier
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
    // Wave-4: fg-on-tint warning block on the page background (legacy yellow-900 text was
    // already dark-on-tint semantics; warn-text on warn/10 = 4.24 light FAIL -> foreground,
    // 14.18/15.89). Valence carried by tint + border.
    return (
      <div className="rounded-lg border border-status-warning/20 bg-status-warning/10 p-4 text-sm text-foreground">
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
      {/* Wave-4 layer remedy: bg-white/60 -> bg-popover/60 (theme-aware glass). The literal
          white overlay breaks theme-aware tokens in dark mode (foreground on white/60 dark =
          2.60); popover/60 keeps the light look identical and gives dark mode a dark glass
          (popover = tooltip/popover surface token). Measured: fg 16.10/17.98,
          muted-foreground 7.81/9.99 over background > popover/60. Scope (pass-2):
          attested for the default Skeleton preview (bg-primary/10 barely darkens the
          base); a future custom previewContent with dense dark content is NOT covered
          (illustrative worst-case probe, not a token stack: dark chips >=5.6, light
          standard chip ~4.4 — re-measure before shipping custom previews). */}
      <div
        className="absolute inset-0 bg-popover/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center"
        role="region"
        aria-label="Требуется подписка WB Джем"
      >
        <div className="text-center px-6">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground mb-2">Доступно с подпиской WB Джем</p>
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
