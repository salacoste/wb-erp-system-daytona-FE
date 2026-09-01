import type { Story1743OwnerStateException } from './owner-state-exceptions'

type IndependentlySourcedOwnerStateException = Story1743OwnerStateException & {
  sourceAssertion: string
}

const ACQUIRING_LIST_ITEM_ASSERTION = `export interface AcquiringReportListItem {
  reportId: number
  sellerFinanceName: string
  dateFrom: string // ISO date — report period start
  dateTo: string // ISO date — report period end
  createDate: string // ISO date — report generation date
  currency: string // e.g. "RUB"
  acquiringFeeSum: number | null // money — null = unknown
  acquiringFeeVatSum: number | null // money — null = unknown
}`

export const STORY_174_3_OWNER_STATE_EXCEPTIONS_A: readonly IndependentlySourcedOwnerStateException[] = [
  {
    route: '/analytics/acquiring',
    rawOwnerState: 'report-processing',
    normalizedState: 'pending',
    reason:
      '/analytics/acquiring owner clause [report-processing]: the reports list receives only terminal report rows and exposes no processing status in its current API contract.',
    canonicalOwnerDecision:
      '/analytics/acquiring owner clause [report-processing]: keep this exact pending state unavailable until the acquiring reports contract exposes a non-terminal processing value.',
    source: 'src/types/acquiring-analytics.ts',
    sourceAssertion: ACQUIRING_LIST_ITEM_ASSERTION,
  },
  {
    route: '/analytics/acquiring',
    rawOwnerState: 'unknown report-status states',
    normalizedState: 'default',
    reason:
      '/analytics/acquiring owner clause [unknown report-status states]: the typed report row has no status field, so the route cannot receive or render an unknown report-status value.',
    canonicalOwnerDecision:
      '/analytics/acquiring owner clause [unknown report-status states]: retain a typed exception until the acquiring report response adds a status discriminator.',
    source: 'src/types/acquiring-analytics.ts',
    sourceAssertion: ACQUIRING_LIST_ITEM_ASSERTION,
  },
  {
    route: '/analytics/fbs-enhanced',
    rawOwnerState: 'stock-risk states',
    normalizedState: 'default',
    reason:
      '/analytics/fbs-enhanced owner clause [stock-risk states]: the current enhanced-FBS response omits the stock fields required to calculate a stock-risk classification.',
    canonicalOwnerDecision:
      '/analytics/fbs-enhanced owner clause [stock-risk states]: retain a typed exception until the backend contract supplies the required stock-risk inputs.',
    source: 'docs/request-backend/202-FBS-ENHANCED-CONTRACT-MISMATCH.md',
    sourceAssertion:
      '- `lowStockSkus`, `outOfStockSkus`, `avgDaysOfCover` (Stock Analytics) — backend sends none of these.',
  },
]
