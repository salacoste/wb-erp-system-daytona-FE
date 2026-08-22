'use client'

import { Check, X, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LiquidationScenario } from '@/types/liquidity'
import { formatCurrency, formatDiscount, getScenarioUrgencyLabel } from '@/lib/liquidity-utils'
import { cn, formatDecimal } from '@/lib/utils'

interface LiquidationScenarioCardProps {
  scenario: LiquidationScenario
  isRecommended: boolean
}

/**
 * Urgency label → semantic status class (Story 169.10).
 * getScenarioUrgencyLabel (lib) stays the single classification source;
 * its tiers map to tokens: aggressive=error, balanced=warning, conservative=success.
 */
const URGENCY_CLASS: Record<string, string> = {
  Агрессивный: 'text-status-error',
  Сбалансированный: 'text-status-warning',
  Консервативный: 'text-status-success',
}

/**
 * Single liquidation scenario card.
 * Extracted from LiquidationPlannerModal (200-line cap).
 *
 * Renders the REAL backend shape {discountPct, recovery, daysToClear} and
 * honours the Defensive Frontend Principle: backend-omitted fields
 * (new_price/expected_profit/is_profitable/velocity) render "—" / no badge,
 * never fabricated zeros or a false "Убыток".
 */
export function LiquidationScenarioCard({ scenario, isRecommended }: LiquidationScenarioCardProps) {
  const urgencyClass =
    URGENCY_CLASS[getScenarioUrgencyLabel(scenario.target_days)] ?? 'text-foreground'

  return (
    <Card className={cn('transition-all', isRecommended && 'ring-2 ring-ring shadow-md')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Color derives from the lib urgency LABEL (single classification
                source) — the hex getScenarioUrgencyColor is no longer used (169.10). */}
            <Clock className={cn('h-5 w-5', urgencyClass)} />
            <div>
              {/* >=999 = ∞ sentinel (mirror supply-planning-utils formatDaysUntilStockout):
                  backend daysToClear 999 means "won't clear" — render ∞, not "999 дней". */}
              <p className="font-medium">
                {scenario.target_days >= 999
                  ? 'Продать за ∞ дней'
                  : `Продать за ${scenario.target_days} дней`}
              </p>
              <p className="text-xs text-muted-foreground">
                {getScenarioUrgencyLabel(scenario.target_days)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isRecommended && (
              <Badge
                variant="secondary"
                className="border-status-information/30 bg-status-information/15 text-status-information"
              >
                Рекомендуем
              </Badge>
            )}
            {/* Backend omits is_profitable → null = unknown. Render NO badge
                (Defensive Frontend Principle: never show a false "Убыток"). */}
            {scenario.is_profitable != null &&
              (scenario.is_profitable ? (
                <Badge
                  variant="secondary"
                  className="border-status-success/30 bg-status-success/15 text-status-success"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Прибыльно
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="border-status-error/30 bg-status-error/15 text-status-error"
                >
                  <X className="h-3 w-3 mr-1" />
                  Убыток
                </Badge>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Скидка</p>
            <p className="text-lg font-bold text-financial-negative">
              {formatDiscount(scenario.suggested_discount_pct)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Новая цена</p>
            {/* Backend omits new_price → '—' (never a misleading "0 ₽"). */}
            <p className="text-lg font-bold tabular-nums">
              {scenario.new_price != null && scenario.new_price > 0
                ? formatCurrency(scenario.new_price)
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Выручка</p>
            {/* recovery (RUB) from backend maps here; '—' when omitted. */}
            <p className="text-lg font-bold tabular-nums">
              {scenario.expected_revenue != null ? formatCurrency(scenario.expected_revenue) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Прибыль</p>
            {/* Backend omits profit → null = unknown. Neutral color, '—'. */}
            <p
              className={cn(
                'text-lg font-bold tabular-nums',
                scenario.expected_profit == null
                  ? ''
                  : scenario.expected_profit >= 0
                    ? 'text-financial-positive'
                    : 'text-financial-negative'
              )}
            >
              {scenario.expected_profit != null ? formatCurrency(scenario.expected_profit) : '—'}
            </p>
          </div>
        </div>

        {/* Backend omits velocity → render "—" (no fabricated 0.0). */}
        <div className="mt-4 text-xs text-muted-foreground">
          {scenario.required_velocity == null ? (
            <>Требуемая скорость: —</>
          ) : (
            <>
              Требуемая скорость: {formatDecimal(scenario.required_velocity)} шт./день
              {scenario.velocity_multiplier != null && (
                <> (×{formatDecimal(scenario.velocity_multiplier)} от текущей)</>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
