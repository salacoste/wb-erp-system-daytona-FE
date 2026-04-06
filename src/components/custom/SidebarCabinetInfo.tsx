'use client'

import Link from 'next/link'
import { Store, Sparkles, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import { useSellerInfo } from '@/hooks/useSellerInfo'
import { useJamStatus } from '@/hooks/useJamStatus'
import { JAM_TIER_LABELS, SELLER_INFO_REASON_LABELS } from '@/types/cabinet'
import type { JamTier } from '@/types/cabinet'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const JAM_TIER_COLORS: Record<JamTier, string> = {
  none: 'bg-gray-100 text-gray-600',
  standard: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
}

/**
 * Compact cabinet info block for sidebar.
 * Shows seller trademark + Jam subscription badge.
 * Story 84.1: handles `available` field from backend graceful responses.
 */
export function SidebarCabinetInfo() {
  const cabinetId = useAuthStore(state => state.cabinetId)
  const { data: seller } = useSellerInfo(cabinetId ?? '')
  const { data: jam } = useJamStatus(cabinetId ?? '')

  if (!cabinetId) return null

  const displayName = seller?.available
    ? seller.tradeMark || seller.name || 'Кабинет'
    : seller !== undefined
      ? 'Кабинет'
      : '' // empty = still loading → show skeleton
  const showWarning = seller?.available === false
  const showJamBadge = jam && jam.tier !== 'none'

  return (
    <Link
      href={ROUTES.SETTINGS.CABINET}
      className="block border-b px-4 py-3 transition-colors hover:bg-accent/30"
    >
      {displayName ? (
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Store className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          <span className="truncate">{displayName}</span>
          {showWarning && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                {(seller?.reason && SELLER_INFO_REASON_LABELS[seller.reason]) ?? 'Нет данных от WB'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ) : (
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
      )}
      {showJamBadge ? (
        <div className="mt-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-gray-400" />
          <span
            className={cn(
              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold',
              JAM_TIER_COLORS[jam.tier]
            )}
          >
            {JAM_TIER_LABELS[jam.tier]}
          </span>
        </div>
      ) : null}
    </Link>
  )
}
