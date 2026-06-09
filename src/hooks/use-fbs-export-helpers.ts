/**
 * FBS Export Button Helper Functions
 * Extracted from use-fbs-export-button.ts for 200-line compliance.
 */

import { format } from 'date-fns'

/** Default rate-limit countdown when backend 429 body lacks retryAfter. */
export const DEFAULT_RATE_LIMIT_SECONDS = 60

/** Generate the CSV download filename. */
export function buildExportFilename(): string {
  return `fbs-stock-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
}

/** Trigger browser download via hidden anchor with signed S3 URL. */
export function triggerDownload(url: string): void {
  // rel="noopener noreferrer": prevents signed S3 URL query-string credentials
  // (X-Amz-Signature, X-Amz-Credential) from leaking via the Referer header.
  const link = document.createElement('a')
  link.href = url
  link.download = buildExportFilename()
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
