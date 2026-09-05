/**
 * Full Cashflow Card
 * Shows revenue waterfall: sales -> returns -> net -> expenses -> profit.
 * Extracted from page.tsx for file size compliance.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2 } from 'lucide-react'
import type { CabinetLevelExpenses } from '@/hooks/useMarginAnalytics'
import { CashflowExpenseGrid } from './CashflowExpenseGrid'
import {
  CashflowRow,
  PctBadge,
  GrossProfitRow,
  NetProfitRow,
  fmtRub,
} from './CashflowRowPrimitives'

interface SkuCashflowSectionProps {
  cabinetExpenses: CabinetLevelExpenses | undefined
  isLoading: boolean
}

export function SkuCashflowSection({ cabinetExpenses, isLoading }: SkuCashflowSectionProps) {
  if (!cabinetExpenses && !isLoading) return null

  return (
    // 168.9: gradient tokenized (info→warning two-tone preserved via /10 stops).
    <Card className="border-status-information/30 bg-gradient-to-br from-status-information/10 to-status-warning/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Building2 className="h-5 w-5" />
          Полный Cashflow
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Движение денежных средств за период
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : cabinetExpenses ? (
          <CashflowContent cabinetExpenses={cabinetExpenses} />
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Inner content rendered when data is available */
function CashflowContent({ cabinetExpenses }: { cabinetExpenses: CabinetLevelExpenses }) {
  // No sales → every "% of revenue" is undefined (the `|| 1` safe-divide would otherwise fabricate
  // absurd badges like "Логистика 50000 %" over a 0 ₽ baseline). Show an honest empty-state instead.
  if (cabinetExpenses.sales_gross <= 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Нет продаж за период — структура cashflow в процентах недоступна.
      </div>
    )
  }

  const salesGross = cabinetExpenses.sales_gross || 1
  // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: returns_gross 0 = no returns for net sales display
  const returnsGross = cabinetExpenses.returns_gross ?? 0
  const netSales = salesGross - returnsGross
  const netProfit = cabinetExpenses.gross_profit_sku - cabinetExpenses.total
  const pct = (value: number) => ((value / salesGross) * 100).toFixed(1)
  // eslint-disable-next-line no-restricted-syntax -- DISPLAY-GUARD: acquiring_fee null = absent line; renders 0₽ for visual row consistency
  const acquiringFee = cabinetExpenses.acquiring_fee ?? 0

  return (
    <div className="space-y-3">
      {/* Sales Gross - 100% baseline */}
      <CashflowRow
        variant="positive"
        symbol="+"
        label="Продажи (gross)"
        badge="100%"
        value={fmtRub(salesGross)}
      />

      {/* Returns Gross */}
      <CashflowRow
        variant="negative"
        symbol="−"
        label="Возвраты (gross)"
        value={fmtRub(returnsGross)}
      >
        <PctBadge value={returnsGross} pct={pct} />
      </CashflowRow>

      {/* Net Sales */}
      <CashflowRow
        variant="neutral"
        symbol="="
        label="Чистые продажи (gross)"
        value={fmtRub(netSales)}
      >
        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-muted text-muted-foreground">
          {pct(netSales)}%
        </span>
      </CashflowRow>

      {/* Commission */}
      <CashflowRow
        variant="negative"
        symbol="−"
        label="Комиссия МП"
        value={fmtRub(cabinetExpenses.marketplace_commission)}
      >
        <PctBadge value={cabinetExpenses.marketplace_commission} pct={pct} />
      </CashflowRow>

      {/* Acquiring */}
      <CashflowRow variant="negative" symbol="−" label="Эквайринг" value={fmtRub(acquiringFee)}>
        <PctBadge value={acquiringFee} pct={pct} />
      </CashflowRow>

      {/* COGS */}
      <CashflowRow
        variant="negative"
        symbol="−"
        label="Себестоимость (COGS)"
        value={fmtRub(cabinetExpenses.cogs_total)}
      >
        <PctBadge value={cabinetExpenses.cogs_total} pct={pct} />
      </CashflowRow>

      {/* Gross Profit by SKU */}
      <GrossProfitRow grossProfitSku={cabinetExpenses.gross_profit_sku} pct={pct} />

      {/* 168.9: amber deductions block → status-warning tint identity. P2 wave-3 pass-1:
          text → text-foreground (fg-on-tint) — colored text composites over the gradient
          card base and fails AA at any alpha (warn/15 row in-situ = 11.64 light / 9.98 dark as foreground;
          text-status-warning here measured 2.79-4.2 light). Valence = tint + border. */}
      <div className="border-t-2 border-status-warning/40 my-2" />
      <div className="text-sm font-medium text-foreground px-2">
        Удержания из выплаты (общекабинетные расходы):
      </div>

      <CashflowExpenseGrid cabinetExpenses={cabinetExpenses} pct={pct} />

      {/* Total Cabinet Expenses */}
      <div className="flex items-center justify-between p-3 bg-status-warning/15 rounded-lg border border-status-warning/40">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-bold text-lg">−</span>
          <span className="text-sm font-medium text-foreground">ИТОГО общекабинетные расходы</span>
          {/* P2 wave-3 pass-1: SOLID warning chip (PR 384 canon) — the old /20 badge on the
              /15 row over the gradient measured 2.79 light in-situ (ANCHOR-3); a solid
              warning-foreground pair kills the compositing (4.81 light / 11.41 dark). */}
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-status-warning text-status-warning-foreground">
            −{pct(cabinetExpenses.total)}%
          </span>
        </div>
        <span className="text-lg font-bold text-foreground">{fmtRub(cabinetExpenses.total)}</span>
      </div>

      {/* Net Profit */}
      {/* BD-11: this cabinet-level cashflow net is PRE-tax (gross_profit_sku − deductions,
          ≈ payout_total). Relabelled to distinguish from the dashboard's post-tax
          «Чистая прибыль» (net_profit_after_all_tax), which is lower by the УСН/VAT wedge. */}
      <NetProfitRow
        netProfit={netProfit}
        pct={pct}
        label="ПРИБЫЛЬ ДО НАЛОГА"
        note="Прибыль до налога = валовая прибыль по SKU − общекабинетные удержания WB. Считается до уплаты УСН/НДС, поэтому больше «Чистой прибыли» на дашборде на сумму налога."
      />
    </div>
  )
}
