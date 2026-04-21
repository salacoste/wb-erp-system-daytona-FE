/**
 * Orders History Boundary Normalizers — Story 89.1-FE
 * Absorbs backend shape drift for order history endpoints (local, WB native, full merged).
 * Sync operations (triggerSync, backfill, syncStatus) remain passthrough — action endpoints.
 */

import type {
  LocalHistoryResponse,
  WbHistoryResponse,
  FullHistoryResponse,
} from '@/types/orders-history'

export function normalizeLocalHistoryResponse(raw: unknown): LocalHistoryResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const entries = Array.isArray(r.entries ?? r.history)
    ? ((r.entries ?? r.history) as Record<string, unknown>[])
    : []

  return {
    ...r,
    orderId: String(r.orderId ?? r.order_id ?? ''),
    // currentStatus may be a string OR an object ({supplierStatus, wbStatus, isFinal}) — pass through as-is
    currentStatus: r.currentStatus ?? r.current_status ?? 'unknown',
    entries: entries.map((e: unknown) => {
      const entry = (e ?? {}) as Record<string, unknown>
      return {
        ...entry,
        status: String(entry.status ?? ''),
        timestamp: String(entry.timestamp ?? entry.createdAt ?? entry.created_at ?? ''),
      }
    }),
  } as unknown as LocalHistoryResponse
}

export function normalizeWbHistoryResponse(raw: unknown): WbHistoryResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const entries = Array.isArray(r.entries ?? r.history)
    ? ((r.entries ?? r.history) as Record<string, unknown>[])
    : []

  return {
    ...r,
    orderId: String(r.orderId ?? r.order_id ?? ''),
    entries: entries.map((e: unknown) => {
      const entry = (e ?? {}) as Record<string, unknown>
      return {
        ...entry,
        status: String(entry.status ?? ''),
        timestamp: String(entry.timestamp ?? entry.dt ?? entry.created_at ?? ''),
        wbStatusCode: Number(entry.wbStatusCode ?? entry.wb_status_code ?? 0),
      }
    }),
  } as unknown as WbHistoryResponse
}

export function normalizeFullHistoryResponse(raw: unknown): FullHistoryResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const entries = Array.isArray(r.entries ?? r.history)
    ? ((r.entries ?? r.history) as Record<string, unknown>[])
    : []

  return {
    ...r,
    orderId: String(r.orderId ?? r.order_id ?? ''),
    entries: entries.map((e: unknown) => {
      const entry = (e ?? {}) as Record<string, unknown>
      return {
        ...entry,
        source: String(entry.source ?? 'unknown'),
        status: String(entry.status ?? ''),
        timestamp: String(entry.timestamp ?? entry.dt ?? entry.created_at ?? ''),
      }
    }),
  } as unknown as FullHistoryResponse
}
