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
// P2 wave-3 pass-1 (2026-09-05): STRUCTURAL fg-on-tint fix (см. debt-p2-wave3-aa-quickwins,
// pass-1 model correction). These rows render inside the SkuCashflowSection GRADIENT card
// (from-status-information/10 to-status-warning/10, SkuCashflowSection.tsx:30): every
// colored-token-on-tint composites over that base and fails AA at ANY tint alpha —
// fin-neg on fin-neg/10 row over gradient = 4.18 light / 5.91 dark, fin-pos on /5 = 4.18,
// info/15 badge on info/10 row = 3.59 (харнесс ANCHOR-5/5b/5c, in-situ layered, worst
// gradient end). The old over-card numbers (fin-pos/5 = 4.80 light) described a plain
// bg-card base these rows never sit on. Remedy = the repo's own PnLRow.tsx:64 pattern:
// rows/badges KEEP their tint identity (bg + border carry the valence), text becomes
// text-foreground (9.98-13.4:1 in-situ over the gradient, both themes). Solid
// warning-foreground chips (F3/F4 sites) measure 4.81/11.41 in-situ. bg-muted +
// text-muted-foreground defaults unchanged (7.2:1 on muted, both themes).
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
      className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded ${colorClass || (isRemaining ? 'bg-muted text-muted-foreground' : 'bg-financial-negative/5 text-foreground')}`}
    >
      {isRemaining ? '' : '−'}
      {pct(value)}%
    </span>
  )
}

// 168.9: waterfall rows → semantic financial tokens; /30 border preserves
// the pale-tinted row look of green-100/red-50/gray-100 in both themes.
// P2 wave-3 pass-1: symbol/value text → text-foreground (fg-on-tint; see block above —
// colored text on these tints fails AA over the gradient card base at any alpha).
// Row bgs: positive /5, negative /10 — tint identity kept (valence = bg + border).
const ROW_STYLES = {
  positive: {
    bg: 'bg-financial-positive/5 border-financial-positive/30',
    symbol: 'text-foreground',
    label: 'text-foreground',
    value: 'text-foreground',
  },
  negative: {
    bg: 'bg-financial-negative/10 border-financial-negative/30',
    symbol: 'text-foreground',
    label: 'text-foreground',
    value: 'text-foreground',
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
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-financial-positive/5 text-foreground">
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
    // P2 wave-3 pass-1: text → text-foreground (fg-on-tint; colored text on info/10 over the
    // gradient card = 3.59 light in-situ — see the block above PctBadge). Tint + border kept.
    <div className="flex items-center justify-between p-3 bg-status-information/10 rounded-lg border-2 border-status-information/30">
      <div className="flex items-center gap-2">
        <span className="text-foreground font-bold text-lg">=</span>
        <span className="text-sm font-medium text-foreground">Валовая прибыль по SKU</span>
        <span
          className={`ml-1 px-1.5 py-0.5 text-xs font-medium rounded ${isPositive ? 'bg-status-information/15 text-foreground' : 'bg-financial-negative/5 text-foreground'}`}
        >
          {pct(grossProfitSku)}%
        </span>
      </div>
      <span className="text-xl font-bold text-foreground">{fmtRub(grossProfitSku)}</span>
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
  // P2 wave-3 pass-1: text → text-foreground (fg-on-tint over the gradient card; see the
  // block above PctBadge). Row bg valence kept: positive /5, negative /10.
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 ${isPositive ? 'bg-financial-positive/5 border-financial-positive/40' : 'bg-financial-negative/10 border-financial-negative/40'}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl text-foreground">=</span>
        <span className="text-base font-semibold text-foreground" title={note}>
          {label}
        </span>
        <span
          className={`ml-1 px-2 py-0.5 text-sm font-bold rounded ${isPositive ? 'bg-financial-positive/5 text-foreground' : 'bg-financial-negative/5 text-foreground'}`}
        >
          {pct(netProfit)}%
        </span>
      </div>
      <span className="text-2xl font-bold text-foreground">{fmtRub(netProfit)}</span>
    </div>
  )
}
