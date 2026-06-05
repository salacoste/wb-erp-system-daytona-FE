/**
 * Boundary normalizer for Tariff Audit Log
 * GET /v1/tariffs/settings/audit
 *
 * Paginated audit entries with field-level change tracking.
 */

import { asRecord, toStr, toCount, toStringOrNull } from '@/lib/api/normalizer-helpers'
import type { TariffAuditEntry, TariffAuditResponse } from '@/types/tariffs-admin'

function normalizeTariffAuditEntry(raw: unknown): TariffAuditEntry {
  const d = asRecord(raw)
  return {
    id: toCount(d.id),
    action: toStr(d.action) as TariffAuditEntry['action'],
    field_name: toStr(d.field_name ?? d.fieldName),
    old_value: toStringOrNull(d.old_value ?? d.oldValue),
    new_value: toStringOrNull(d.new_value ?? d.newValue),
    user_id: toStr(d.user_id ?? d.userId),
    user_email: toStr(d.user_email ?? d.userEmail),
    ip_address: toStr(d.ip_address ?? d.ipAddress),
    created_at: toStr(d.created_at ?? d.createdAt),
  }
}

/** Normalize tariff audit log response with pagination */
export function normalizeTariffAuditResponse(raw: unknown): TariffAuditResponse {
  const d = asRecord(raw)
  const meta = asRecord(d.meta)
  return {
    data: Array.isArray(d.data) ? d.data.map(normalizeTariffAuditEntry) : [],
    meta: {
      page: toCount(meta.page),
      limit: toCount(meta.limit),
      total: toCount(meta.total),
      total_pages: toCount(meta.total_pages ?? meta.totalPages),
    },
  }
}
