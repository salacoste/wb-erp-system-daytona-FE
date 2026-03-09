/**
 * Expense data extraction from FinanceSummary
 * Computes all expense values and their comparison counterparts
 */

import type { FinanceSummary } from '@/hooks/useDashboard'

export function extractExpenseData(summary: FinanceSummary, comparisonSummary?: FinanceSummary) {
  const saleGross = summary.sale_gross_total ?? summary.sale_gross ?? 0
  const compSaleGross = comparisonSummary?.sale_gross_total ?? comparisonSummary?.sale_gross ?? 0

  const commission = summary.total_commission_rub_total ?? summary.total_commission_rub ?? 0
  const compCommission =
    comparisonSummary?.total_commission_rub_total ?? comparisonSummary?.total_commission_rub ?? 0

  const logistics = summary.logistics_cost_total ?? summary.logistics_cost ?? 0
  const compLogistics =
    comparisonSummary?.logistics_cost_total ?? comparisonSummary?.logistics_cost ?? 0

  const storage = summary.storage_cost_total ?? summary.storage_cost ?? 0
  const compStorage = comparisonSummary?.storage_cost_total ?? comparisonSummary?.storage_cost ?? 0

  const paidAcceptance = summary.paid_acceptance_cost_total ?? summary.paid_acceptance_cost ?? 0
  const compPaidAcceptance =
    comparisonSummary?.paid_acceptance_cost_total ?? comparisonSummary?.paid_acceptance_cost ?? 0

  const penalties = summary.penalties_total ?? 0
  const compPenalties = comparisonSummary?.penalties_total ?? 0

  const otherAdjustments = summary.other_adjustments_net_total ?? summary.other_adjustments_net ?? 0
  const compOtherAdjustments =
    comparisonSummary?.other_adjustments_net_total ?? comparisonSummary?.other_adjustments_net ?? 0

  const wbPromotion = summary.wb_promotion_cost_total ?? summary.wb_promotion_cost ?? 0
  const compWbPromotion =
    comparisonSummary?.wb_promotion_cost_total ?? comparisonSummary?.wb_promotion_cost ?? 0

  const wbJam = summary.wb_jam_cost_total ?? summary.wb_jam_cost ?? 0
  const compWbJam = comparisonSummary?.wb_jam_cost_total ?? comparisonSummary?.wb_jam_cost ?? 0

  const wbOtherServices =
    summary.wb_other_services_cost_total ?? summary.wb_other_services_cost ?? 0
  const compWbOtherServices =
    comparisonSummary?.wb_other_services_cost_total ??
    comparisonSummary?.wb_other_services_cost ??
    0

  const wbCommissionAdj = summary.wb_commission_adj_total ?? summary.wb_commission_adj ?? 0
  const compWbCommissionAdj =
    comparisonSummary?.wb_commission_adj_total ?? comparisonSummary?.wb_commission_adj ?? 0

  const loyaltyFee = summary.loyalty_fee_total ?? summary.loyalty_fee ?? 0
  const compLoyaltyFee = comparisonSummary?.loyalty_fee_total ?? comparisonSummary?.loyalty_fee ?? 0

  const loyaltyPointsWithheld =
    summary.loyalty_points_withheld_total ?? summary.loyalty_points_withheld ?? 0
  const compLoyaltyPointsWithheld =
    comparisonSummary?.loyalty_points_withheld_total ??
    comparisonSummary?.loyalty_points_withheld ??
    0

  const totalDeductions =
    logistics +
    storage +
    paidAcceptance +
    penalties +
    otherAdjustments +
    wbCommissionAdj +
    loyaltyFee +
    loyaltyPointsWithheld
  const compTotalDeductions =
    compLogistics +
    compStorage +
    compPaidAcceptance +
    compPenalties +
    compOtherAdjustments +
    compWbCommissionAdj +
    compLoyaltyFee +
    compLoyaltyPointsWithheld

  const acquiring = summary.acquiring_fee_total ?? summary.acquiring_fee ?? 0
  const compAcquiring =
    comparisonSummary?.acquiring_fee_total ?? comparisonSummary?.acquiring_fee ?? 0
  const otherCommission = commission - acquiring
  const compOtherCommission = compCommission - compAcquiring

  return {
    saleGross,
    compSaleGross,
    commission,
    compCommission,
    logistics,
    compLogistics,
    storage,
    compStorage,
    paidAcceptance,
    compPaidAcceptance,
    penalties,
    compPenalties,
    otherAdjustments,
    compOtherAdjustments,
    wbPromotion,
    compWbPromotion,
    wbJam,
    compWbJam,
    wbOtherServices,
    compWbOtherServices,
    wbCommissionAdj,
    compWbCommissionAdj,
    loyaltyFee,
    compLoyaltyFee,
    loyaltyPointsWithheld,
    compLoyaltyPointsWithheld,
    totalDeductions,
    compTotalDeductions,
    acquiring,
    compAcquiring,
    otherCommission,
    compOtherCommission,
  }
}
