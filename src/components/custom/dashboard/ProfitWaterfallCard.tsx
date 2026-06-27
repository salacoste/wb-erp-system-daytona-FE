/**
 * ProfitWaterfallCard (TZ-2) — consolidates the 6 profit cards (NetProfit,
 * GrossProfit, OperatingProfit, GrossMargin, Margin, Tax) into ONE expandable
 * card. Collapsed: the Net-profit lead metric (rendered via NetProfitCard, so the
 * anomaly indicator + comparison + tooltip are preserved exactly). Expanded: the
 * P&L waterfall chain Revenue → −COGS → Gross → −Logistics/Storage/Commissions →
 * Operating → −Tax → Net, plus the two margin-% rows, so every metric stays
 * reachable. (TZ-6: the low-COGS-coverage indicator that lived here was removed —
 * CogsCoverageMetricCard is the single canonical COGS-coverage surface.)
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-2)
 */

'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { getNetProfit } from '@/lib/tax-display-helpers'
import { NetProfitCard } from './NetProfitCard'
import { buildProfitWaterfall, type ProfitWaterfallRow } from './profit-waterfall'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

export function ProfitWaterfallCard(props: DashboardMetricsGridProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const prev = props.previousPeriodData
  const operating = props.operatingProfitAnalytical ?? props.grossProfit
  // Gross row mirrors the retired GrossProfitCard: grossProfitAnalytical only (no legacy
  // fallback) so a missing analytical figure shows "—" exactly as before (no silent value change).
  const gross = props.grossProfitAnalytical

  // MUST mirror NetProfitCard's hasData guard + getNetProfit call (NetProfitCard.tsx:62-65) so
  // the chain's Net row stays in lock-step with the lead headline. ProfitWaterfallCard.test.tsx
  // pins the current agreement; if the cascade changes, update both sites together.
  const hasNetData = props.payoutTotal != null || props.taxMetrics != null || operating != null
  const netValue = hasNetData
    ? getNetProfit(props.taxMetrics ?? null, props.payoutTotal ?? 0, operating).value
    : null

  const rows = buildProfitWaterfall({
    revenue: props.saleGross,
    cogs: props.cogsTotal,
    gross,
    logistics: props.logisticsCost,
    storage: props.storageCost,
    commissionsComponents: [
      props.commissionSales,
      props.acquiringFee,
      props.loyaltyFee,
      props.penaltiesTotal,
      props.wbCommissionAdj,
    ],
    operating,
    tax: props.taxMetrics?.tax_amount ?? undefined,
    net: netValue ?? undefined,
    grossMarginPct: props.grossMarginPct,
    marginPct: props.operatingMarginPct ?? props.marginPct,
  })

  return (
    <section
      className="flex flex-col gap-2 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
      aria-label="Структура прибыли"
    >
      <NetProfitCard
        taxMetrics={props.taxMetrics ?? null}
        payoutTotal={props.payoutTotal ?? null}
        saleGrossTotal={props.saleGross ?? null}
        operatingProfit={operating ?? null}
        previousTaxMetrics={prev?.taxMetrics ?? null}
        previousPayoutTotal={prev?.payoutTotal ?? null}
        previousOperatingProfit={prev?.operatingProfitAnalytical ?? prev?.grossProfit ?? null}
        isLoading={false}
        className="flex-1 border-0 p-0 shadow-none"
      />
      <button
        type="button"
        onClick={() => setOpen(prevOpen => !prevOpen)}
        aria-expanded={open}
        aria-controls="profit-waterfall-detail"
        className="flex items-center gap-1 self-start text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Структура прибыли
        <ChevronDown
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div id="profit-waterfall-detail" hidden={!open} className="rounded-lg border bg-card p-3">
        <ul className="space-y-1 text-sm">
          {rows.map(row => (
            <WaterfallRowItem key={row.id} row={row} />
          ))}
        </ul>
        {/* TZ-6: low-COGS-coverage indicator removed — CogsCoverageMetricCard (T1) is the single
            canonical COGS-coverage surface (AC: coverage in exactly 1 place). */}
        <p className="mt-2 text-xs text-muted-foreground">
          Показаны основные статьи P&amp;L. Чистая прибыль соответствует карточке выше (полный
          налоговый каскад; точная сумма строк зависит от всех удержаний WB).
        </p>
      </div>
    </section>
  )
}

function WaterfallRowItem({ row }: { row: ProfitWaterfallRow }): React.ReactElement {
  const valueText =
    row.value == null
      ? '—'
      : row.isPercentage
        ? formatPercentage(row.value)
        : formatCurrency(row.value)
  const signSymbol = row.sign === '-' ? '−' : row.sign === '+' ? '+' : '='
  return (
    <li
      className={cn(
        'flex items-center justify-between gap-2',
        row.emphasis && 'mt-1 border-t pt-1 font-semibold'
      )}
    >
      <span className={cn(row.emphasis ? 'text-foreground' : 'text-muted-foreground')}>
        {row.label}
      </span>
      <span className="tabular-nums">
        {!row.isPercentage && <span className="mr-1 text-muted-foreground">{signSymbol}</span>}
        {valueText}
      </span>
    </li>
  )
}
