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
}
