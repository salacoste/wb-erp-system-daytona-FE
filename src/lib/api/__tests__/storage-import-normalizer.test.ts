/**
 * Storage Import Normalizer Tests
 * Covers: normalizeImportStatusResponse
 */

import { describe, it, expect } from 'vitest'
import { normalizeImportStatusResponse } from '../storage-import-normalizer'

describe('normalizeImportStatusResponse', () => {
  it('happy path: normalizes completed import status', () => {
    const raw = {
      import_id: 'abc-123',
      status: 'completed',
      rows_imported: 150,
      completed_at: '2025-01-01T12:00:00Z',
    }
    const result = normalizeImportStatusResponse(raw)
    expect(result.import_id).toBe('abc-123')
    expect(result.status).toBe('completed')
    expect(result.rows_imported).toBe(150)
    expect(result.completed_at).toBe('2025-01-01T12:00:00Z')
  })

  it('happy path: normalizes failed import with error', () => {
    const raw = {
      import_id: 'xyz-456',
      status: 'failed',
      error_message: 'Connection timeout',
      completed_at: '2025-01-01T12:05:00Z',
    }
    const result = normalizeImportStatusResponse(raw)
    expect(result.status).toBe('failed')
    expect(result.error_message).toBe('Connection timeout')
  })

  it('null input defaults to failed status with empty id', () => {
    const result = normalizeImportStatusResponse(null)
    expect(result.import_id).toBe('')
    expect(result.status).toBe('failed')
    expect(result.rows_imported).toBeUndefined()
    expect(result.error_message).toBeUndefined()
    expect(result.completed_at).toBeUndefined()
  })

  it('missing fields default safely', () => {
    const result = normalizeImportStatusResponse({})
    expect(result.import_id).toBe('')
    expect(result.status).toBe('failed')
  })

  it('invalid status string defaults to failed', () => {
    const result = normalizeImportStatusResponse({ import_id: 'x', status: 'unknown' })
    expect(result.status).toBe('failed')
  })

  it('camelCase dual-lookup: importId → import_id', () => {
    const raw = { importId: 'camel-123', status: 'processing', rowsImported: 50 }
    const result = normalizeImportStatusResponse(raw)
    expect(result.import_id).toBe('camel-123')
    expect(result.status).toBe('processing')
    expect(result.rows_imported).toBe(50)
  })

  it('rows_imported of 0 is treated as undefined (no rows yet)', () => {
    const result = normalizeImportStatusResponse({
      import_id: 'x',
      status: 'pending',
      rows_imported: 0,
    })
    expect(result.rows_imported).toBeUndefined()
  })
})
