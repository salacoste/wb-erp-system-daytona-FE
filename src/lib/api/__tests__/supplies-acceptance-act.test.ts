/**
 * Story O5: supplies acceptance-act API tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  uploadAcceptanceAct,
  downloadAcceptanceAct,
  detectAcceptanceActFormat,
} from '../supplies-acceptance-act'

vi.spyOn(console, 'debug').mockImplementation(() => {})

describe('Supplies acceptance-act API (Story O5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploadAcceptanceAct POSTs the base64 body to /acceptance-act', async () => {
    const meta = {
      id: 'doc-1',
      docType: 'ACCEPTANCE_ACT',
      format: 'xlsx',
      fileSize: 1024,
      generatedAt: '2026-07-05T00:00:00Z',
      expiresAt: null,
    }
    vi.mocked(apiClient.post).mockResolvedValue(meta)

    const result = await uploadAcceptanceAct('supply-1', {
      file: 'AAA',
      filename: 'act.xlsx',
      format: 'xlsx',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/supply-1/acceptance-act', {
      file: 'AAA',
      filename: 'act.xlsx',
      format: 'xlsx',
    })
    expect(result).toEqual(meta)
  })

  it('downloadAcceptanceAct GETs the act as a Blob (skipDataUnwrap)', async () => {
    const blob = new Blob(['x'])
    vi.mocked(apiClient.get).mockResolvedValue(blob)

    const result = await downloadAcceptanceAct('supply-1')

    expect(apiClient.get).toHaveBeenCalledWith('/v1/supplies/supply-1/acceptance-act', {
      skipDataUnwrap: true,
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })

  it('detectAcceptanceActFormat maps xlsx/zip (any case) and rejects others', () => {
    expect(detectAcceptanceActFormat('act.xlsx')).toBe('xlsx')
    expect(detectAcceptanceActFormat('ARCHIVE.ZIP')).toBe('zip')
    expect(detectAcceptanceActFormat('act.zip')).toBe('zip')
    expect(detectAcceptanceActFormat('act.pdf')).toBeNull()
    expect(detectAcceptanceActFormat('noext')).toBeNull()
  })
})
