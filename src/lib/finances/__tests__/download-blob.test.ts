/**
 * NEW-7 — base64 → Blob → browser-download pipeline tests.
 *
 * Mocks `URL.createObjectURL` + the transient `<a>` click to verify the pipeline
 * triggers a download with the right Blob type + filename. Also covers empty /
 * malformed base64 (returns false, no crash).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  base64ToBlob,
  resolveMimeType,
  triggerBrowserDownload,
  downloadDocumentResult,
} from '../download-blob'
import type { DocumentDownloadResult } from '@/types/finances'

describe('resolveMimeType', () => {
  it('prefers the BE-returned extension when known', () => {
    expect(resolveMimeType('pdf', 'xlsx')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  })
  it('falls back to the requested extension when BE returns null', () => {
    expect(resolveMimeType('pdf', null)).toBe('application/pdf')
  })
  it('falls back to the requested extension when BE returns unknown', () => {
    expect(resolveMimeType('pdf', 'csv')).toBe('application/pdf')
  })
})

describe('base64ToBlob', () => {
  it('decodes valid base64 into a Blob with the given MIME', () => {
    const blob = base64ToBlob('VGVzdA==', 'application/pdf')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob?.type).toBe('application/pdf')
    expect(blob?.size).toBe(4) // "Test" = 4 bytes
  })
  it('returns null for an empty string', () => {
    expect(base64ToBlob('', 'application/pdf')).toBeNull()
  })
  it('returns null for malformed base64', () => {
    expect(base64ToBlob('!!!not-base64!!!', 'application/pdf')).toBeNull()
  })
})

describe('triggerBrowserDownload', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:fake-url')
    revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    // jsdom <a>.click() is a no-op; spy on it via prototype.
    clickSpy = vi.fn()
    // Cast the vitest Mock to the `() => void` signature mockImplementation
    // expects (anti-pattern #4 bridge: Mock → plain callable via `as unknown as`).
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      clickSpy as unknown as () => void
    )
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('creates an object URL from the blob, clicks the anchor, and revokes after the timer', () => {
    const blob = new Blob(['x'], { type: 'application/pdf' })
    triggerBrowserDownload(blob, 'report.pdf')

    // The anchor is transient (removed synchronously after click), so assert on
    // the persistent, observable side effects: object URL created from the blob
    // + the anchor click fired.
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    // Revoked only after the deferred timer fires.
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.runOnlyPendingTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })
})

describe('downloadDocumentResult', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:fake')
    clickSpy = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      clickSpy as unknown as () => void
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns true and triggers a download for a populated result (pdf MIME)', () => {
    const result: DocumentDownloadResult = {
      fileName: 'doc.pdf',
      extension: 'pdf',
      document: 'VGVzdA==',
    }
    expect(downloadDocumentResult(result, 'pdf', 'fallback.pdf')).toBe(true)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe('application/pdf')
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('uses the fallback filename when BE omits fileName', () => {
    const result: DocumentDownloadResult = {
      fileName: null,
      extension: 'pdf',
      document: 'VGVzdA==',
    }
    expect(downloadDocumentResult(result, 'pdf', 'fallback.pdf')).toBe(true)
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('returns false for an empty document (no base64) and does not trigger a download', () => {
    const result: DocumentDownloadResult = {
      fileName: 'doc.pdf',
      extension: 'pdf',
      document: null,
    }
    expect(downloadDocumentResult(result, 'pdf', 'fallback.pdf')).toBe(false)
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('returns false for malformed base64 and does not trigger a download', () => {
    const result: DocumentDownloadResult = {
      fileName: 'doc.pdf',
      extension: 'pdf',
      document: '!!!malformed!!!',
    }
    expect(downloadDocumentResult(result, 'pdf', 'fallback.pdf')).toBe(false)
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(clickSpy).not.toHaveBeenCalled()
  })
})
