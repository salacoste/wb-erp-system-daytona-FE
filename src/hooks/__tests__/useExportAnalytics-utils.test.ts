/**
 * Unit tests for useExportAnalytics-utils (Epic 74) — coverage added iter-167.
 *
 * Pure export-analytics helpers: formatBytes (binary units; dot is fine — technical size, not locale),
 * formatExpirationDate (ru date — structure-asserted for TZ/locale safety), shouldContinuePolling,
 * buildTimeoutStatus.
 */

import { describe, it, expect } from 'vitest'
import type { ExportStatus } from '@/types/analytics'
import {
  formatBytes,
  formatExpirationDate,
  shouldContinuePolling,
  buildTimeoutStatus,
} from '@/hooks/useExportAnalytics-utils'

describe('formatBytes', () => {
  it('renders human-readable binary sizes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(500)).toBe('500.0 B')
    expect(formatBytes(1536)).toBe('1.5 KB') // 1536 / 1024
    expect(formatBytes(1048576)).toBe('1.0 MB') // 1024^2
  })
  it('returns "—" for undefined', () => {
    expect(formatBytes(undefined)).toBe('—')
  })
})

describe('formatExpirationDate', () => {
  it('returns "—" for an empty input', () => {
    expect(formatExpirationDate(undefined)).toBe('—')
    expect(formatExpirationDate('')).toBe('—')
  })
  it('formats a valid ISO date to a non-empty localized string', () => {
    const out = formatExpirationDate('2026-01-15T12:00:00Z')
    expect(out).not.toBe('—')
    expect(out).toMatch(/\d/) // contains digits (day/year)
  })
})

describe('shouldContinuePolling', () => {
  it('continues when status is absent or in-progress', () => {
    expect(shouldContinuePolling(undefined)).toBe(true)
    expect(shouldContinuePolling({ status: 'processing' } as unknown as ExportStatus)).toBe(true)
  })
  it('stops on terminal statuses', () => {
    expect(shouldContinuePolling({ status: 'completed' } as unknown as ExportStatus)).toBe(false)
    expect(shouldContinuePolling({ status: 'failed' } as unknown as ExportStatus)).toBe(false)
  })
})

describe('buildTimeoutStatus', () => {
  it('builds a failed status with a timeout message', () => {
    expect(buildTimeoutStatus('exp-123')).toEqual({
      export_id: 'exp-123',
      status: 'failed',
      error_message: 'Экспорт занял слишком много времени. Попробуйте еще раз.',
    })
  })
})
