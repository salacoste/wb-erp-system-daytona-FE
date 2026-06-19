'use client'

/**
 * TariffSystemBadge Component
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Visual indicator showing which tariff system is active:
 * - INVENTORY (📊): Current actual costs (gray badge)
 * - SUPPLY (📅): Planning rates for future delivery (blue badge)
 *
 * @see docs/request-backend/108-two-tariff-systems-guide.md
 */

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  getTariffSystemLabel,
  getTariffSystemBadgeVariant,
  type TariffSystem,
} from '@/lib/tariff-system-utils'

export interface TariffSystemBadgeProps {
  /** Active tariff system */
  system: TariffSystem
  /** Delivery date for display (for SUPPLY system) */
  date: string | null
  /** Show tooltip with explanation */
  showTooltip?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Badge indicating which tariff system is currently active.
 *
 * - INVENTORY (gray): "Текущие тарифы (Остатки)" - actual costs for today
 * - SUPPLY (blue): "Тарифы на {date}" - planning rates for future delivery
 */
export function TariffSystemBadge({
  system,
  date,
  showTooltip = true,
  className,
}: TariffSystemBadgeProps) {
  const label = getTariffSystemLabel(system, date)
  const variant = getTariffSystemBadgeVariant(system)
  const icon = system === 'inventory' ? '📊' : '📅'

  const badge = (
    <Badge
      variant={variant}
      className={className}
      aria-label={`Используемая система тарифов: ${label}`}
    >
      <span className="mr-1" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  const tooltipText =
    system === 'inventory'
      ? 'Используются текущие тарифы склада (фактические расходы на сегодня)'
      : 'Используются тарифы планирования поставки (могут отличаться от текущих)'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
