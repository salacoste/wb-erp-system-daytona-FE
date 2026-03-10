/** TaxCardBadges -- Sub-components for TaxCard (Epic 72 / Task-50) */
'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import type { TaxMetrics } from '@/types/finance-summary'

/** Human-readable tax system label */
export function getTaxLabel(system: string | null): string {
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
export function getNominalRate(system: string | null): number | null {
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
export function formatRate(rate: number | null): string {
  if (rate == null) return '—'
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(rate) + ' %'
  )
}

export function MinimumRuleBadge(): React.ReactElement {
  return (
    <span
      className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700"
      title="Применено правило минимального налога 1% от выручки (УСН 15%)"
    >
      Мин. 1%
    </span>
  )
}

export function PreliminaryBadge({
  dc,
}: {
  dc?: TaxMetrics['data_completeness']
}): React.ReactElement {
  const missing = [
    !dc?.hasLogistics && 'логистика',
    !dc?.hasStorage && 'хранение',
    !dc?.hasAcceptance && 'приёмка',
    !dc?.hasPenalties && 'штрафы',
  ].filter(Boolean)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
          Предварительно
        </span>
      </TooltipTrigger>
      <TooltipContent size="sm">
        <p className="font-medium">Расчёт на основе ежедневных данных</p>
        {missing.length > 0 && (
          <p className="mt-0.5 text-muted-foreground">Не учтено: {missing.join(', ')}</p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export function VatBadge({ taxMetrics }: { taxMetrics: TaxMetrics }): React.ReactElement {
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
