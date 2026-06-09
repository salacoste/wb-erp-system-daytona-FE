'use client'

/**
 * Search Analytics seller profile badge
 * Story 117.3-FE: surface seller trademark/name in the Search Analytics page header.
 *
 * Mirrors SidebarCabinetInfo.tsx (Story 84.1-FE) compact-badge semantics. Self-fetches
 * via useSellerInfo as an INDEPENDENT state machine (Multi-Source Orchestration Pattern 1):
 * a seller-info failure / unavailable / loading state never blanks the page header.
 * Defensive Frontend Principle: available===false → keep fallback name + INDICATE the anomaly.
 */

import { Store, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import { useSellerInfo } from '@/hooks/useSellerInfo'
import { SELLER_INFO_REASON_LABELS } from '@/types/cabinet'
import type { SellerInfoResponse } from '@/types/cabinet'

/**
 * Pure: resolve the header display name from seller-info.
 * Returns '' while loading (seller === undefined) so the caller renders a skeleton.
 * Mirrors SidebarCabinetInfo.tsx:32-36 branch semantics exactly.
 */
export function resolveSellerDisplayName(seller: SellerInfoResponse | undefined): string {
  if (seller === undefined) return '' // still loading → skeleton
  if (seller.available) return seller.tradeMark || seller.name || 'Кабинет'
  return 'Кабинет' // available === false → fallback name; warning rendered separately
}

export function SearchSellerBadge() {
  const cabinetId = useAuthStore(auth => auth.cabinetId)
  // Hook called before the !cabinetId early-return (rules-of-hooks). The fetch is
  // inert when cabinetId is empty: useSellerInfo guards with `enabled: !!cabinetId`.
  const { data: seller } = useSellerInfo(cabinetId ?? '')

  if (!cabinetId) return null

  const displayName = resolveSellerDisplayName(seller)
  const showWarning = seller?.available === false

  if (!displayName) {
    return (
      <div role="status" aria-busy="true" className="inline-flex">
        <span className="sr-only">Загрузка информации о продавце</span>
        <span className="h-4 w-28 animate-pulse rounded bg-gray-100" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <Store className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
      <span className="truncate">{displayName}</span>
      {showWarning && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex"
              aria-label="Предупреждение: нет данных о продавце от WB"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {(seller?.reason && SELLER_INFO_REASON_LABELS[seller.reason]) ?? 'Нет данных от WB'}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
