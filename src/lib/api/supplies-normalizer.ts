/**
 * Supplies Boundary Normalizers — Story 89.1-FE
 * Absorbs backend shape drift for supply list/detail endpoints.
 * Mutations (create/close/addOrders/removeOrders) remain passthrough — they return
 * the mutated entity whose shape is controlled by the frontend's request body.
 */

import type { SuppliesListResponse, SupplyDetailResponse } from '@/types/supplies'

export function normalizeSuppliesListResponse(raw: unknown): SuppliesListResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const items = Array.isArray(r.items) ? r.items : []
  const pagination = (r.pagination ?? r.meta ?? {}) as Record<string, unknown>

  return {
    items: items.map((item: unknown) => {
      const i = (item ?? {}) as Record<string, unknown>
      // Spread FIRST so explicit normalizations below win over raw values
      return {
        ...i,
        id: String(i.id ?? i.supplyId ?? ''),
        name: String(i.name ?? ''),
        status: String(i.status ?? 'unknown'),
        createdAt: String(i.createdAt ?? i.created_at ?? ''),
        closedAt: (i.closedAt ?? i.closed_at ?? null) as string | null,
        scanDt: (i.scanDt ?? i.scan_dt ?? null) as string | null,
        ordersCount: Number(i.ordersCount ?? i.orders_count ?? 0),
        cargoType: Number(i.cargoType ?? i.cargo_type ?? 0),
        isLargeCargo: Boolean(i.isLargeCargo ?? i.is_large_cargo ?? false),
      }
    }) as unknown as SuppliesListResponse['items'],
    pagination: {
      total: Number(pagination.total ?? 0),
      limit: Number(pagination.limit ?? 50),
      offset: Number(pagination.offset ?? 0),
    },
  } as unknown as SuppliesListResponse
}

export function normalizeSupplyDetailResponse(raw: unknown): SupplyDetailResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    ...r,
    id: String(r.id ?? r.supplyId ?? ''),
    name: String(r.name ?? ''),
    status: String(r.status ?? 'unknown'),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    closedAt: (r.closedAt ?? r.closed_at ?? null) as string | null,
  } as unknown as SupplyDetailResponse
}
