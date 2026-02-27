/** TaxCard -- Story 66.5-FE: Backend tax metrics display (Epic 72 / Task-50) */
'use client'

import { Receipt, Info } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { StandardMetricSkeleton } from './MetricCardStates'
import type { TaxMetrics } from '@/types/finance-summary'

export interface TaxCardProps {
  taxMetrics: TaxMetrics | null
  previousTaxMetrics: TaxMetrics | null
  isLoading: boolean
  className?: string
}

/** Human-readable tax system label */
function getTaxLabel(system: string | null): string {
  switch (system) {
    case 'usn6':
      return 'УСН 6%'
    case 'usn15':
      return 'УСН 15%'
    case 'manual':
      return 'Ручная ставка'
    default:
      return 'Не указана'
  }
}

/** Nominal rate for a tax system (used to avoid duplicate rate display) */
function getNominalRate(system: string | null): number | null {
  switch (system) {
    case 'usn6':
      return 6
    case 'usn15':
      return 15
    default:
      return null
  }
}

/** Format effective tax rate for display */
function formatRate(rate: number | null): string {
  if (rate == null) return '—'
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(rate) + ' %'
  )
}

export function TaxCard({
  taxMetrics,
  previousTaxMetrics,
  isLoading,
  className,
}: TaxCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />

  const hasData = taxMetrics != null && taxMetrics.tax_amount != null
  const displayValue = hasData ? formatCurrency(taxMetrics.tax_amount!) : '—'

  // Inverted comparison: higher tax = negative (bad)
  const comparison =
    taxMetrics?.tax_amount != null && previousTaxMetrics?.tax_amount != null
      ? calculateComparison(taxMetrics.tax_amount, previousTaxMetrics.tax_amount, true)
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Налоги: ${hasData ? formatCurrency(taxMetrics!.tax_amount!) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <Header />
        <Body taxMetrics={taxMetrics} hasData={hasData} displayValue={displayValue} />
        {comparison && (
          <div className="mt-1 flex items-center gap-2">
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
            <span className="text-xs text-muted-foreground">
              vs {formatCurrency(previousTaxMetrics!.tax_amount!)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Header(): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-orange-500" aria-hidden="true" />
        <span className="text-sm font-medium text-muted-foreground">Налоги</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="text-muted-foreground hover:text-foreground"
            aria-label="Подробнее о налогах"
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent size="lg">
          <p style={{ whiteSpace: 'pre-line' }}>
            {
              'Расчётная сумма налога за выбранный период.\nРассчитывается на основе выбранной системы налогообложения в настройках:\n• УСН 6% — от выручки (sale_gross)\n• УСН 15% — от прибыли (доходы минус расходы)\n• Ручная ставка — произвольный % от выручки\nДля УСН 15% применяется правило минимального налога: если расчётный налог < 1% от выручки, начисляется 1%.\nПлательщики НДС видят дополнительно: НДС от продаж, НДС к уплате, выручку без НДС.\nСравнение с прошлым периодом инвертировано: рост налога = негативная тенденция (красный).\nНастройка: Настройки → Налоги.\nИсточник: расчёт на фронтенде из finance-summary + настройки пользователя.'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function Body({
  taxMetrics,
  hasData,
  displayValue,
}: {
  taxMetrics: TaxMetrics | null
  hasData: boolean
  displayValue: string
}): React.ReactElement {
  if (taxMetrics === null) {
    return (
      <div className="mt-1">
        <Link href="/settings/tax" className="text-sm text-primary hover:underline">
          Настройте систему
        </Link>
      </div>
    )
  }

  // Only show separate effective rate when it differs from the system's nominal rate
  const nominalRate = getNominalRate(taxMetrics.tax_system)
  const showEffectiveRate =
    hasData &&
    taxMetrics.effective_tax_rate != null &&
    taxMetrics.effective_tax_rate !== nominalRate

  return (
    <>
      <div className="mt-1">
        <span className="text-xl font-bold text-orange-600" data-testid="metric-value">
          {displayValue}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{getTaxLabel(taxMetrics.tax_system)}</span>
        {showEffectiveRate && (
          <span className="text-xs text-gray-400">{formatRate(taxMetrics.effective_tax_rate)}</span>
        )}
        {taxMetrics.is_minimum_rule && <MinimumRuleBadge />}
        {taxMetrics.vat_payer && taxMetrics.vat_rate != null && (
          <VatBadge taxMetrics={taxMetrics} />
        )}
      </div>
    </>
  )
}

function MinimumRuleBadge(): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
          Мин. 1%
        </span>
      </TooltipTrigger>
      <TooltipContent size="sm">
        <p>Применено правило минимального налога 1% от выручки (УСН 15%)</p>
      </TooltipContent>
    </Tooltip>
  )
}

function VatBadge({ taxMetrics }: { taxMetrics: TaxMetrics }): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
          НДС {taxMetrics.vat_rate}%
        </span>
      </TooltipTrigger>
      <TooltipContent size="sm">
        <p>
          НДС от продаж:{' '}
          {taxMetrics.vat_output != null ? formatCurrency(taxMetrics.vat_output) : '—'}
        </p>
        <p>
          НДС к уплате:{' '}
          {taxMetrics.vat_payable != null ? formatCurrency(taxMetrics.vat_payable) : '—'}
        </p>
        <p>
          Выручка без НДС:{' '}
          {taxMetrics.revenue_excl_vat != null ? formatCurrency(taxMetrics.revenue_excl_vat) : '—'}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
