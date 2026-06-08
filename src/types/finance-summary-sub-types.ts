/**
 * Finance Summary Sub-Types
 * Extracted from finance-summary.ts for file-size compliance.
 *
 * @see finance-summary.ts for the main FinanceSummary interface
 */

import type { TaxSystem } from './cabinet'

/**
 * Logistics breakdown subcategories — Story 65.6
 * Backend request #139: breakdown of logistics_cost by delivery type.
 * All fields nullable for graceful degradation when backend doesn't return breakdown.
 */
// story-65.6: logistics breakdown
export interface LogisticsBreakdown {
  /** Delivery to buyer on sale (doc_type=sale) */
  to_buyer: number | null
  /** Delivery to buyer on cancel (doc_type=cancel) */
  to_buyer_cancel: number | null
  /** Return from buyer on cancel (doc_type=cancel) */
  from_buyer_cancel: number | null
  /** Return from buyer on return (doc_type=return) */
  from_buyer_return: number | null
}

/**
 * Tax + VAT metrics from backend (Epic 72 + Task-50).
 * Located in summary_total.tax ONLY (summary_rus/eaeu are always null).
 */
export interface TaxMetrics {
  // Income tax fields (Epic 72)
  tax_amount: number | null
  tax_base: number | null
  effective_tax_rate: number | null
  /**
   * Income tax system. See {@link TaxSystem} from cabinet.ts.
   * Backend confirms `'usn6' | 'usn15' | 'manual'` per request-backend/173 § F1.
   * Hardened from loose `string | null` to typed union in Story 96.1-FE.
   */
  tax_system: TaxSystem | null
  is_minimum_rule: boolean
  net_profit_after_tax: number | null

  // VAT/НДС fields (Task-50)
  vat_payer: boolean
  vat_rate: number | null // 0, 5, 20, 22
  vat_output: number | null // НДС от продаж
  vat_payable: number | null // НДС к уплате (output - input)
  revenue_excl_vat: number | null // Выручка без НДС
  net_profit_after_all_tax: number | null // После ВСЕХ налогов

  // Request #159: Preliminary tax for incomplete weeks
  preliminary?: boolean
  data_completeness?: {
    revenueSource: string
    hasLogistics: boolean
    hasStorage: boolean
    hasAcceptance: boolean
    hasPenalties: boolean
    hasCogs: boolean
    hasAdvertising: boolean
  }
}
