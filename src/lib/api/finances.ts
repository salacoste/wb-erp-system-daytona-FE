/**
 * NEW-7 — Finances API client.
 *
 * Read-only live proxy to BE FinancesController
 * (src/finances/controllers/finances.controller.ts). All endpoints require auth +
 * X-Cabinet-Id (auto-injected by apiClient).
 *
 * The BE service already maps snake_case → camelCase and unwraps the WB SDK
 * `{ data: { ... } }` envelope server-side, so the FE consumes BARE arrays /
 * objects. apiClient's default auto-unwrap (`rawData.data ?? rawData`) is safe
 * here: bare arrays/objects have no `data` key and pass through unchanged. No
 * `skipDataUnwrap` is needed (contrast with liquidity's `{meta,summary,data}`
 * envelope which DOES need it).
 *
 * Every response is routed through the boundary normalizer
 * (finances-normalizer.ts) — raw backend shapes never reach hooks/components.
 */

import { apiClient } from '../api-client'
import {
  normalizeAccountBalance,
  normalizeDocumentCategories,
  normalizeDocuments,
  normalizeDocumentDownload,
} from './finances-normalizer'
import type {
  AccountBalance,
  DocumentCategory,
  DocumentItem,
  DocumentDownloadResult,
  DocumentsLocale,
  DocumentExtension,
  FinanceDocumentsQuery,
} from '@/types/finances'

/** GET /v1/finances/balance — WB account balance (rate-limited 1/min by WB). */
export async function getAccountBalance(): Promise<AccountBalance> {
  const raw = await apiClient.get<unknown>('/v1/finances/balance')
  return normalizeAccountBalance(raw)
}

/** GET /v1/finances/documents/categories — WB document categories (filter options). */
export async function getDocumentCategories(locale?: DocumentsLocale): Promise<DocumentCategory[]> {
  const qs = new URLSearchParams()
  if (locale) qs.set('locale', locale)
  const endpoint = `/v1/finances/documents/categories${qs.toString() ? `?${qs}` : ''}`
  const raw = await apiClient.get<unknown>(endpoint)
  return normalizeDocumentCategories(raw)
}

/** GET /v1/finances/documents — WB financial documents (filtered + paginated). */
export async function getFinanceDocuments(
  query: FinanceDocumentsQuery = {}
): Promise<DocumentItem[]> {
  const qs = buildDocumentsQuery(query)
  const endpoint = `/v1/finances/documents${qs ? `?${qs}` : ''}`
  const raw = await apiClient.get<unknown>(endpoint)
  return normalizeDocuments(raw)
}

/**
 * GET /v1/finances/documents/:serviceName/download — base64 document content
 * (rate-limited 1/10s by WB). `extension` (pdf|xlsx) is REQUIRED by the WB SDK.
 */
export async function downloadDocument(
  serviceName: string,
  extension: DocumentExtension,
  locale?: DocumentsLocale
): Promise<DocumentDownloadResult> {
  const path = `/v1/finances/documents/${encodeURIComponent(serviceName)}/download`
  const qs = new URLSearchParams()
  qs.set('extension', extension)
  if (locale) qs.set('locale', locale)
  const raw = await apiClient.get<unknown>(`${path}?${qs}`)
  return normalizeDocumentDownload(raw)
}

/** Build the documents-list query string, forwarding only defined params. */
function buildDocumentsQuery(query: FinanceDocumentsQuery): string {
  const qs = new URLSearchParams()
  const entries: Array<[string, string | number | undefined]> = [
    ['locale', query.locale],
    ['beginTime', query.beginTime],
    ['endTime', query.endTime],
    ['sort', query.sort],
    ['order', query.order],
    ['category', query.category],
    ['serviceName', query.serviceName],
    ['limit', query.limit],
    ['offset', query.offset],
  ]
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value))
  }
  return qs.toString()
}
