'use client'

import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { StockoutRisk, SupplyPlanningSummary } from '@/types/supply-planning'
import { STOCKOUT_RISK_CONFIG, formatReorderValue } from '@/lib/supply-planning-utils'
import { LUCIDE_ICONS, getCardStyles } from './supply-risk-card-styles'

/**
 * Supply Risk Cards Component
 * Story 6.2: Page Structure & Risk Dashboard
 * UX Specs by Sally (2025-12-12)
 *
 * Displays 5 status cards showing SKU counts by stockout risk level.
 * Cards are clickable to filter the table below.
 */

interface SupplyRiskCardsProps {
  summary: SupplyPlanningSummary
  activeFilter: StockoutRisk | null
  onCardClick: (status: StockoutRisk) => void
}

interface RiskCardData {
  status: StockoutRisk
  count: number
  potentialLoss?: number
}

export function SupplyRiskCards({ summary, activeFilter, onCardClick }: SupplyRiskCardsProps) {
  // Build card data from summary
  const cards: RiskCardData[] = [
    {
      status: 'out_of_stock',
      count: summary.out_of_stock_count,
      // No potential loss for out_of_stock - already lost
    },
    {
      status: 'critical',
      count: summary.stockout_critical,
      potentialLoss: summary.total_reorder_value * 0.3, // Estimate 30% critical
    },
    {
      status: 'warning',
      count: summary.stockout_warning,
      potentialLoss: summary.total_reorder_value * 0.25, // Estimate 25% warning
    },
    {
      status: 'low',
      count: summary.stockout_low,
      potentialLoss: summary.total_reorder_value * 0.2, // Estimate 20% low
    },
    {
      status: 'healthy',
      count: summary.healthy_stock,
      // No potential loss for healthy stock
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(card => (
        <RiskCard
          key={card.status}
          status={card.status}
          count={card.count}
          potentialLoss={card.potentialLoss}
          isActive={activeFilter === card.status}
          onClick={() => onCardClick(card.status)}
        />
      ))}
    </div>
  )
}

interface RiskCardProps {
  status: StockoutRisk
  count: number
  potentialLoss?: number
  isActive: boolean
  onClick: () => void
}

function RiskCard({ status, count, potentialLoss, isActive, onClick }: RiskCardProps) {
  const config = STOCKOUT_RISK_CONFIG[status]
  const IconComponent = LUCIDE_ICONS[config.lucideIcon as keyof typeof LUCIDE_ICONS]

  // Card styling based on status and active state
  const cardStyles = getCardStyles(status, isActive)

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:scale-[1.02]',
        'min-h-[140px]',
        cardStyles.card,
        isActive && 'ring-2 ring-offset-2'
      )}
      style={
        {
          borderColor: isActive ? config.color : undefined,
          // Tailwind ring color via CSS custom property
          '--tw-ring-color': isActive ? config.color : undefined,
        } as React.CSSProperties
      }
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header: Icon + Label */}
        <div className="flex items-center gap-2 mb-3">
          <IconComponent className={cn('h-5 w-5', cardStyles.icon)} />
          <span className={cn('text-sm font-medium', cardStyles.label)}>{config.label}</span>
        </div>

        {/* Count */}
        <div className={cn('text-3xl font-bold mb-1', cardStyles.count)}>
          {count} <span className="text-lg font-normal">SKU</span>
        </div>

        {/* Potential Loss (if applicable) */}
        {potentialLoss !== undefined && potentialLoss > 0 && (
          <div className={cn('text-sm', cardStyles.loss)}>
            Потери: {formatReorderValue(potentialLoss)}
          </div>
        )}

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="h-4 w-4 text-current opacity-60" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
