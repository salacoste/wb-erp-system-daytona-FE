/**
 * Tax Analytics Boundary Normalizer
 *
 * Normalizes response from GET /v1/analytics/tax/preliminary
 */

import { asRecord, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type { TaxMetrics } from '@/types/finance-summary'
import type { PreliminaryTaxResponse } from './tax-analytics'

function normalizeTaxMetrics(raw: unknown): TaxMetrics | null {
  if (raw == null) return null
  const r = asRecord(raw)
  const dc = asRecord(r.data_completeness)
  return {
    tax_amount: toNullableNumber(r.tax_amount),
    tax_base: toNullableNumber(r.tax_base),
    effective_tax_rate: toNullableNumber(r.effective_tax_rate),
    tax_system: toOptionalString(r.tax_system) as TaxMetrics['tax_system'],
    is_minimum_rule: Boolean(r.is_minimum_rule),
    net_profit_after_tax: toNullableNumber(r.net_profit_after_tax),
    vat_payer: Boolean(r.vat_payer),
    vat_rate: toNullableNumber(r.vat_rate),
    vat_output: toNullableNumber(r.vat_output),
    vat_payable: toNullableNumber(r.vat_payable),
    revenue_excl_vat: toNullableNumber(r.revenue_excl_vat),
    net_profit_after_all_tax: toNullableNumber(r.net_profit_after_all_tax),
    preliminary: Boolean(r.preliminary),
    data_completeness:
      r.data_completeness == null
        ? undefined
        : {
            revenueSource: toStr(dc.revenueSource),
            hasLogistics: Boolean(dc.hasLogistics),
            hasStorage: Boolean(dc.hasStorage),
            hasAcceptance: Boolean(dc.hasAcceptance),
            hasPenalties: Boolean(dc.hasPenalties),
            hasCogs: Boolean(dc.hasCogs),
            hasAdvertising: Boolean(dc.hasAdvertising),
          },
  }
}

export function normalizePreliminaryTaxResponse(raw: unknown): PreliminaryTaxResponse {
  const r = asRecord(raw)
  return { tax: normalizeTaxMetrics(r.tax) }
}
