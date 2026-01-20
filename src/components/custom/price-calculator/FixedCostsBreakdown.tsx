'use client'

import { formatCurrency } from '@/lib/utils'
import { calculateCostPercentage } from '@/lib/two-level-pricing'
import type { TwoLevelFixedCosts, FulfillmentType } from '@/types/price-calculator'

/**
 * Props for FixedCostsBreakdown component
 */
export interface FixedCostsBreakdownProps {
  /** Fixed costs breakdown data */
  costs: TwoLevelFixedCosts
  /** Fulfillment type to determine which fields to show */
  fulfillmentType: FulfillmentType
  /** Recommended price for percentage calculation */
  recommendedPrice: number
}

/**
 * Fixed costs breakdown section
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Shows all fixed costs that don't depend on selling price:
 * - COGS (always)
 * - Forward logistics (always)
 * - Reverse logistics effective (always)
 * - Storage (FBO only)
 * - Acceptance (FBO only)
 *
 * @example
 * <FixedCostsBreakdown
 *   costs={fixedCosts}
 *   fulfillmentType="FBO"
 *   recommendedPrice={1217.39}
 * />
 */
export function FixedCostsBreakdown({
  costs,
  fulfillmentType,
  recommendedPrice,
}: FixedCostsBreakdownProps) {
  const isFbo = fulfillmentType === 'FBO'

  // Calculate each cost as percentage of recommended price
  const cogsPct = calculateCostPercentage(costs.cogs, recommendedPrice)
  const logisticsFwdPct = calculateCostPercentage(costs.logisticsForward, recommendedPrice)
  const logisticsRevPct = calculateCostPercentage(costs.logisticsReverseEffective, recommendedPrice)
  const storagePct = calculateCostPercentage(costs.storage, recommendedPrice)
  const acceptancePct = calculateCostPercentage(costs.acceptance, recommendedPrice)
  const totalPct = calculateCostPercentage(costs.total, recommendedPrice)

  return (
    <div className="space-y-2" data-testid="fixed-costs-breakdown">
      {/* Section Header */}
      <div className="flex justify-between font-medium text-sm">
        <span>ФИКСИРОВАННЫЕ ЗАТРАТЫ</span>
        <span>{formatCurrency(costs.total)}</span>
      </div>

      {/* Cost Line Items */}
      <div className="space-y-1 text-sm text-muted-foreground">
        {/* COGS */}
        <div className="flex justify-between">
          <span>├─ Себестоимость (COGS)</span>
          <span className="flex gap-4">
            <span className="w-16 text-right">{formatCurrency(costs.cogs)}</span>
            <span className="w-12 text-right text-xs">{cogsPct.toFixed(1)}%</span>
          </span>
        </div>

        {/* Forward Logistics */}
        <div className="flex justify-between">
          <span>├─ Логистика (прямая)</span>
          <span className="flex gap-4">
            <span className="w-16 text-right">{formatCurrency(costs.logisticsForward)}</span>
            <span className="w-12 text-right text-xs">{logisticsFwdPct.toFixed(1)}%</span>
          </span>
        </div>

        {/* Reverse Logistics Effective */}
        <div className="flex justify-between">
          <span>{isFbo ? '├─' : '└─'} Логистика (возвратная эфф.)</span>
          <span className="flex gap-4">
            <span className="w-16 text-right">
              {formatCurrency(costs.logisticsReverseEffective)}
            </span>
            <span className="w-12 text-right text-xs">{logisticsRevPct.toFixed(1)}%</span>
          </span>
        </div>

        {/* FBO-only: Storage */}
        {isFbo && (
          <div className="flex justify-between">
            <span>├─ Хранение</span>
            <span className="flex gap-4">
              <span className="w-16 text-right">{formatCurrency(costs.storage)}</span>
              <span className="w-12 text-right text-xs">{storagePct.toFixed(1)}%</span>
            </span>
          </div>
        )}

        {/* FBO-only: Acceptance */}
        {isFbo && (
          <div className="flex justify-between">
            <span>└─ Приёмка</span>
            <span className="flex gap-4">
              <span className="w-16 text-right">{formatCurrency(costs.acceptance)}</span>
              <span className="w-12 text-right text-xs">{acceptancePct.toFixed(1)}%</span>
            </span>
          </div>
        )}
      </div>

      {/* Subtotal */}
      <div className="flex justify-between pt-1 border-t border-dashed text-sm font-medium">
        <span>Итого фиксированные</span>
        <span className="flex gap-4">
          <span className="w-16 text-right">{formatCurrency(costs.total)}</span>
          <span className="w-12 text-right text-xs">{totalPct.toFixed(1)}%</span>
        </span>
      </div>
    </div>
  )
}
