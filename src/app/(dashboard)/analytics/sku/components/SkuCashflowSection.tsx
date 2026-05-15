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
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Building2 className="h-5 w-5" />
          Полный Cashflow
        </CardTitle>
        <CardDescription className="text-blue-700">
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
        <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-600">
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

      <div className="border-t-2 border-amber-300 my-2" />
      <div className="text-sm font-medium text-amber-800 px-2">
        Удержания из выплаты (общекабинетные расходы):
      </div>

      <CashflowExpenseGrid cabinetExpenses={cabinetExpenses} pct={pct} />

      {/* Total Cabinet Expenses */}
      <div className="flex items-center justify-between p-3 bg-amber-100 rounded-lg border border-amber-300">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 font-bold text-lg">−</span>
          <span className="text-sm font-medium text-amber-800">ИТОГО общекабинетные расходы</span>
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-amber-200 text-amber-700">
            −{pct(cabinetExpenses.total)}%
          </span>
        </div>
        <span className="text-lg font-bold text-amber-700">{fmtRub(cabinetExpenses.total)}</span>
      </div>

      {/* Net Profit */}
      <NetProfitRow netProfit={netProfit} pct={pct} />
    </div>
  )
}
