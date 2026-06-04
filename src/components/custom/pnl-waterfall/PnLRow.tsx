/**
 * PnLRow Component
 *
 * Individual row in the P&L waterfall with value, tooltip, and percentage.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn, formatPercentage } from '@/lib/utils'
import { formatCurrency, formatPercent } from './pnl-formatters'

export interface PnLRowProps {
  label: string
  value: number | null | undefined
  formula?: string // Short formula explanation
  isSubtotal?: boolean
  isTotal?: boolean
  isNegative?: boolean
  isPositive?: boolean // For compensations (green, adds to payout)
  indent?: number
  tooltip?: string
  percentOfRevenue?: number | null
  highlight?: 'positive' | 'negative' | 'warning' | 'neutral'
  showZero?: boolean // Show row even if value is 0
}

export const PnLRow = ({
  label,
  value,
  formula,
  isSubtotal = false,
  isTotal = false,
  isNegative = false,
  isPositive = false,
  indent = 0,
  tooltip,
  percentOfRevenue,
  highlight,
  showZero = true,
}: PnLRowProps) => {
  // Hide row if value is 0 or null and showZero is false
  if (!showZero && (value === null || value === undefined || value === 0)) {
    return null
  }

  const displayValue = isNegative && value ? -Math.abs(value) : value

  const rowClasses = cn(
    'flex items-center justify-between py-2.5 px-3 rounded-md transition-colors',
    isTotal && 'bg-slate-100 font-bold text-lg border-2 border-slate-300',
    isSubtotal && 'bg-slate-50 font-semibold border-t border-slate-200',
    highlight === 'positive' && 'bg-green-50',
    highlight === 'negative' && 'bg-red-50',
    highlight === 'warning' && 'bg-amber-50'
  )

  const valueClasses = cn(
    'font-mono tabular-nums text-base',
    isNegative && 'text-red-600',
    isPositive && 'text-green-600',
    highlight === 'positive' && 'text-green-700 font-bold',
    highlight === 'negative' && 'text-red-700 font-bold'
  )

  return (
    <div className={rowClasses} style={{ paddingLeft: `${12 + indent * 20}px` }}>
      <div className="flex items-center gap-2 flex-1">
        <span
          className={cn(
            isTotal && 'text-slate-900',
            isSubtotal && 'text-slate-700',
            indent > 0 && !isSubtotal && !isTotal && 'text-slate-600'
          )}
        >
          {label}
        </span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              <p className="text-sm font-medium mb-1">{label}</p>
              <p className="text-xs text-muted-foreground">{tooltip}</p>
              {formula && (
                <p className="text-xs mt-2 font-mono bg-slate-100 px-2 py-1 rounded">{formula}</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Always reserve space for percentage column to ensure vertical alignment */}
        <span
          className={cn(
            'text-xs w-14 text-right font-mono tabular-nums',
            percentOfRevenue !== null && percentOfRevenue !== undefined
              ? isPositive
                ? 'text-green-600'
                : 'text-muted-foreground'
              : 'invisible'
          )}
        >
          {percentOfRevenue !== null && percentOfRevenue !== undefined
            ? isPositive
              ? // U+2212 typographic minus (matches formatCurrency); Math.abs keeps Intl from
                // emitting its own ASCII hyphen. The else-branch's negatives render with an ASCII
                // hyphen via formatPercent — a pre-existing split, preserved (not introduced here).
                `−${formatPercentage(Math.abs(percentOfRevenue), 1)}`
              : formatPercent(percentOfRevenue)
            : '\u00A0'}
        </span>
        <span className={cn('min-w-[130px] text-right', valueClasses)}>
          {isPositive && value && value > 0 ? '+' : ''}
          {formatCurrency(displayValue, isNegative)}
        </span>
      </div>
    </div>
  )
}
