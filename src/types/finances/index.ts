/**
 * NEW-7 — Finances (Account Balance + Financial Documents) FE-canonical types.
 *
 * Mirrors the FE-facing shapes returned by the BE FinancesController
 * (src/finances/controllers/finances.controller.ts). The BE service
 * (src/finances/services/finances-api.service.ts) maps snake_case → camelCase
 * server-side and unwraps the WB SDK `{ data: { ... } }` envelope, so the FE
 * consumes BARE arrays/objects — never the raw SDK envelope.
 *
 * Contract (verified against BE service/DTO):
 *   - GET /v1/finances/balance → AccountBalance (bare object)
 *   - GET /v1/finances/documents/categories → DocumentCategory[] (bare array)
 *   - GET /v1/finances/documents → DocumentItem[] (bare array)
 *   - GET /v1/finances/documents/:serviceName/download → DocumentDownloadResult (bare object)
 *
 * AP#8: money fields (current, forWithdraw) are `number | null` — null renders
 * '—', never collapses to 0.
 */

/** Locales the WB documents API accepts (BE DocumentsLocale). */
export type DocumentsLocale = 'ru' | 'en' | 'zh'

/** `sort` values the WB documents list API accepts (BE DocumentsSort). */
export type DocumentsSort = 'date' | 'category'

/** `order` values the WB documents list API accepts (BE DocumentsOrder). */
export type DocumentsOrder = 'desc' | 'asc'

/** Document file extensions accepted by the WB download API. */
export type DocumentExtension = 'pdf' | 'xlsx'

/**
 * WB account balance. Money fields are nullable (AP#8): WB may omit them when
 * the cabinet has no balance data yet — preserve null, render '—'.
 */
export interface AccountBalance {
  /** ISO 4217 currency code (e.g. "RUB"), or null when WB omits it. */
  currency: string | null
  /** Current account balance (money). */
  current: number | null
  /** Amount available for withdrawal (money). Mapped from WB `for_withdraw`. */
  forWithdraw: number | null
}

/** A WB financial-document category (filter option for the documents list). */
export interface DocumentCategory {
  /** Stable WB category identifier (used as the `category` filter value). */
  name?: string
  /** Human-readable localized category title. */
  title?: string
}

/** A WB financial-document list entry. All fields optional per the WB contract. */
export interface DocumentItem {
  /** WB service identifier — REQUIRED to download the document (path param). */
  serviceName?: string
  /** Human-readable document name. */
  name?: string
  /** Document category (WB category name). */
  category?: string
  /** Available download extensions (e.g. ['pdf', 'xlsx']). */
  extensions?: string[]
  /** Document creation timestamp (ISO 8601). */
  creationTime?: string
  /** Whether the document has been viewed in WB. */
  viewed?: boolean
}

/**
 * Result of a document download. `document` is the base64-encoded file content;
 * the FE converts it to a Blob and triggers a browser download.
 */
export interface DocumentDownloadResult {
  /** Suggested file name (may include extension), or null when WB omits it. */
  fileName: string | null
  /** File extension/format WB returned (e.g. "pdf"), or null. */
  extension: string | null
  /** Base64-encoded document content, or null/empty when WB has none. */
  document: string | null
}

/** Query params for GET /v1/finances/documents (mirrors BE DocumentsListQueryDto). */
export interface FinanceDocumentsQuery {
  locale?: DocumentsLocale
  beginTime?: string
  endTime?: string
  sort?: DocumentsSort
  order?: DocumentsOrder
  category?: string
  serviceName?: string
  /** Page size (WB max 1000). */
  limit?: number
  /** Page offset (0-based). */
  offset?: number
}
