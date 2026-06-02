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
  // iter-68: the backend detail endpoint returns NESTED `{ supply: {…scalars}, orders, documents }`
  // (confirmed against supply.service.ts getSupplyById + test-api/16-supplies.http). The FE type +
  // components (SupplyHeader, page) expect a FLAT Supply — id/wbSupplyId/status/… alongside
  // orders/documents — so flatten `supply.*` to the top level. The old code read r.id/r.status
  // directly (flat) → undefined → blank header + status 'unknown'. Falls back to `r` when the shape
  // is already flat (existing mocks / passthrough) for backward compatibility.
  const s = (r.supply ?? r) as Record<string, unknown>
  // Spread the supply SCALARS (incl totalItems/warehouseId) — NOT `...r`, so the stray nested
  // `supply` key never lands on the result. orders/documents are mapped explicitly below.
  return {
    ...s,
    id: String(s.id ?? s.supplyId ?? r.id ?? ''),
    wbSupplyId: (s.wbSupplyId ?? s.wb_supply_id ?? null) as string | null,
    name: String(s.name ?? r.name ?? ''),
    status: String(s.status ?? r.status ?? 'unknown'),
    ordersCount: Number(s.ordersCount ?? s.orders_count ?? 0),
    createdAt: String(s.createdAt ?? s.created_at ?? r.createdAt ?? r.created_at ?? ''),
    closedAt: (s.closedAt ?? s.closed_at ?? r.closedAt ?? r.closed_at ?? null) as string | null,
    // iter-68: the backend orders/documents arrays drift from the FE shape (orders send `article`
    // not `vendorCode` + no productName/orderUid; documents send `docType`/`fileSize` not
    // `type`/`sizeBytes`). Without mapping, the detail orders table + documents list render blank.
    orders: (Array.isArray(r.orders) ? r.orders : []).map(normalizeSupplyOrder),
    documents: (Array.isArray(r.documents) ? r.documents : []).map(normalizeSupplyDocument),
  } as unknown as SupplyDetailResponse
}

/** Map a backend supply order ({orderId, nmId, article, salePrice, supplierStatus, addedAt}) to the FE SupplyOrder. */
function normalizeSupplyOrder(raw: unknown): Record<string, unknown> {
  const o = (raw ?? {}) as Record<string, unknown>
  return {
    orderId: String(o.orderId ?? ''),
    orderUid: String(o.orderUid ?? o.orderId ?? ''),
    nmId: Number(o.nmId ?? 0),
    // backend field is `article`; FE renders it as the SKU/"vendorCode".
    vendorCode: String(o.vendorCode ?? o.article ?? ''),
    // backend does not send a product name on this endpoint → null (render shows "—").
    productName: (o.productName ?? null) as string | null,
    salePrice: Number(o.salePrice ?? 0),
    supplierStatus: String(o.supplierStatus ?? ''),
    addedAt: String(o.addedAt ?? ''),
  }
}

/** Map a backend supply document ({docType, format, generatedAt, fileSize}) to the FE SupplyDocument. */
function normalizeSupplyDocument(raw: unknown): Record<string, unknown> {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    type: (d.type ?? d.docType ?? '') as string,
    format: String(d.format ?? ''),
    generatedAt: String(d.generatedAt ?? ''),
    // backend sends `fileSize`; FE field is `sizeBytes` (null when unknown).
    sizeBytes: (d.sizeBytes ?? d.fileSize ?? null) as number | null,
    // backend does not send a download URL on this endpoint; download is keyed by `type`.
    downloadUrl: String(d.downloadUrl ?? ''),
  }
}
