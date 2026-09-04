/**
 * Cashflow row primitives: reusable row layout, badges, formatters.
 * Extracted from SkuCashflowSection to keep files under 200 lines.
 */

import type { ReactNode } from 'react'

/** Format currency in Russian locale */
export function fmtRub(value: number, maxFrac = 2) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: maxFrac })} ₽`
}

/** Percentage badge helper */
// P2 wave-3 (2026-09-05): financial chips /15→/5 per house rule — measured <4.5:1 light
// (см. артефакт debt-p2-wave3-aa-quickwins / волна-2 canon): fin-pos/15 = 4.19,
// fin-neg/15 = 4.42 → /5 = 4.80 / 5.20 light PASS (8.72 / 8.19 dark). status-information/15
// = 4.62 light / 6.64 dark PASS → retained /15 (харнесс-замер, обе темы над card).
// Fold-in (same wave): positive ROW bg /10→/5 (ROW_STYLES.positive + NetProfitRow ниже) —
// fin-pos text on /10 = 4.49 light FAIL → 4.80 (8.72 dark); fin-neg /10 = 4.80/7.51 PASS → kept.
export function PctBadge({
  value,
  pct,
  isRemaining = false,
  colorClass = '',
}: {
  value: number
  pct: (v: number) => string
  isRemaining?: boolean
  colorClass?: string
}) {
  return (
    <span
      className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded ${colorClass || (isRemaining ? 'bg-muted text-muted-foreground' : 'bg-financial-negative/5 text-financial-negative')}`}
    >
      {isRemaining ? '' : '−'}
      {pct(value)}%
    </span>
  )
}

// 168.9: waterfall rows → semantic financial tokens; /30 border preserves
// the pale-tinted row look of green-100/red-50/gray-100 in both themes.
// P2 wave-3 fold-in: positive row bg /10→/5 (fin-pos text on /10 = 4.49 light FAIL);
// negative row keeps /10 (fin-neg on /10 = 4.80 light / 7.51 dark PASS).
const ROW_STYLES = {
  positive: {
    bg: 'bg-financial-positive/5 border-financial-positive/30',
    symbol: 'text-financial-positive',
    label: 'text-foreground',
    value: 'text-financial-positive',
  },
  negative: {
    bg: 'bg-financial-negative/10 border-financial-negative/30',
    symbol: 'text-financial-negative',
    label: 'text-foreground',
    value: 'text-financial-negative',
  },
  neutral: {
    bg: 'bg-muted border-border',
    symbol: 'text-muted-foreground',
    label: 'text-foreground',
    value: 'text-foreground',
  },
} as const

/** Reusable cashflow row */
export function CashflowRow({
  variant,
  symbol,
  label,
  badge,
  value,
  children,
}: {
  variant: 'positive' | 'negative' | 'neutral'
  symbol: string
  label: string
  badge?: string
  value: string
  children?: ReactNode
}) {
  const styles = ROW_STYLES[variant]

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${styles.bg}`}>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-lg ${styles.symbol}`}>{symbol}</span>
        <span className={`text-sm font-medium ${styles.label}`}>{label}</span>
        {badge && (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-financial-positive/5 text-financial-positive">
            {badge}
          </span>
        )}
        {children}
      </div>
      <span className={`text-lg font-bold ${styles.value}`}>{value}</span>
    </div>
  )
}

/** Gross profit subtotal row */
export function GrossProfitRow({
  grossProfitSku,
  pct,
}: {
  grossProfitSku: number
  pct: (v: number) => string
}) {
  const isPositive = grossProfitSku >= 0
  return (
    // 168.9: blue = informational SUBTOTAL accent (not a money sign); negative branch = financial.
    <div className="flex items-center justify-between p-3 bg-status-information/10 rounded-lg border-2 border-status-information/30">
      <div className="flex items-center gap-2">
        <span className="text-status-information font-bold text-lg">=</span>
        <span className="text-sm font-medium text-foreground">Валовая прибыль по SKU</span>
        <span
          className={`ml-1 px-1.5 py-0.5 text-xs font-medium rounded ${isPositive ? 'bg-status-information/15 text-status-information' : 'bg-financial-negative/5 text-financial-negative'}`}
        >
          {pct(grossProfitSku)}%
        </span>
      </div>
      <span
        className={`text-xl font-bold ${isPositive ? 'text-status-information' : 'text-financial-negative'}`}
      >
        {fmtRub(grossProfitSku)}
      </span>
    </div>
  )
}

/** Final net profit row. `label`/`note` let callers disambiguate this pre-tax cashflow
 * net from the dashboard's post-tax «Чистая прибыль» — BD-11: same label, ~33 400 ₽ apart. */
export function NetProfitRow({
  netProfit,
  pct,
  label = 'ЧИСТАЯ ПРИБЫЛЬ',
  note,
}: {
  netProfit: number
  pct: (v: number) => string
  label?: string
  note?: string
}) {
  const isPositive = netProfit >= 0
  // 168.9: final profit row = financial sign semantics; /40 border keeps emphasis.
  // P2 wave-3 fold-in: positive bg /10→/5 (4.49 light FAIL on fin-pos text); negative keeps /10 (4.80 PASS).
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 ${isPositive ? 'bg-financial-positive/5 border-financial-positive/40' : 'bg-financial-negative/10 border-financial-negative/40'}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`font-bold text-xl ${isPositive ? 'text-financial-positive' : 'text-financial-negative'}`}
        >
          =
        </span>
        <span className="text-base font-semibold text-foreground" title={note}>
          {label}
        </span>
        <span
          className={`ml-1 px-2 py-0.5 text-sm font-bold rounded ${isPositive ? 'bg-financial-positive/5 text-financial-positive' : 'bg-financial-negative/5 text-financial-negative'}`}
        >
          {pct(netProfit)}%
        </span>
      </div>
      <span
        className={`text-2xl font-bold ${isPositive ? 'text-financial-positive' : 'text-financial-negative'}`}
      >
        {fmtRub(netProfit)}
      </span>
    </div>
  )
}
