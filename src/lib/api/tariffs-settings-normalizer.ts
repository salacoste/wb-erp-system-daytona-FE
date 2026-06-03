// ============================================================================
// Tariff Settings Admin — Boundary Normalizer
// ============================================================================
// GET /v1/tariffs/settings returns snake_case fields, but the FE form consumes
// the camelCase TariffSettingsDto. Without normalization every camelCase lookup
// against the snake_case payload is `undefined`, so the admin form falls through
// to hardcoded defaults (fake tariffs) — see request-backend #101.
//
// Dual-lookup (camelCase ?? snake_case): camelCase first so a future backend
// that switches to camelCase (per the contradictory #101 doc) still works.
//
// CRITICAL: fields the backend OMITS stay `undefined` (NOT 0/NaN) so the form's
// `?? default` still fires. AP#8-adjacent — never coerce missing values to 0.
//
// See CLAUDE.md § Boundary Normalizer Pattern for conventions.
// ============================================================================

import type { LogisticsVolumeTier, TariffSettingsDto } from '@/types/tariffs-admin'

/**
 * Number-coerce with absence preservation: if both camelCase and snake_case
 * are absent (== null), return undefined (NOT Number(undefined) → NaN, NOT 0).
 */
function num(camel: unknown, snake: unknown): number | undefined {
  const v = camel ?? snake
  return v == null ? undefined : Number(v)
}

/** Map a raw tier ({fromLiters,toLiters,rateRub} ?? {min,max,rate}) → canonical tier. */
function normalizeTier(raw: Record<string, unknown>): LogisticsVolumeTier {
  return {
    fromLiters: Number(raw.fromLiters ?? raw.min),
    toLiters: Number(raw.toLiters ?? raw.max),
    rateRub: Number(raw.rateRub ?? raw.rate),
  }
}

function normalizeTiers(camel: unknown, snake: unknown): LogisticsVolumeTier[] | undefined {
  const arr = camel ?? snake
  if (!Array.isArray(arr)) return undefined
  return arr.map(t => normalizeTier((t ?? {}) as Record<string, unknown>))
}

/**
 * Normalize GET /v1/tariffs/settings response into the camelCase TariffSettingsDto.
 * Read-only path — do NOT use for the PUT/PATCH write payload (backend natively accepts
 * camelCase writes — verified vs UpdateTariffSettingsDto + test-api/21-tariffs-admin.http).
 *
 * SIBLING: src/lib/api/tariffs-normalizer.ts `normalizeTariffSettings` transforms the SAME
 * endpoint into the snake_case `TariffSettings` type for the price-calculator path. If the
 * backend renames a field, BOTH normalizers must change. (Admin → camelCase DTO; price-calc → snake.)
 */
export function normalizeTariffSettingsResponse(raw: unknown): TariffSettingsDto {
  const r = (raw ?? {}) as Record<string, unknown>

  const fbsUses = r.fbsUsesFboLogisticsRates ?? r.fbs_uses_fbo_logistics_rates

  return {
    // Acceptance
    acceptanceBoxRatePerLiter: num(
      r.acceptanceBoxRatePerLiter,
      r.acceptance_box_rate_per_liter
    ) as number,
    acceptancePalletRate: num(r.acceptancePalletRate, r.acceptance_pallet_rate) as number,

    // Logistics — absent tiers stay undefined (NOT []) so getDefaultFormValues' `?? [default]`
    // fires, consistent with the absence-preservation principle above (an empty [] would suppress it).
    logisticsVolumeTiers: normalizeTiers(
      r.logisticsVolumeTiers,
      r.logistics_volume_tiers
    ) as LogisticsVolumeTier[],
    logisticsLargeFirstLiterRate: num(
      r.logisticsLargeFirstLiterRate,
      r.logistics_large_first_liter_rate
    ) as number,
    logisticsLargeAdditionalLiterRate: num(
      r.logisticsLargeAdditionalLiterRate,
      r.logistics_large_additional_liter_rate
    ) as number,

    // Returns
    returnLogisticsFboRate: num(r.returnLogisticsFboRate, r.return_logistics_fbo_rate) as number,
    returnLogisticsFbsRate: num(r.returnLogisticsFbsRate, r.return_logistics_fbs_rate) as number,

    // Commission
    defaultCommissionFboPct: num(r.defaultCommissionFboPct, r.default_commission_fbo_pct) as number,
    defaultCommissionFbsPct: num(r.defaultCommissionFbsPct, r.default_commission_fbs_pct) as number,

    // Storage
    storageFreeDays: num(r.storageFreeDays, r.storage_free_days) as number,
    // Backend OMITS these — leave undefined so the form default fires (optional in DTO).
    fixationClothingDays: num(r.fixationClothingDays, r.fixation_clothing_days),
    fixationOtherDays: num(r.fixationOtherDays, r.fixation_other_days),

    // FBS-specific
    fbsUsesFboLogisticsRates: fbsUses == null ? false : fbsUses === true,
    logisticsFbsVolumeTiers: normalizeTiers(
      r.logisticsFbsVolumeTiers,
      r.logistics_fbs_volume_tiers
    ),
    logisticsFbsLargeFirstLiterRate: num(
      r.logisticsFbsLargeFirstLiterRate,
      r.logistics_fbs_large_first_liter_rate
    ),
    logisticsFbsLargeAdditionalLiterRate: num(
      r.logisticsFbsLargeAdditionalLiterRate,
      r.logistics_fbs_large_additional_liter_rate
    ),
    clothingCategories: (r.clothingCategories ?? r.clothing_categories) as string[] | undefined,

    // Meta
    effectiveFrom: (r.effectiveFrom ?? r.effective_from) as string | undefined,
    source: (r.source ?? undefined) as 'manual' | 'api' | undefined,
    notes: (r.notes ?? undefined) as string | undefined,
  }
}
