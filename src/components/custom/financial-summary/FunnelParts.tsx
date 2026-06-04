/**
 * Sub-components for Sales Funnel visualization
 * Used exclusively by SalesFunnelSection
 */

import type { FinanceSummary } from '@/hooks/useDashboard'
import { ArrowDown } from 'lucide-react'
import { formatCurrency } from './financial-summary-formatters'
import { formatPercentage } from '@/lib/utils'

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-100', title: 'text-indigo-900', sub: 'text-indigo-600' },
  blue: { bg: 'bg-blue-100', title: 'text-blue-900', sub: 'text-blue-600' },
  cyan: { bg: 'bg-cyan-100', title: 'text-cyan-900', sub: 'text-cyan-600' },
  green: { bg: 'bg-green-100', title: 'text-green-900', sub: 'text-green-600' },
} as const

export type FunnelColorScheme = keyof typeof COLOR_MAP

export function FunnelLevel({
  title,
  subtitle,
  value,
  pctLabel,
  colorScheme,
  comparisonValue,
}: {
  title: string
  subtitle: string
  value: number
  pctLabel: string
  colorScheme: FunnelColorScheme
  comparisonValue?: number
}) {
  const c = COLOR_MAP[colorScheme]
  return (
    <div className={`p-4 ${c.bg} rounded-lg`}>
      <div className="flex justify-between items-center">
        <div>
          <div className={`font-semibold ${c.title}`}>{title}</div>
          <div className={`text-sm ${c.sub}`}>{subtitle}</div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${c.title}`}>{formatCurrency(value)}</div>
          <div className={`text-sm ${c.sub}`}>{pctLabel}</div>
        </div>
      </div>
      {comparisonValue !== undefined && (
        <div className={`mt-2 text-sm ${c.sub}`}>Сравнение: {formatCurrency(comparisonValue)}</div>
      )}
    </div>
  )
}

export function FunnelArrow({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${colorClass}`}>
      <ArrowDown className="h-5 w-5" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function FunnelProfitLevel({
  summary,
  comparisonSummary,
  isComparison,
  grossProfit,
  payoutTotal,
}: {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
  grossProfit: number
  payoutTotal: number
}) {
  return (
    <>
      <div className="flex items-center justify-center gap-2 text-amber-600">
        <ArrowDown className="h-5 w-5" />
        <span className="text-sm">
          {'Себестоимость (COGS): \u2212'}
          {/* Anti-pattern #8: cogs_total is `number | null` (backend sends null when no COGS data).
              formatCurrency renders '—' for null — do NOT `?? 0`, which fabricates a false 0,00 ₽. */}
          {formatCurrency(summary.cogs_total)}
        </span>
      </div>
      <div className="p-4 bg-emerald-100 rounded-lg border-2 border-emerald-400">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold text-emerald-900">{'✅ Прибыль'}</div>
            <div className="text-sm text-emerald-600">Ваш реальный заработок</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-emerald-900">{formatCurrency(grossProfit)}</div>
            <div className="text-sm text-emerald-600">
              Маржа: {formatPercentage(payoutTotal > 0 ? (grossProfit / payoutTotal) * 100 : 0, 1)}
            </div>
          </div>
        </div>
        {isComparison &&
          comparisonSummary?.gross_profit !== null &&
          comparisonSummary?.gross_profit !== undefined && (
            <div className="mt-2 text-sm text-emerald-600">
              Сравнение: {formatCurrency(comparisonSummary.gross_profit)}
            </div>
          )}
      </div>
    </>
  )
}
