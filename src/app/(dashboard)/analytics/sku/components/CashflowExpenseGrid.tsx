/**
 * Cabinet-level expense grid items for Cashflow section.
 * Extracted to keep SkuCashflowSection under 200 lines.
 */

import type { CabinetLevelExpenses } from '@/hooks/useMarginAnalytics'
import { isStorageDivergent } from '@/lib/analytics-utils'

interface ExpenseGridProps {
  cabinetExpenses: CabinetLevelExpenses
  pct: (value: number) => string
}

/** 6-column grid of cabinet-level expense items */
export function CashflowExpenseGrid({ cabinetExpenses, pct }: ExpenseGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <ExpenseItem label="Логистика" value={cabinetExpenses.logistics ?? 0} pct={pct} />

      <StorageExpenseItem cabinetExpenses={cabinetExpenses} pct={pct} />

      <ExpenseItem label="Прочие удерж." value={cabinetExpenses.other_adjustments} pct={pct} />

      <ExpenseItem label="Коррект. ВВ" value={cabinetExpenses.wb_commission_adj} pct={pct} />

      <ExpenseItem label="Штрафы" value={cabinetExpenses.penalties} pct={pct} />

      <ExpenseItem label="Платн. приёмка" value={cabinetExpenses.paid_acceptance} pct={pct} />
    </div>
  )
}

/** Standard expense item cell */
function ExpenseItem({
  label,
  value,
  pct,
}: {
  label: string
  value: number
  pct: (v: number) => string
}) {
  return (
    // 168.9 amber hierarchy, superseded P2 wave-3 pass-1: these cells sit on the gradient
    // cashflow card — text-status-warning (and worse, /80 alpha) failed AA in-situ, so ALL
    // cell text is text-foreground (12.4:1 over warn/10 on the gradient, both themes);
    // valence = the /10 tint + /30 border. (fg-on-tint, PnLRow.tsx:64 pattern.)
    <div className="text-center p-2 bg-status-warning/10 rounded border border-status-warning/30">
      <div className="text-xs text-foreground">{label}</div>
      <div className="text-sm font-bold text-foreground">
        {value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
      </div>
      <div className="text-xs text-foreground">{pct(value)}%</div>
    </div>
  )
}

/** Storage expense item with weekly report comparison (Request #67) */
function StorageExpenseItem({
  cabinetExpenses,
  pct,
}: {
  cabinetExpenses: CabinetLevelExpenses
  pct: (v: number) => string
}) {
  // iter-126: canonical 3% tolerance (analytics-utils), not a flat >1 ₽ which over-flagged
  // large-storage cabinets (a 2% diff on 100 000 ₽ tripped the warning despite Request #52
  // saying <3% is expected variance). null weekly → no warning.
  const hasDifference = isStorageDivergent(
    cabinetExpenses.storage,
    cabinetExpenses.storage_weekly_report
  )

  return (
    // 168.9: divergence state (/20 bg + /50 border) stays visually STRONGER than the normal /10-/30 cell.
    // P2 wave-3 pass-1: text → text-foreground (fg-on-tint over the gradient card; /80 alpha
    // removed — double violation). Valence = tint + border strength difference.
    <div
      className={`text-center p-2 rounded border ${
        hasDifference
          ? 'bg-status-warning/20 border-status-warning/50'
          : 'bg-status-warning/10 border-status-warning/30'
      }`}
    >
      <div className="text-xs text-foreground">Хранение (API)</div>
      <div className="text-sm font-bold text-foreground">
        {cabinetExpenses.storage.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
      </div>
      <div className="text-xs text-foreground">{pct(cabinetExpenses.storage)}%</div>
      {/* Request #67: Show weekly report storage for comparison */}
      <div className="text-xs text-muted-foreground mt-1 border-t border-border pt-1">
        Отчёт:{' '}
        {(cabinetExpenses.storage_weekly_report ?? 0).toLocaleString('ru-RU', {
          maximumFractionDigits: 0,
        })}{' '}
        ₽
        {hasDifference && (
          <span
            className={`ml-1 font-medium ${
              (cabinetExpenses.storage_difference ?? 0) > 0
                ? 'text-financial-negative'
                : 'text-financial-positive'
            }`}
          >
            ({(cabinetExpenses.storage_difference ?? 0) > 0 ? '+' : ''}
            {(cabinetExpenses.storage_difference ?? 0).toLocaleString('ru-RU', {
              maximumFractionDigits: 0,
            })}
            )
          </span>
        )}
      </div>
    </div>
  )
}
