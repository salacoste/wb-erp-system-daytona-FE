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
      className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded ${colorClass || (isRemaining ? 'bg-gray-200 text-gray-600' : 'bg-red-200 text-red-700')}`}
    >
      {isRemaining ? '' : '−'}
      {pct(value)}%
    </span>
  )
}

const ROW_STYLES = {
  positive: {
    bg: 'bg-green-100 border-green-300',
    symbol: 'text-green-600',
    label: 'text-green-800',
    value: 'text-green-700',
  },
  negative: {
    bg: 'bg-red-50 border-red-200',
    symbol: 'text-red-500',
    label: 'text-red-700',
    value: 'text-red-600',
  },
  neutral: {
    bg: 'bg-gray-100 border-gray-300',
    symbol: 'text-gray-600',
    label: 'text-gray-800',
    value: 'text-gray-700',
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
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-green-200 text-green-700">
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
    <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg border-2 border-blue-400">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 font-bold text-lg">=</span>
        <span className="text-sm font-medium text-blue-800">Валовая прибыль по SKU</span>
        <span
          className={`ml-1 px-1.5 py-0.5 text-xs font-medium rounded ${isPositive ? 'bg-blue-200 text-blue-700' : 'bg-red-200 text-red-700'}`}
        >
          {pct(grossProfitSku)}%
        </span>
      </div>
      <span className={`text-xl font-bold ${isPositive ? 'text-blue-700' : 'text-red-600'}`}>
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
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 ${isPositive ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}
    >
      <div className="flex items-center gap-2">
        <span className={`font-bold text-xl ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          =
        </span>
        <span
          className={`text-base font-semibold ${isPositive ? 'text-green-800' : 'text-red-800'}`}
          title={note}
        >
          {label}
        </span>
        <span
          className={`ml-1 px-2 py-0.5 text-sm font-bold rounded ${isPositive ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}
        >
          {pct(netProfit)}%
        </span>
      </div>
      <span className={`text-2xl font-bold ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
        {fmtRub(netProfit)}
      </span>
    </div>
  )
}
