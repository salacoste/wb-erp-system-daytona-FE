/**
 * NEW-7 — base64 → Blob → browser-download helper.
 *
 * Pure, side-effect-isolated so the base64 decode + anchor-click can be unit
 * tested without TanStack Query. The WB download API returns base64-encoded
 * file content; the FE decodes it to a Blob and triggers a browser download.
 *
 * Extracted from the hook (file-size limit + testability).
 */

import type { DocumentDownloadResult, DocumentExtension } from '@/types/finances'

/** MIME types for the WB download extensions. */
const MIME_BY_EXTENSION: Record<DocumentExtension, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/** Resolve the MIME type from the requested extension (or BE-returned one). */
export function resolveMimeType(requested: DocumentExtension, returned: string | null): string {
  // Prefer the BE-returned extension if it maps to a known MIME; else the requested.
  if (returned === 'pdf' || returned === 'xlsx') return MIME_BY_EXTENSION[returned]
  return MIME_BY_EXTENSION[requested]
}

/**
 * Decode a base64 string into a Blob for the given MIME type.
 * Uses `atob` + Uint8Array (works in browser + jsdom + Node 16+).
 * Returns null when the base64 string is empty/malformed.
 */
export function base64ToBlob(base64: string, mimeType: string): Blob | null {
  if (!base64) return null
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mimeType })
  } catch {
    // Malformed base64 — indicate failure rather than crashing the UI.
    return null
  }
}

/**
 * Trigger a browser download of a Blob via a transient `<a download>` element.
 * Revokes the object URL after the click to avoid leaks. No-op outside a browser.
 */
export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  // Append to DOM so the click works in all browsers (Firefox requires it).
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Defer revoke so the browser has time to start the download. A 1s grace
  // avoids a Firefox download-handoff race where a 0ms revoke can abort the
  // download before Firefox takes ownership of the blob URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Full pipeline: WB download result → Blob → browser download.
 * Returns true on success, false when base64 is empty/malformed.
 */
export function downloadDocumentResult(
  result: DocumentDownloadResult,
  requestedExtension: DocumentExtension,
  fallbackName: string
): boolean {
  const base64 = result.document
  if (!base64) return false
  const mimeType = resolveMimeType(requestedExtension, result.extension)
  const blob = base64ToBlob(base64, mimeType)
  if (!blob) return false
  const fileName = result.fileName || fallbackName
  triggerBrowserDownload(blob, fileName)
  return true
}
