/**
 * Tariffs Boundary Normalizers — Story 89.1-FE
 *
 * Absorbs backend shape drift for tariff endpoints. Backend is a NestJS proxy
 * for WB SDK — any SDK version bump can rename fields. Normalizers are the
 * hinge that keeps both contracts valid simultaneously.
 *
 * See CLAUDE.md § Boundary Normalizer Pattern for conventions.
 */

import type {
  CommissionsResponse,
  CategoryCommission,
  CommissionsMeta,
  WarehousesResponse,
  Warehouse,
  AcceptanceCoefficientsResponse,
  AcceptanceCoefficient,
} from '@/types/tariffs'

// ============================================================================
// Commissions
// ============================================================================

function normalizeCommission(raw: Record<string, unknown>): CategoryCommission {
  return {
    parentID: Number(raw.parentID ?? raw.parentId ?? raw.parent_id ?? 0),
    parentName: String(raw.parentName ?? raw.parent_name ?? ''),
    subjectID: Number(raw.subjectID ?? raw.subjectId ?? raw.subject_id ?? 0),
    subjectName: String(raw.subjectName ?? raw.subject_name ?? ''),
    paidStorageKgvp: Number(raw.paidStorageKgvp ?? raw.paid_storage_kgvp ?? 0),
    kgvpMarketplace: Number(raw.kgvpMarketplace ?? raw.kgvp_marketplace ?? 0),
    kgvpSupplier: Number(raw.kgvpSupplier ?? raw.kgvp_supplier ?? 0),
    kgvpSupplierExpress: Number(raw.kgvpSupplierExpress ?? raw.kgvp_supplier_express ?? 0),
  }
}

export function normalizeCommissionsResponse(raw: unknown): CommissionsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const commissions = Array.isArray(r.commissions) ? r.commissions : []
  const meta = (r.meta ?? {}) as Record<string, unknown>

  return {
    commissions: commissions.map((c: unknown) =>
      normalizeCommission((c ?? {}) as Record<string, unknown>)
    ),
    meta: {
      total: Number(meta.total ?? commissions.length),
      cached: Boolean(meta.cached ?? false),
      cache_ttl_seconds: Number(meta.cache_ttl_seconds ?? meta.cacheTtlSeconds ?? 86400),
      fetched_at: String(meta.fetched_at ?? meta.fetchedAt ?? new Date().toISOString()),
    } as CommissionsMeta,
  }
}

// ============================================================================
// Warehouses
// ============================================================================

function normalizeWarehouse(raw: Record<string, unknown>): Warehouse {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    address: raw.address != null ? String(raw.address) : undefined,
    city: raw.city != null ? String(raw.city) : undefined,
    federalDistrict: (raw.federalDistrict ?? raw.federal_district) as string | undefined,
    cargoType: raw.cargoType != null ? Number(raw.cargoType) : undefined,
    deliveryType: raw.deliveryType != null ? Number(raw.deliveryType) : undefined,
    latitude: raw.latitude != null ? Number(raw.latitude) : undefined,
    longitude: raw.longitude != null ? Number(raw.longitude) : undefined,
  }
}

export function normalizeWarehousesResponse(raw: unknown): WarehousesResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const warehouses = Array.isArray(r.warehouses) ? r.warehouses : []

  return {
    warehouses: warehouses.map((w: unknown) =>
      normalizeWarehouse((w ?? {}) as Record<string, unknown>)
    ),
    updated_at: String(r.updated_at ?? r.updatedAt ?? ''),
  }
}

// ============================================================================
// Acceptance Coefficients
// ============================================================================

function normalizeAcceptanceCoefficient(raw: Record<string, unknown>): AcceptanceCoefficient {
  const delivery = (raw.delivery ?? {}) as Record<string, unknown>
  const storage = (raw.storage ?? {}) as Record<string, unknown>

  return {
    warehouseId: Number(raw.warehouseId ?? raw.warehouse_id ?? 0),
    warehouseName: String(raw.warehouseName ?? raw.warehouse_name ?? ''),
    date: String(raw.date ?? ''),
    coefficient: Number(raw.coefficient ?? 0),
    isAvailable: Boolean(raw.isAvailable ?? raw.is_available ?? false),
    allowUnload: Boolean(raw.allowUnload ?? raw.allow_unload ?? false),
    boxTypeId: Number(raw.boxTypeId ?? raw.box_type_id ?? 0),
    boxTypeName: String(raw.boxTypeName ?? raw.box_type_name ?? ''),
    delivery: {
      coefficient: Number(delivery.coefficient ?? 1),
      baseLiterRub: Number(delivery.baseLiterRub ?? delivery.base_liter_rub ?? 0),
      additionalLiterRub: Number(delivery.additionalLiterRub ?? delivery.additional_liter_rub ?? 0),
    },
    storage: {
      coefficient: Number(storage.coefficient ?? 1),
      baseLiterRub: Number(storage.baseLiterRub ?? storage.base_liter_rub ?? 0),
      additionalLiterRub: Number(storage.additionalLiterRub ?? storage.additional_liter_rub ?? 0),
    },
    isSortingCenter: Boolean(raw.isSortingCenter ?? raw.is_sorting_center ?? false),
  }
}

export function normalizeAcceptanceCoefficientsResponse(
  raw: unknown
): AcceptanceCoefficientsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const coefficients = Array.isArray(r.coefficients) ? r.coefficients : []
  const meta = (r.meta ?? {}) as Record<string, unknown>

  return {
    coefficients: coefficients.map((c: unknown) =>
      normalizeAcceptanceCoefficient((c ?? {}) as Record<string, unknown>)
    ),
    meta: {
      total: Number(meta.total ?? coefficients.length),
      available: Number(meta.available ?? 0),
      unavailable: Number(meta.unavailable ?? 0),
      cache_ttl_seconds: Number(meta.cache_ttl_seconds ?? meta.cacheTtlSeconds ?? 3600),
    },
  }
}

// Tariff settings normalizer extracted for file-size compliance
export { normalizeTariffSettings } from './tariff-settings-normalizer'
