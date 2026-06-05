/**
 * Tariffs Box — Boundary Normalizer
 *
 * Normalizes raw backend responses from warehouses-with-tariffs endpoints into
 * frontend-canonical shapes. Uses normalizer-helpers for safe coercion.
 *
 * Endpoints:
 *   1. GET /v1/tariffs/warehouses-with-tariffs (→ BoxTariffsResponse)
 *   2. GET /v1/tariffs/warehouses-with-tariffs?date=... (→ WarehousesWithTariffsResponse)
 *
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type { BoxTariffItem, BoxTariffsResponse, WarehouseWithTariffs } from '@/types/warehouse'

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function normalizeWarehouseTariffs(raw: unknown): WarehouseWithTariffs['tariffs'] {
  const t = asRecord(raw)
  const fbo = asRecord(t.fbo)
  const fbs = asRecord(t.fbs)
  const storage = asRecord(t.storage)
  return {
    fbo: {
      delivery_base_rub: toCount(fbo.delivery_base_rub),
      delivery_liter_rub: toCount(fbo.delivery_liter_rub),
      logistics_coefficient: toNullableNumber(fbo.logistics_coefficient) ?? 1.0,
    },
    fbs: {
      delivery_base_rub: toCount(fbs.delivery_base_rub),
      delivery_liter_rub: toCount(fbs.delivery_liter_rub),
      logistics_coefficient: toNullableNumber(fbs.logistics_coefficient) ?? 1.0,
    },
    storage: {
      base_per_day_rub: toCount(storage.base_per_day_rub),
      liter_per_day_rub: toCount(storage.liter_per_day_rub),
      coefficient: toNullableNumber(storage.coefficient) ?? 1.0,
    },
    effective_from: toOptionalString(t.effective_from ?? t.effectiveFrom),
    effective_until: toOptionalString(t.effective_until ?? t.effectiveUntil),
  }
}

function normalizeWarehouseWithTariffs(raw: unknown): WarehouseWithTariffs {
  const w = asRecord(raw)
  return {
    id: toCount(w.id),
    name: toStr(w.name),
    city: toOptionalString(w.city),
    federal_district: toOptionalString(w.federal_district ?? w.federalDistrict),
    cargo_type: toOptionalString(w.cargo_type ?? w.cargoType),
    tariffs: normalizeWarehouseTariffs(w.tariffs),
  }
}

function normalizeBoxTariffItem(w: unknown): BoxTariffItem {
  const r = asRecord(w)
  const tariffs = normalizeWarehouseTariffs(r.tariffs)
  return {
    warehouseName: toStr(r.name ?? r.warehouseName),
    geoName: toOptionalString(r.federal_district ?? r.federalDistrict ?? r.geoName),
    logistics: {
      coefficient: tariffs.fbo?.logistics_coefficient ?? 1.0,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: delivery_base 0 = warehouse doesn't serve FBO
      baseLiterRub: tariffs.fbo?.delivery_base_rub ?? 0,
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: delivery_liter 0 = warehouse doesn't serve FBO
      additionalLiterRub: tariffs.fbo?.delivery_liter_rub ?? 0,
    },
    storage: {
      coefficient: tariffs.storage?.coefficient || 1.0,
      baseLiterRub: tariffs.storage?.base_per_day_rub || 0,
      additionalLiterRub: tariffs.storage?.liter_per_day_rub || 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Exported normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes the warehouses-with-tariffs response into BoxTariffsResponse
 * (used by getBoxTariffs — transforms warehouse data to box tariff items).
 */
export function normalizeBoxTariffsResponse(raw: unknown, date?: string): BoxTariffsResponse {
  const r = asRecord(raw)
  const warehouses = Array.isArray(r.warehouses) ? r.warehouses : []
  const tariffs = warehouses.map(normalizeBoxTariffItem)
  return {
    tariffs,
    meta: {
      date: date || new Date().toISOString().split('T')[0],
      cached: true,
      cache_ttl_seconds: 3600,
    },
  }
}

/** Response shape for getWarehousesWithTariffs */
export interface WarehousesWithTariffsResponse {
  warehouses: WarehouseWithTariffs[]
  updated_at?: string
}

/**
 * Normalizes the warehouses-with-tariffs response into WarehousesWithTariffsResponse
 * (used by getWarehousesWithTariffs — returns raw warehouse objects with tariffs).
 */
export function normalizeWarehousesWithTariffsResponse(
  raw: unknown
): WarehousesWithTariffsResponse {
  const r = asRecord(raw)
  const warehouses = Array.isArray(r.warehouses) ? r.warehouses : []
  return {
    warehouses: warehouses.map(normalizeWarehouseWithTariffs),
    updated_at: toOptionalString(r.updated_at ?? r.updatedAt),
  }
}
