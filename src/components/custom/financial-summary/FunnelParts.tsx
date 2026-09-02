/**
 * Sub-components for Sales Funnel visualization
 * Used exclusively by SalesFunnelSection
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes over the card surface — see debt-p2-boundary-wave1
// artifact. Funnel stages are informational; the payout/profit stages carry
// success. Level identity = tint + border (+ title color): information levels
// keep their colored title (4.98:1 light on info/10) with a deliberate 1px
// border, while text-status-success on success/10 measures 4.49:1 (light) —
// sub-AA — so success levels use foreground/muted-foreground text (14.11:1 /
// 6.85:1 light) with border-2 border-status-success/20 (matching
// FunnelProfitLevel) and let the tint + border carry the identity. Border-only
// weights sit outside WCAG 1.4.3 (text contrast) — no text-color impact.

import type { FinanceSummary } from '@/hooks/useDashboard'
import { ArrowDown } from 'lucide-react'
import { formatCurrency } from './financial-summary-formatters'
import { formatPercentage } from '@/lib/utils'

const COLOR_MAP = {
  information: {
    bg: 'bg-status-information/10',
    border: 'border border-status-information/20',
    title: 'text-status-information',
    sub: 'text-muted-foreground',
  },
  success: {
    bg: 'bg-status-success/10',
    border: 'border-2 border-status-success/20',
    title: 'text-foreground',
    sub: 'text-muted-foreground',
  },
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
    <div className={`p-4 ${c.bg} ${c.border} rounded-lg`}>
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
      <div className="flex items-center justify-center gap-2 text-status-warning">
        <ArrowDown className="h-5 w-5" />
        <span className="text-sm">
          {'Себестоимость (COGS): \u2212'}
          {/* Anti-pattern #8: cogs_total is `number | null` (backend sends null when no COGS data).
              formatCurrency renders '—' for null — do NOT `?? 0`, which fabricates a false 0,00 ₽. */}
          {formatCurrency(summary.cogs_total)}
        </span>
      </div>
      <div className="p-4 bg-status-success/10 rounded-lg border-2 border-status-success/20">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold text-foreground">{'✅ Прибыль'}</div>
            <div className="text-sm text-muted-foreground">Ваш реальный заработок</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">{formatCurrency(grossProfit)}</div>
            <div className="text-sm text-muted-foreground">
              Маржа: {formatPercentage(payoutTotal > 0 ? (grossProfit / payoutTotal) * 100 : 0, 1)}
            </div>
          </div>
        </div>
        {isComparison &&
          comparisonSummary?.gross_profit !== null &&
          comparisonSummary?.gross_profit !== undefined && (
            <div className="mt-2 text-sm text-muted-foreground">
              Сравнение: {formatCurrency(comparisonSummary.gross_profit)}
            </div>
          )}
      </div>
    </>
  )
}
