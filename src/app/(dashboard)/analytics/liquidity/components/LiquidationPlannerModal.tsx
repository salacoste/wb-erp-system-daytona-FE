'use client'

import { TrendingDown, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { LiquidityItem } from '@/types/liquidity'
import { formatCurrency, formatDiscount, getRecommendedScenario } from '@/lib/liquidity-utils'
import { LiquidationScenarioCard } from './LiquidationScenarioCard'

interface LiquidationPlannerModalProps {
  item: LiquidityItem
  open: boolean
  onClose: () => void
}

/**
 * Liquidation Planner Modal
 * Shows 3 scenarios with discount recommendations
 * Story 7.3: Liquidation Planner
 */
export function LiquidationPlannerModal({ item, open, onClose }: LiquidationPlannerModalProps) {
  const scenarios = item.liquidation_scenarios || []
  const recommended = getRecommendedScenario(scenarios)

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Планировщик ликвидации
          </DialogTitle>
          <DialogDescription>
            {item.product_name} · SKU: {item.sku_id}
          </DialogDescription>
        </DialogHeader>

        {/* Current State Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Остаток</p>
            <p className="font-medium">{item.current_stock_qty} шт.</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Стоимость</p>
            <p className="font-medium">{formatCurrency(item.stock_value)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Текущая цена</p>
            {/* Validation F-5: backend omits current_price → mapper sets 0 as a
                "no price" sentinel. Render '—' for unknown (consistent with
                LiquidityExpandedRow:30), never a misleading "0 ₽". */}
            <p className="font-medium">
              {item.current_price > 0 ? formatCurrency(item.current_price) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Оборот сейчас</p>
            <p className="font-medium text-red-600">{item.turnover_days} дней</p>
          </div>
        </div>

        {/* Scenarios */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Сценарии ликвидации</h4>

          {scenarios.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Нет доступных сценариев ликвидации
            </p>
          ) : (
            <div className="grid gap-4">
              {scenarios.map(scenario => (
                <LiquidationScenarioCard
                  key={scenario.suggested_discount_pct}
                  scenario={scenario}
                  isRecommended={
                    recommended?.suggested_discount_pct === scenario.suggested_discount_pct
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Скидки рассчитаны на основе эластичности спроса
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
            {recommended && (
              <Button>
                <DollarSign className="h-4 w-4 mr-1" />
                Применить {formatDiscount(recommended.suggested_discount_pct)}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
