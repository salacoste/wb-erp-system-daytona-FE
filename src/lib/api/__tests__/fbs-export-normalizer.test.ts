/**
 * Boundary Normalizer Tests — FBS Export — Story 96.12-FE
 *
 * Verifies normalizeFbsExportTriggerResponse and normalizeFbsExportStatusResponse.
 *
 * Key assertions per CLAUDE.md § Boundary Normalizer Pattern:
 *   - Dual-lookup: exportId ?? export_id, expiresAt ?? expires_at.
 *   - Status enum validation: unknown value falls back to 'queued'.
 *   - Null preservation: url + expiresAt stay null when absent (anti-pattern #8).
 *   - Missing-field handling: undefined/null inputs produce safe defaults.
 *   - Cabinet isolation: fbsExportQueryKeys includes cabinetId (Story 96.11 H2-1).
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeFbsExportTriggerResponse,
  normalizeFbsExportStatusResponse,
} from '../fbs-export-normalizer'
import { fbsExportQueryKeys } from '../fbs-export'

// ---------------------------------------------------------------------------
// normalizeFbsExportTriggerResponse
// ---------------------------------------------------------------------------

describe('normalizeFbsExportTriggerResponse', () => {
  it('happy path: camelCase exportId + known status', () => {
    const raw = { exportId: 'abc-123', status: 'queued' }
    const result = normalizeFbsExportTriggerResponse(raw)
    expect(result.exportId).toBe('abc-123')
    expect(result.status).toBe('queued')
  })

  it('dual-lookup: snake_case export_id', () => {
    const raw = { export_id: 'snake-456', status: 'running' }
    const result = normalizeFbsExportTriggerResponse(raw)
    expect(result.exportId).toBe('snake-456')
    expect(result.status).toBe('running')
  })

  it('unknown status falls back to queued', () => {
    const raw = { exportId: 'x', status: 'unknown_future_status' }
    const result = normalizeFbsExportTriggerResponse(raw)
    expect(result.status).toBe('queued')
  })

  it('missing exportId produces empty string', () => {
    const raw = { status: 'queued' }
    const result = normalizeFbsExportTriggerResponse(raw)
    expect(result.exportId).toBe('')
  })

  it('null input produces safe defaults', () => {
    const result = normalizeFbsExportTriggerResponse(null)
    expect(result.exportId).toBe('')
    expect(result.status).toBe('queued')
  })
})

// ---------------------------------------------------------------------------
// normalizeFbsExportStatusResponse
// ---------------------------------------------------------------------------

describe('normalizeFbsExportStatusResponse', () => {
  it('ready status: url + expiresAt populated', () => {
    const raw = {
      exportId: 'ready-123',
      status: 'ready',
      url: 'https://s3.example.com/export.csv',
      expiresAt: '2026-05-08T20:00:00Z',
    }
    const result = normalizeFbsExportStatusResponse(raw)
    expect(result.status).toBe('ready')
    expect(result.url).toBe('https://s3.example.com/export.csv')
    expect(result.expiresAt).toBe('2026-05-08T20:00:00Z')
  })

  it('queued status: url + expiresAt are null (anti-pattern #8)', () => {
    const raw = { exportId: 'q-1', status: 'queued', url: null, expiresAt: null }
    const result = normalizeFbsExportStatusResponse(raw)
    expect(result.url).toBeNull()
    expect(result.expiresAt).toBeNull()
  })

  it('dual-lookup: export_id + expires_at snake_case', () => {
    const raw = {
      export_id: 'snake-789',
      status: 'ready',
      url: 'https://example.com/file.csv',
      expires_at: '2026-05-09T10:00:00Z',
    }
    const result = normalizeFbsExportStatusResponse(raw)
    expect(result.exportId).toBe('snake-789')
    expect(result.expiresAt).toBe('2026-05-09T10:00:00Z')
  })

  it('missing url field produces null (anti-pattern #8)', () => {
    const raw = { exportId: 'running-1', status: 'running' }
    const result = normalizeFbsExportStatusResponse(raw)
    expect(result.url).toBeNull()
    expect(result.expiresAt).toBeNull()
  })

  it('all terminal statuses pass through correctly', () => {
    const statuses = ['ready', 'failed', 'expired'] as const
    for (const status of statuses) {
      const result = normalizeFbsExportStatusResponse({ exportId: 'x', status })
      expect(result.status).toBe(status)
    }
  })
})

// ---------------------------------------------------------------------------
// Cabinet isolation (Story 96.11 H2-1 lesson)
// ---------------------------------------------------------------------------

describe('fbsExportQueryKeys cabinet isolation', () => {
  it('status keys differ across cabinets', () => {
    const params = { exportId: 'same-export-id' }
    const key1 = fbsExportQueryKeys.status('cab-1', params)
    const key2 = fbsExportQueryKeys.status('cab-2', params)
    expect(key1).not.toEqual(key2)
  })

  it('status key includes cabinetId as first segment', () => {
    const key = fbsExportQueryKeys.status('my-cabinet', { exportId: 'eid' })
    expect(key[0]).toBe('fbs-export')
    expect(key[1]).toBe('my-cabinet')
  })

  it('null cabinetId produces distinct key from non-null cabinetId', () => {
    const params = { exportId: 'eid' }
    const nullKey = fbsExportQueryKeys.status(null, params)
    const realKey = fbsExportQueryKeys.status('cab-1', params)
    expect(nullKey).not.toEqual(realKey)
  })
})
