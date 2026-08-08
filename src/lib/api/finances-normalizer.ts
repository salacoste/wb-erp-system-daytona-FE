/**
 * Boundary normalizer for NEW-7 Finances.
 *
 * The BE FinancesApiService already maps snake_case → camelCase and unwraps the
 * WB SDK envelope server-side, so the FE receives bare camelCase shapes. This
 * normalizer still defends at the boundary (Boundary Normalizer Pattern):
 * money fields preserve null (AP#8 — render '—'), string fields reject non-string
 * coercion (Defensive Frontend), and arrays are guarded against non-array bodies.
 *
 * Reference: src/finances/services/finances-api.service.ts (FE-facing DTOs).
 */

import { asRecord, toStringOrNull, toNullableNumber } from '@/lib/api/normalizer-helpers'
import type { AccountBalance, DocumentCategory, DocumentItem } from '@/types/finances'

/** Normalize the GET /v1/finances/balance response. Money fields preserve null (AP#8). */
export function normalizeAccountBalance(raw: unknown): AccountBalance {
  const b = asRecord(raw)
  return {
    currency: toStringOrNull(b.currency),
    // AP#8: money/ratio — null stays null, renders '—'.
    current: toNullableNumber(b.current),
    // BE maps WB `for_withdraw` → `forWithdraw` (camelCase).
    forWithdraw: toNullableNumber(b.forWithdraw),
  }
}

/** Normalize a single WB document category. */
export function normalizeDocumentCategory(raw: unknown): DocumentCategory {
  const c = asRecord(raw)
  return {
    name: toOptionalStr(c.name),
    title: toOptionalStr(c.title),
  }
}

/** Normalize the GET /v1/finances/documents/categories response (bare array). */
export function normalizeDocumentCategories(raw: unknown): DocumentCategory[] {
  return Array.isArray(raw) ? raw.map(normalizeDocumentCategory) : []
}

/** Normalize a single WB document list entry. */
export function normalizeDocumentItem(raw: unknown): DocumentItem {
  const d = asRecord(raw)
  return {
    serviceName: toOptionalStr(d.serviceName),
    name: toOptionalStr(d.name),
    category: toOptionalStr(d.category),
    extensions: normalizeExtensions(d.extensions),
    creationTime: toOptionalStr(d.creationTime),
    viewed: typeof d.viewed === 'boolean' ? d.viewed : undefined,
  }
}

/** Normalize the GET /v1/finances/documents response (bare array). */
export function normalizeDocuments(raw: unknown): DocumentItem[] {
  return Array.isArray(raw) ? raw.map(normalizeDocumentItem) : []
}

/** Normalize the GET /v1/finances/documents/:serviceName/download response. */
export function normalizeDocumentDownload(raw: unknown): {
  fileName: string | null
  extension: string | null
  document: string | null
} {
  const d = asRecord(raw)
  return {
    fileName: toStringOrNull(d.fileName),
    extension: toStringOrNull(d.extension),
    document: toStringOrNull(d.document),
  }
}

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Coerce to string | undefined (optional-string semantics — non-string → undefined). */
function toOptionalStr(raw: unknown): string | undefined {
  return typeof raw === 'string' ? raw : undefined
}

/** Normalize the `extensions` array — non-string entries dropped. */
function normalizeExtensions(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const strs = raw.filter((e): e is string => typeof e === 'string')
  return strs.length > 0 ? strs : undefined
}
