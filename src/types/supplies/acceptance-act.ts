/**
 * Acceptance-act types — Epic Moysklad, Story O5 (S8 / F4).
 * WB retains acceptance acts for only 3 months; we store them indefinitely.
 *
 * Verified against backend src/supplies/dto/acceptance-act.dto.ts:
 * UploadAcceptanceActDto { file: base64, filename ≤255, format: 'xlsx'|'zip' }
 * AcceptanceActMetaDto { id, docType, format, fileSize, generatedAt, expiresAt: null }
 */

/** Accepted acceptance-act file formats (backend AcceptanceActFormat enum). */
export type AcceptanceActFormat = 'xlsx' | 'zip'

/** Body for POST /v1/supplies/:supplyId/acceptance-act. */
export interface UploadAcceptanceActBody {
  /** File content, base64-encoded (no data-URL prefix). */
  file: string
  /** Original filename (≤255 chars); used for the download extension fallback. */
  filename: string
  /** File format determining the download Content-Type. */
  format: AcceptanceActFormat
}

/** Metadata returned after an acceptance-act upload (no content). */
export interface AcceptanceActMeta {
  id: string
  docType: string
  format: string
  fileSize: number
  /** ISO 8601 upload timestamp (serialized from the backend `Date`). */
  generatedAt: string
  /** Always null today — acceptance acts are retained indefinitely (backend `Date | null`). */
  expiresAt: string | null
}
