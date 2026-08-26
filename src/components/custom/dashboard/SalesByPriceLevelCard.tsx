/**
 * SalesByPriceLevelCard (TZ-3) — consolidates the 4 near-identical "revenue by price
 * level" simple cards (Заказы РРЦ, Заказы со скидкой, Выкупы, Продажи розница) into one
 * card with labelled sub-rows. Each row's inline label + clarifier distinguishes the
 * price level on its own (no tooltip needed to tell them apart — AC). A single tooltip
 * on the header preserves the WB price-chain explanation formerly split across 4 cards.
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-3)
 */

'use client'

import { TrendingUp, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { buildSalesPriceLevelRows, type SalesPriceLevelRow } from './sales-price-level'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

const PRICE_CHAIN_TOOLTIP =
  'Две ценовые шкалы WB:\n' +
  'РРЦ → скидка продавца → Цена на карточке (база комиссии WB).\n' +
  'Розничный уровень: sales_gross − returns_gross = Продажи (розница).\n' +
  'Уровень поставщика: × (1 − комиссия WB) = Выкупы.\n' +
  '⚠ Продажи (розница) ≠ Выкупы − Возвраты — разные ценовые уровни.\n' +
  'Источники: Заказы по РРЦ/на карточке — данные о заказах WB (FBO+FBS); ' +
  'Выкупы/Продажи (розница) — еженедельный финансовый отчёт WB.'

export function SalesByPriceLevelCard(props: DashboardMetricsGridProps): React.ReactElement {
  const rows = buildSalesPriceLevelRows(props)
  return (
    <Card
      className="transition-shadow hover:shadow-md"
      role="article"
      aria-label="Продажи по ценовым уровням"
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-status-success" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">
              Продажи по ценовым уровням
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о ценовых уровнях"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>{PRICE_CHAIN_TOOLTIP}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <ul className="mt-2 space-y-2">
          {rows.map(row => (
            <SalesPriceLevelRowItem key={row.id} row={row} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function SalesPriceLevelRowItem({ row }: { row: SalesPriceLevelRow }): React.ReactElement {
  const value = row.current != null ? formatCurrency(row.current) : '—'
  const comparison =
    row.current != null && row.previous != null && row.previous !== 0
      ? calculateComparison(row.current, row.previous, false)
      : null
  return (
    <li className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{row.label}</span>
        <span className={cn('text-sm font-bold tabular-nums', row.valueColor)}>{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{row.clarifier}</span>
      {comparison && (
        <div className="flex items-center gap-1.5">
          <TrendIndicator direction={comparison.direction} size="sm" />
          <ComparisonBadge
            percentageChange={comparison.percentageChange}
            direction={comparison.direction}
            absoluteDifference={comparison.formattedDifference}
          />
        </div>
      )}
    </li>
  )
}
