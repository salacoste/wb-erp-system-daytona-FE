// ============================================================================
// Tariff Settings Boundary Normalizer — tests
// ============================================================================
// Verifies the read normalizer absorbs the snake_case GET /v1/tariffs/settings
// shape (request #101) and stays identity-ish on a future camelCase contract.
// FAILS on the old no-normalizer code (snake input → all camel reads undefined).
// ============================================================================

import { describe, expect, it } from 'vitest'
import { normalizeTariffSettingsResponse } from '../tariffs-settings-normalizer'

// Exact live response verified against the running backend (snake_case).
const LIVE_SNAKE_RESPONSE = {
  default_commission_fbo_pct: 25,
  default_commission_fbs_pct: 28,
  acceptance_box_rate_per_liter: 1.7,
  acceptance_pallet_rate: 500,
  logistics_volume_tiers: [
    { min: 0.001, max: 0.2, rate: 23 },
    { min: 0.201, max: 0.4, rate: 26 },
    { min: 0.401, max: 0.6, rate: 29 },
    { min: 0.601, max: 0.8, rate: 30 },
    { min: 0.801, max: 1, rate: 32 },
  ],
  logistics_large_first_liter_rate: 46,
  logistics_large_additional_liter_rate: 14,
  return_logistics_fbo_rate: 50,
  return_logistics_fbs_rate: 50,
  storage_free_days: 60,
  fbs_uses_fbo_logistics_rates: true,
  effective_from: '2025-10-23T00:00:00.000Z',
}

describe('normalizeTariffSettingsResponse', () => {
  it('maps the real snake_case live shape to camelCase (the actual bug)', () => {
    const result = normalizeTariffSettingsResponse(LIVE_SNAKE_RESPONSE)

    expect(result.acceptanceBoxRatePerLiter).toBe(1.7)
    expect(result.acceptancePalletRate).toBe(500)
    expect(result.defaultCommissionFboPct).toBe(25)
    expect(result.defaultCommissionFbsPct).toBe(28)
    expect(result.logisticsLargeFirstLiterRate).toBe(46)
    expect(result.logisticsLargeAdditionalLiterRate).toBe(14)
    expect(result.returnLogisticsFboRate).toBe(50)
    expect(result.returnLogisticsFbsRate).toBe(50)
    expect(result.storageFreeDays).toBe(60)
    expect(result.fbsUsesFboLogisticsRates).toBe(true)
    expect(result.effectiveFrom).toBe('2025-10-23T00:00:00.000Z')
  })

  it('maps snake-case tier {min,max,rate} → {fromLiters,toLiters,rateRub}', () => {
    const result = normalizeTariffSettingsResponse(LIVE_SNAKE_RESPONSE)

    expect(result.logisticsVolumeTiers).toHaveLength(5)
    expect(result.logisticsVolumeTiers[0]).toEqual({
      fromLiters: 0.001,
      toLiters: 0.2,
      rateRub: 23,
    })
    expect(result.logisticsVolumeTiers[4].rateRub).toBe(32)
  })

  it('is identity-ish on a future camelCase contract (backward/forward compat)', () => {
    const camel = {
      acceptanceBoxRatePerLiter: 1.7,
      acceptancePalletRate: 500,
      logisticsVolumeTiers: [{ fromLiters: 0.001, toLiters: 0.2, rateRub: 23 }],
      logisticsLargeFirstLiterRate: 46,
      logisticsLargeAdditionalLiterRate: 14,
      returnLogisticsFboRate: 50,
      returnLogisticsFbsRate: 50,
      defaultCommissionFboPct: 25,
      defaultCommissionFbsPct: 28,
      storageFreeDays: 60,
      fbsUsesFboLogisticsRates: true,
      effectiveFrom: '2025-10-23T00:00:00.000Z',
    }
    const result = normalizeTariffSettingsResponse(camel)

    expect(result.acceptanceBoxRatePerLiter).toBe(1.7)
    expect(result.defaultCommissionFboPct).toBe(25)
    expect(result.logisticsVolumeTiers[0]).toEqual({
      fromLiters: 0.001,
      toLiters: 0.2,
      rateRub: 23,
    })
    expect(result.fbsUsesFboLogisticsRates).toBe(true)
  })

  it('leaves backend-omitted fields undefined (NOT 0) so form defaults fire', () => {
    const result = normalizeTariffSettingsResponse(LIVE_SNAKE_RESPONSE)

    // These are absent from the live response — must stay undefined, not 0/NaN.
    expect(result.fixationClothingDays).toBeUndefined()
    expect(result.fixationOtherDays).toBeUndefined()
    expect(result.logisticsFbsVolumeTiers).toBeUndefined()
    expect(result.logisticsFbsLargeFirstLiterRate).toBeUndefined()
    expect(result.logisticsFbsLargeAdditionalLiterRate).toBeUndefined()
    expect(result.clothingCategories).toBeUndefined()
    expect(result.source).toBeUndefined()
    expect(result.notes).toBeUndefined()
  })

  it('defaults fbsUsesFboLogisticsRates to false when absent', () => {
    const result = normalizeTariffSettingsResponse({})
    expect(result.fbsUsesFboLogisticsRates).toBe(false)
  })

  it('leaves logisticsVolumeTiers undefined (NOT []) when absent so the form default fires', () => {
    // an empty [] is not nullish → would suppress getDefaultFormValues' `?? [default tier]`.
    const result = normalizeTariffSettingsResponse({ acceptance_box_rate_per_liter: 1.7 })
    expect(result.logisticsVolumeTiers).toBeUndefined()
  })

  it('maps FBS volume tiers {min,max,rate}→{fromLiters,toLiters,rateRub} when present', () => {
    const result = normalizeTariffSettingsResponse({
      logistics_fbs_volume_tiers: [{ min: 0.001, max: 0.3, rate: 40 }],
    })
    expect(result.logisticsFbsVolumeTiers?.[0]).toEqual({
      fromLiters: 0.001,
      toLiters: 0.3,
      rateRub: 40,
    })
  })
})
