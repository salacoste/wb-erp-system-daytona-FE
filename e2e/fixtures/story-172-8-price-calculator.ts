import type { Page } from '@playwright/test'

/**
 * Keep presentation scenarios deterministic without consuming the backend's
 * rate-limited tariff-reference budget. Live tariff contracts are exercised by
 * separate backend-connected smoke coverage.
 */
export async function mockPriceCalculatorTariffReferences(page: Page) {
  const tariffSettings = {
    default_commission_fbo_pct: 15,
    default_commission_fbs_pct: 18,
    acceptance_box_rate_per_liter: 0.11,
    acceptance_pallet_rate: 0,
    logistics_volume_tiers: [{ min: 0, max: 5, rate: 46 }],
    logistics_large_first_liter_rate: 46,
    logistics_large_additional_liter_rate: 14,
    return_logistics_fbo_rate: 50,
    return_logistics_fbs_rate: 50,
    storage_free_days: 30,
    fbs_uses_fbo_logistics_rates: false,
    effective_from: '2026-01-01',
  }

  const warehouse = {
    id: 507,
    name: 'Коледино',
    city: 'Коледино',
    federal_district: 'ЦФО',
    cargo_type: 'box',
    tariffs: {
      fbo: { delivery_base_rub: 46, delivery_liter_rub: 14, logistics_coefficient: 1 },
      fbs: { delivery_base_rub: 30, delivery_liter_rub: 10, logistics_coefficient: 1 },
      storage: { base_per_day_rub: 0.07, liter_per_day_rub: 0.05, coefficient: 1 },
      effective_from: '2026-01-01',
    },
  }

  const coefficients = [
    {
      warehouseId: 507,
      warehouseName: 'Коледино',
      date: '2026-01-01',
      coefficient: 1,
      isAvailable: true,
      allowUnload: true,
      boxTypeId: 2,
      boxTypeName: 'Короб',
      delivery: { coefficient: 1, baseLiterRub: 46, additionalLiterRub: 14 },
      storage: { coefficient: 1, baseLiterRub: 0.07, additionalLiterRub: 0.05 },
      isSortingCenter: false,
    },
  ]

  await page.route('**/v1/tariffs/warehouses-with-tariffs**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ warehouses: [warehouse], updated_at: '2026-01-01T00:00:00Z' }),
    })
  )
  await page.route('**/v1/tariffs/acceptance/coefficients/all**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        coefficients,
        meta: {
          total: coefficients.length,
          available: coefficients.length,
          unavailable: 0,
          cache_ttl_seconds: 3600,
        },
      }),
    })
  )
  await page.route('**/v1/tariffs/commissions**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        commissions: [
          {
            parentID: 1,
            parentName: 'Одежда',
            subjectID: 11,
            subjectName: 'Футболки',
            paidStorageKgvp: 15,
            kgvpMarketplace: 18,
            kgvpSupplier: 15,
            kgvpSupplierExpress: 20,
          },
        ],
        meta: { total: 1, cached: true, cache_ttl_seconds: 86400 },
      }),
    })
  )
  await page.route('**/v1/tariffs/settings**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tariffSettings),
    })
  )
}
