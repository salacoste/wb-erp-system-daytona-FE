'use client'

import { Check, X, Clock, TrendingDown, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LiquidityItem } from '@/types/liquidity'
import {
  formatCurrency,
  formatDiscount,
  getScenarioUrgencyLabel,
  getScenarioUrgencyColor,
  getRecommendedScenario,
} from '@/lib/liquidity-utils'
import { cn } from '@/lib/utils'

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
export function LiquidationPlannerModal({
  item,
  open,
  onClose,
}: LiquidationPlannerModalProps) {
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
              {scenarios.map((scenario) => {
                const isRecommended = recommended?.target_days === scenario.target_days
                const urgencyColor = getScenarioUrgencyColor(scenario.target_days)

                return (
                  <Card
                    key={scenario.target_days}
                    className={cn(
                      'transition-all',
                      isRecommended && 'ring-2 ring-blue-500 shadow-md'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock
                            className="h-5 w-5"
                            style={{ color: urgencyColor }}
                          />
                          <div>
                            <p className="font-medium">
                              Продать за {scenario.target_days} дней
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getScenarioUrgencyLabel(scenario.target_days)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isRecommended && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Рекомендуем
                            </Badge>
                          )}
                          {scenario.is_profitable ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Прибыльно
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              <X className="h-3 w-3 mr-1" />
                              Убыток
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Скидка</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatDiscount(scenario.suggested_discount_pct)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Новая цена</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(scenario.new_price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Выручка</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(scenario.expected_revenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Прибыль</p>
                          <p className={cn(
                            'text-lg font-bold',
                            scenario.expected_profit >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {formatCurrency(scenario.expected_profit)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-muted-foreground">
                        Требуемая скорость: {scenario.required_velocity.toFixed(1)} шт./день
                        (×{scenario.velocity_multiplier.toFixed(1)} от текущей)
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
