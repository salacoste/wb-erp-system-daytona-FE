/**
 * Tariff Settings Normalizer
 * Extracted from tariffs-normalizer.ts for file-size compliance.
 * Story 89.1-FE: Boundary Normalizer Pattern
 */

import type { TariffSettings, VolumeTier } from '@/types/tariffs'

/**
 * Normalize tariff settings response into frontend-canonical shape.
 * Handles both snake_case (backend) and camelCase (SDK) field names.
 */
export function normalizeTariffSettings(raw: unknown): TariffSettings {
  const r = (raw ?? {}) as Record<string, unknown>
  const tiers = Array.isArray(r.logistics_volume_tiers ?? r.logisticsVolumeTiers)
    ? ((r.logistics_volume_tiers ?? r.logisticsVolumeTiers) as Record<string, unknown>[])
    : []

  return {
    default_commission_fbo_pct: Number(
      r.default_commission_fbo_pct ?? r.defaultCommissionFboPct ?? 0
    ),
    default_commission_fbs_pct: Number(
      r.default_commission_fbs_pct ?? r.defaultCommissionFbsPct ?? 0
    ),
    acceptance_box_rate_per_liter: Number(
      r.acceptance_box_rate_per_liter ?? r.acceptanceBoxRatePerLiter ?? 0
    ),
    acceptance_pallet_rate: Number(r.acceptance_pallet_rate ?? r.acceptancePalletRate ?? 0),
    logistics_volume_tiers: tiers.map((t): VolumeTier => ({
      min: Number(t.min ?? 0),
      max: Number(t.max ?? 0),
      rate: Number(t.rate ?? 0),
    })),
    logistics_large_first_liter_rate: Number(
      r.logistics_large_first_liter_rate ?? r.logisticsLargeFirstLiterRate ?? 0
    ),
    logistics_large_additional_liter_rate: Number(
      r.logistics_large_additional_liter_rate ?? r.logisticsLargeAdditionalLiterRate ?? 0
    ),
    return_logistics_fbo_rate: Number(r.return_logistics_fbo_rate ?? r.returnLogisticsFboRate ?? 0),
    return_logistics_fbs_rate: Number(r.return_logistics_fbs_rate ?? r.returnLogisticsFbsRate ?? 0),
    storage_free_days: Number(r.storage_free_days ?? r.storageFreeDays ?? 0),
    fbs_uses_fbo_logistics_rates: Boolean(
      r.fbs_uses_fbo_logistics_rates ?? r.fbsUsesFboLogisticsRates ?? false
    ),
    effective_from: String(r.effective_from ?? r.effectiveFrom ?? ''),
  }
}
