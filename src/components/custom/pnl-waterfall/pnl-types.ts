/**
 * PnL Waterfall Types
 *
 * Shared prop interfaces for P&L section components.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

import type { CabinetSummaryTotals, CabinetProductStats } from '@/types/analytics'

export interface PnLWaterfallProps {
  data: CabinetSummaryTotals
  products: CabinetProductStats
  className?: string
}

export interface RevenueSectionProps {
  data: CabinetSummaryTotals
}

export interface DeductionsSectionProps {
  data: CabinetSummaryTotals
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
  showSppCompensation: boolean
  sppCompensation: number
  sppCompensationPct: number | null
  totalWBDeductions: number
  totalDeductionsPct: number | null
}

export interface PayoutSectionProps {
  sellerPayout: number
  totalDeductionsPct: number | null
  payoutPct: number | null
}

export interface GrossProfitSectionProps {
  hasCogs: boolean
  sellerPayout: number
  cogsTotal: number | null
  cogsPct: number | null
  grossProfit: number | null
  grossMarginPct: number | null
  profitToRevenuePct: number | null
  products: CabinetProductStats
}

export interface KeyMetricsSectionProps {
  data: CabinetSummaryTotals
  // FE-computed from the card's payout-based grossProfit (see usePnLCalculations).
  // Intentionally supersedes data.roi / data.profit_per_unit (backend fields,
  // margin-fact-based — a different profit base, ~44% divergence) so the card's
  // ROI/PPU agree with the grossProfit it displays.
  roi: number | null
  profitPerUnit: number | null
}
