/**
 * Orders Sync Status Boundary Normalizer
 *
 * Normalizes response from GET /v1/orders/sync-status
 */

import { asRecord, toStr, toOptionalString } from './normalizer-helpers'
import type { SyncStatusResponse } from '@/types/orders'

export function normalizeSyncStatusResponse(raw: unknown): SyncStatusResponse {
  const r = asRecord(raw)
  return {
    enabled: Boolean(r.enabled),
    lastSyncAt: toOptionalString(r.lastSyncAt) ?? null,
    nextSyncAt: toOptionalString(r.nextSyncAt) ?? null,
    schedule: toStr(r.schedule),
    timezone: toStr(r.timezone),
  }
}
