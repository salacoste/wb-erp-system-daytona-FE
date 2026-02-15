/**
 * CommissionBreakdownPopover -- Story 65.7
 * Badge + Popover showing 4 commission subcategories on WbCommissionsCard.
 *
 * Rows:
 * 1. Скидка МП (wbCommissionAdj) -- green (compensation)
 * 2. Номинальная комиссия (commissionSales) -- red
 * 3. Эквайринг (acquiringFee) -- red
 * 4. Прочие (loyaltyFee + penaltiesTotal + wbServicesCost) -- red
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md Story 65.7
 */

'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatCurrency } from '@/lib/utils'

export interface CommissionBreakdownPopoverProps {
  commissionSales: number | null | undefined
  acquiringFee: number | null | undefined
  wbCommissionAdj: number | null | undefined
  loyaltyFee: number | null | undefined
  penaltiesTotal: number | null | undefined
  wbServicesCost: number | null | undefined
  saleGross: number | null | undefined
}

/** Format percentage with Russian decimal comma, 1 decimal place */
function fmtPct(value: number, total: number): string {
  if (total === 0) return '0,0 %'
  const pct = (Math.abs(value) / Math.abs(total)) * 100
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(pct) + ' %'
  )
}

/** Sum nullable values; returns null only if ALL are null/undefined */
function sumNullable(...vals: (number | null | undefined)[]): number | null {
  let sum = 0
  let hasAny = false
  for (const v of vals) {
    if (v != null) {
      sum += v
      hasAny = true
    }
  }
  return hasAny ? sum : null
}

interface RowDef {
  label: string
  value: number
  colorClass: string
  testId: string
}

export function CommissionBreakdownPopover(
  props: CommissionBreakdownPopoverProps
): React.ReactElement {
  const {
    commissionSales,
    acquiringFee,
    wbCommissionAdj,
    loyaltyFee,
    penaltiesTotal,
    wbServicesCost,
    saleGross,
  } = props

  const prochie = sumNullable(loyaltyFee, penaltiesTotal, wbServicesCost)
  const hasProchie = prochie != null
  const rowCount = hasProchie ? 4 : 3

  const netTotal = sumNullable(
    wbCommissionAdj,
    commissionSales,
    acquiringFee,
    loyaltyFee,
    penaltiesTotal,
    wbServicesCost
  )

  const revenue = saleGross ?? 0

  const rows: RowDef[] = [
    {
      label: 'Скидка МП',
      value: wbCommissionAdj ?? 0,
      colorClass: 'text-green-600 bg-green-50',
      testId: 'row-discount',
    },
    {
      label: 'Номинальная комиссия',
      value: commissionSales ?? 0,
      colorClass: 'text-red-600 bg-red-50',
      testId: 'row-commission',
    },
    {
      label: 'Эквайринг',
      value: acquiringFee ?? 0,
      colorClass: 'text-red-600 bg-red-50',
      testId: 'row-acquiring',
    },
  ]

  if (hasProchie) {
    rows.push({
      label: 'Прочие',
      value: prochie,
      colorClass: 'text-red-600 bg-red-50',
      testId: 'row-other',
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-testid="commission-breakdown-badge"
          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium cursor-pointer hover:bg-muted/80"
          aria-label={`Показать ${rowCount} категории комиссий`}
        >
          {rowCount}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" role="dialog">
        <p className="mb-2 text-sm font-semibold text-foreground">Разбивка комиссий</p>
        <div className="space-y-1.5">
          {rows.map(row => (
            <div
              key={row.testId}
              data-testid={row.testId}
              className={`flex items-center justify-between rounded px-2 py-1 text-sm ${row.colorClass}`}
            >
              <span>{row.label}</span>
              <span className="flex items-center gap-2 font-medium">
                <span>{formatCurrency(Math.abs(row.value))}</span>
                <span className="text-xs opacity-70">{fmtPct(row.value, revenue)}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-semibold">
          <span>Итого</span>
          <span className="text-red-600">
            {netTotal != null ? formatCurrency(Math.abs(netTotal)) : '—'}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
