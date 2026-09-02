/**
 * Expense table body rows - extracted from ExpensesSection
 * Renders all expense line items within the table body
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes — see debt-p2-boundary-wave1 artifact.

import { TableCell, TableRow } from '@/components/ui/table'
import { ExpenseRow } from './ExpenseRow'
import type { extractExpenseData } from './expenses-data'

interface ExpenseTableRowsProps {
  d: ReturnType<typeof extractExpenseData>
  isComparison: boolean
}

export function ExpenseTableRows({ d, isComparison }: ExpenseTableRowsProps) {
  return (
    <>
      <ExpenseRow
        label="Комиссия WB (из оборота)"
        value={d.commission}
        compValue={d.compCommission}
        base={d.saleGross}
        compBase={d.compSaleGross}
        highlight
        isComparison={isComparison}
      />
      <ExpenseRow
        label="Эквайринг (из комиссии)"
        value={d.acquiring}
        compValue={d.compAcquiring}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />
      <ExpenseRow
        label="Прочие комиссии (КВВ + SPP)"
        value={d.otherCommission}
        compValue={d.compOtherCommission}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />

      {/* Divider before operational deductions */}
      <TableRow>
        <TableCell colSpan={isComparison ? 6 : 3} className="py-1">
          <span className="sr-only">Операционные удержания</span>
          <hr className="border-border" aria-hidden="true" />
        </TableCell>
      </TableRow>

      <ExpenseRow
        label="Удержания WB (из к перечислению)"
        value={d.totalDeductions}
        compValue={d.compTotalDeductions}
        base={d.saleGross}
        compBase={d.compSaleGross}
        bold
        isComparison={isComparison}
      />
      <ExpenseRow
        label="Логистика"
        value={d.logistics}
        compValue={d.compLogistics}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />
      <ExpenseRow
        label="Хранение"
        value={d.storage}
        compValue={d.compStorage}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />
      <ExpenseRow
        label="Платная приёмка"
        value={d.paidAcceptance}
        compValue={d.compPaidAcceptance}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />
      <ExpenseRow
        label="Штрафы"
        value={d.penalties}
        compValue={d.compPenalties}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />
      <ExpenseRow
        label="Прочие удержания (WB сервисы)"
        value={d.otherAdjustments}
        compValue={d.compOtherAdjustments}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />

      {/* WB Services breakdown - only show if there are values */}
      {d.wbPromotion > 0 && (
        <ExpenseRow
          label="WB.Продвижение"
          value={d.wbPromotion}
          compValue={d.compWbPromotion}
          base={d.saleGross}
          compBase={d.compSaleGross}
          indent={2}
          isComparison={isComparison}
        />
      )}
      {d.wbJam > 0 && (
        <ExpenseRow
          label="Подписка Джем"
          value={d.wbJam}
          compValue={d.compWbJam}
          base={d.saleGross}
          compBase={d.compSaleGross}
          indent={2}
          isComparison={isComparison}
        />
      )}
      {d.wbOtherServices > 0 && (
        <ExpenseRow
          label="Прочие сервисы WB"
          value={d.wbOtherServices}
          compValue={d.compWbOtherServices}
          base={d.saleGross}
          compBase={d.compSaleGross}
          indent={2}
          isComparison={isComparison}
        />
      )}

      {/* Корректировка ВВ (Request #51) */}
      <ExpenseRow
        label="Корректировка ВВ"
        value={d.wbCommissionAdj}
        compValue={d.compWbCommissionAdj}
        base={d.saleGross}
        compBase={d.compSaleGross}
        indent={1}
        isComparison={isComparison}
      />

      {/* Loyalty fees - only show if there are values */}
      {d.loyaltyFee > 0 && (
        <ExpenseRow
          label="Комиссия лояльности"
          value={d.loyaltyFee}
          compValue={d.compLoyaltyFee}
          base={d.saleGross}
          compBase={d.compSaleGross}
          indent={1}
          isComparison={isComparison}
        />
      )}
      {d.loyaltyPointsWithheld > 0 && (
        <ExpenseRow
          label="Удержание баллов"
          value={d.loyaltyPointsWithheld}
          compValue={d.compLoyaltyPointsWithheld}
          base={d.saleGross}
          compBase={d.compSaleGross}
          indent={1}
          isComparison={isComparison}
        />
      )}
    </>
  )
}
