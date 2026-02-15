/**
 * SubcategoryTooltip - Story 65.16
 * Tooltip showing dual-value subcategories: absolute value and percentage of parent total.
 *
 * Each row displays: label, formatted value / percentage
 * When parentTotal=0, percentage shows "---" dash.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md
 */

'use client'

import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'

export interface SubcategoryItem {
  label: string
  value: number
}

export interface SubcategoryTooltipProps {
  subcategories: SubcategoryItem[]
  parentTotal: number
  formatValue?: (value: number) => string
}

/** Format percentage with exactly 2 decimal places (Russian locale) */
function formatPct(value: number, total: number): string {
  if (total === 0) return '\u2014'
  const pct = (value / total) * 100
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pct) + '\u00A0%'
  )
}

/**
 * Renders a tooltip trigger (info icon button) that shows subcategory
 * breakdown rows on hover or keyboard focus.
 *
 * @example
 * <SubcategoryTooltip
 *   subcategories={[{ label: 'Комиссия', value: 15000 }]}
 *   parentTotal={20000}
 * />
 */
export function SubcategoryTooltip({
  subcategories,
  parentTotal,
  formatValue = formatCurrency,
}: SubcategoryTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="text-muted-foreground hover:text-foreground"
          aria-label="Показать подкатегории"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent size="lg">
        <div className="flex flex-col gap-1.5">
          {subcategories.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-300 shrink-0">{item.label}</span>
              <span className="text-xs font-medium text-slate-100 whitespace-nowrap">
                {formatValue(item.value)}
                <span aria-hidden="true"> / </span>
                {formatPct(item.value, parentTotal)}
              </span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
