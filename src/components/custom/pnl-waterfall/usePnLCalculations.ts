/**
 * PnL Waterfall Calculations — extracted for 200-line file limit compliance
 *
 * Pure functions computing all P&L display values (percentages, SPP, gross profit).
 */

import { toCount } from '@/lib/api/normalizer-helpers'
import type { CabinetSummaryTotals, CabinetProductStats } from '@/types/analytics'

export interface PnLCalculations {
  hasCogs: boolean
  revenueBase: number
  commissionPct: number | null
  logisticsPct: number | null
  storagePct: number | null
  acceptancePct: number | null
  penaltiesPct: number | null
  acquiringPct: number | null
  loyaltyFeePct: number | null
  loyaltyCompensationPct: number | null
  otherAdjustmentsPct: number | null
  sellerPayout: number
  totalWBDeductions: number
  sumOfVisibleDeductions: number
  sppCompensation: number
  showSppCompensation: boolean
  sppCompensationPct: number | null
  totalDeductionsPct: number | null
  payoutPct: number | null
  cogsPct: number | null
  grossProfit: number | null
  grossMarginPct: number | null
  profitToRevenuePct: number | null
}

export function calculatePnL(
  data: CabinetSummaryTotals,
  products: CabinetProductStats
): PnLCalculations {
  const hasCogs = products.coverage_pct >= 100
  const revenueBase = data.sale_gross || 1

  const pct = (field: number | null | undefined): number | null =>
    field ? (field / revenueBase) * 100 : null

  const commissionPct = pct(data.total_commission_rub)
  const logisticsPct = pct(data.logistics_cost)
  const storagePct = pct(data.storage_cost)
  const acceptancePct = pct(data.paid_acceptance_cost)
  const penaltiesPct = pct(data.penalties)
  const acquiringPct = pct(data.acquiring_fee)
  const loyaltyFeePct = pct(data.loyalty_fee)
  const loyaltyCompensationPct = pct(data.loyalty_compensation)
  const otherAdjustmentsPct = pct(data.other_adjustments)

  const sellerPayout = data.payout_total || 0
  const totalWBDeductions = revenueBase - sellerPayout

  const sumOfVisibleDeductions =
    toCount(data.total_commission_rub) +
    toCount(data.logistics_cost) +
    toCount(data.storage_cost) +
    toCount(data.paid_acceptance_cost) +
    toCount(data.penalties) +
    toCount(data.acquiring_fee) +
    toCount(data.loyalty_fee) -
    toCount(data.loyalty_compensation) +
    toCount(data.other_adjustments)

  const sppCompensation = sumOfVisibleDeductions - totalWBDeductions
  const showSppCompensation = Math.abs(sppCompensation) > 1
  const sppCompensationPct =
    showSppCompensation && revenueBase > 0 ? (sppCompensation / revenueBase) * 100 : null

  const totalDeductionsPct = revenueBase > 0 ? (totalWBDeductions / revenueBase) * 100 : null
  const payoutPct = revenueBase > 0 ? (sellerPayout / revenueBase) * 100 : null
  const cogsPct = pct(data.cogs_total)

  const grossProfit = hasCogs ? sellerPayout - (data.cogs_total || 0) : null
  const grossMarginPct =
    grossProfit !== null && sellerPayout ? (grossProfit / sellerPayout) * 100 : null
  const profitToRevenuePct =
    grossProfit !== null && revenueBase ? (grossProfit / revenueBase) * 100 : null

  return {
    hasCogs,
    revenueBase,
    commissionPct,
    logisticsPct,
    storagePct,
    acceptancePct,
    penaltiesPct,
    acquiringPct,
    loyaltyFeePct,
    loyaltyCompensationPct,
    otherAdjustmentsPct,
    sellerPayout,
    totalWBDeductions,
    sumOfVisibleDeductions,
    sppCompensation,
    showSppCompensation,
    sppCompensationPct,
    totalDeductionsPct,
    payoutPct,
    cogsPct,
    grossProfit,
    grossMarginPct,
    profitToRevenuePct,
  }
}
