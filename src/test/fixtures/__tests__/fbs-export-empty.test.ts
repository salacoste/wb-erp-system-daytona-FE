/**
 * Consumer-wiring proof for fbs-export-empty fixture factories.
 * Story 96.12-FE — Pattern 3 § "Testing requirement":
 * shared-fixture module MUST have ≥1 test consuming it in the first downstream
 * test file (proves the wiring before the module accumulates consumers).
 *
 * @see src/test/fixtures/fbs-export-empty.ts
 * @see src/test/fixtures/__tests__/fbs-stock-empty.test.ts (adjacent precedent)
 */

import { describe, it, expect } from 'vitest'
import {
  pendingFbsExportTriggerResponse,
  pendingFbsExportStatus,
  runningFbsExportStatus,
  readyFbsExportStatus,
  failedFbsExportStatus,
  expiredFbsExportStatus,
} from '../fbs-export-empty'

describe('fbs-export-empty fixtures (Story 96.12-FE — Pattern 3 wiring proof)', () => {
  it('pendingFbsExportTriggerResponse: exportId non-empty, status=queued', () => {
    const r = pendingFbsExportTriggerResponse()
    expect(r.exportId).toBe('test-export-id')
    expect(r.status).toBe('queued')
  })

  it('pendingFbsExportStatus: status=queued, url=null, expiresAt=null', () => {
    const r = pendingFbsExportStatus()
    expect(r.status).toBe('queued')
    expect(r.url).toBeNull()
    expect(r.expiresAt).toBeNull()
  })

  it('runningFbsExportStatus: status=running, url=null, expiresAt=null', () => {
    const r = runningFbsExportStatus()
    expect(r.status).toBe('running')
    expect(r.url).toBeNull()
    expect(r.expiresAt).toBeNull()
  })

  it('readyFbsExportStatus: status=ready, url non-null, expiresAt non-null', () => {
    const r = readyFbsExportStatus()
    expect(r.status).toBe('ready')
    expect(r.url).not.toBeNull()
    expect(typeof r.url).toBe('string')
    expect(r.expiresAt).not.toBeNull()
    expect(typeof r.expiresAt).toBe('string')
  })

  it('failedFbsExportStatus: status=failed, url=null, expiresAt=null', () => {
    const r = failedFbsExportStatus()
    expect(r.status).toBe('failed')
    expect(r.url).toBeNull()
    expect(r.expiresAt).toBeNull()
  })

  it('expiredFbsExportStatus: status=expired, url=null, expiresAt=null', () => {
    const r = expiredFbsExportStatus()
    expect(r.status).toBe('expired')
    expect(r.url).toBeNull()
    expect(r.expiresAt).toBeNull()
  })
})
