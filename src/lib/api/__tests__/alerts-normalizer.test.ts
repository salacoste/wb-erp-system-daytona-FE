/**
 * Boundary Normalizer Tests — Alerts domain
 *
 * Covers normalizeAlertRulesResponse, normalizeAlertHistoryResponse,
 * normalizeAlertSummaryResponse for nullability, type coercion,
 * severity fallback, and empty/full shapes per CLAUDE.md § Boundary Normalizer Pattern.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeAlertRulesResponse,
  normalizeAlertHistoryResponse,
  normalizeAlertSummaryResponse,
} from '../alerts-normalizer'

// ---------------------------------------------------------------------------
// normalizeAlertRulesResponse
// ---------------------------------------------------------------------------

describe('normalizeAlertRulesResponse', () => {
  it('maps a full rules array to canonical AlertRule[]', () => {
    const raw = [
      {
        id: 'rule-1',
        cabinetId: 'cab-1',
        alertType: 'margin_drop',
        enabled: true,
        thresholds: { pct: 10 },
        cooldownMinutes: 30,
        severity: 'critical',
        channels: { telegram: true },
        label: 'Margin Alert',
        createdAt: '2025-12-01T00:00:00Z',
        updatedAt: '2025-12-02T00:00:00Z',
      },
    ]

    const result = normalizeAlertRulesResponse(raw)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'rule-1',
      cabinetId: 'cab-1',
      alertType: 'margin_drop',
      enabled: true,
      thresholds: { pct: 10 },
      cooldownMinutes: 30,
      severity: 'critical',
      channels: { telegram: true },
      label: 'Margin Alert',
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2025-12-02T00:00:00Z',
    })
  })

  it('coerces unknown severity to "info"', () => {
    const raw = [{ id: 'r1', severity: 'unknown_sev' }]
    const result = normalizeAlertRulesResponse(raw)
    expect(result[0].severity).toBe('info')
  })

  it('coerces missing severity to "info"', () => {
    const raw = [{ id: 'r1' }]
    const result = normalizeAlertRulesResponse(raw)
    expect(result[0].severity).toBe('info')
  })

  it('handles null severity', () => {
    const raw = [{ id: 'r1', severity: null }]
    const result = normalizeAlertRulesResponse(raw)
    expect(result[0].severity).toBe('info')
  })

  it('coerces non-string fields to safe defaults', () => {
    const raw = [
      { id: 123, cabinetId: null, alertType: undefined, enabled: 1, cooldownMinutes: 'abc' },
    ]
    const result = normalizeAlertRulesResponse(raw)
    expect(result[0]).toMatchObject({
      id: '',
      cabinetId: '',
      alertType: '',
      enabled: true,
      cooldownMinutes: 0,
    })
  })

  it('returns [] for non-array input', () => {
    expect(normalizeAlertRulesResponse(null)).toEqual([])
    expect(normalizeAlertRulesResponse(undefined)).toEqual([])
    expect(normalizeAlertRulesResponse({})).toEqual([])
    expect(normalizeAlertRulesResponse('not-array')).toEqual([])
  })

  it('returns [] for empty array', () => {
    expect(normalizeAlertRulesResponse([])).toEqual([])
  })

  it('coerces label to null when non-string', () => {
    const raw = [{ id: 'r1', label: 42 }]
    const result = normalizeAlertRulesResponse(raw)
    expect(result[0].label).toBeNull()
  })

  it('preserves valid label string', () => {
    const raw = [{ id: 'r1', label: 'My Alert' }]
    const result = normalizeAlertRulesResponse(raw)
    expect(result[0].label).toBe('My Alert')
  })

  it('defaults thresholds and channels to {} when missing', () => {
    const raw = [{ id: 'r1' }]
    const result = normalizeAlertRulesResponse(raw)
    expect(result[0].thresholds).toEqual({})
    expect(result[0].channels).toEqual({})
  })

  it('maps multiple rules preserving order', () => {
    const raw = [
      { id: 'a', severity: 'critical' },
      { id: 'b', severity: 'warning' },
      { id: 'c', severity: 'info' },
    ]
    const result = normalizeAlertRulesResponse(raw)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.severity)).toEqual(['critical', 'warning', 'info'])
  })
})

// ---------------------------------------------------------------------------
// normalizeAlertHistoryResponse
// ---------------------------------------------------------------------------

describe('normalizeAlertHistoryResponse', () => {
  it('maps a full history array to canonical AlertHistoryItem[]', () => {
    const raw = [
      {
        id: 'hist-1',
        cabinetId: 'cab-1',
        channel: 'telegram',
        eventType: 'margin_drop',
        messageText: 'Margin dropped below 10%',
        status: 'sent',
        createdAt: '2025-12-01T10:00:00Z',
        sentAt: '2025-12-01T10:00:01Z',
      },
    ]

    const result = normalizeAlertHistoryResponse(raw)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'hist-1',
      cabinetId: 'cab-1',
      channel: 'telegram',
      eventType: 'margin_drop',
      messageText: 'Margin dropped below 10%',
      status: 'sent',
      createdAt: '2025-12-01T10:00:00Z',
      sentAt: '2025-12-01T10:00:01Z',
    })
  })

  it('coerces sentAt to null when non-string', () => {
    const raw = [{ id: 'h1', sentAt: 12345 }]
    const result = normalizeAlertHistoryResponse(raw)
    expect(result[0].sentAt).toBeNull()
  })

  it('preserves sentAt null (pending alert)', () => {
    const raw = [{ id: 'h1', sentAt: null }]
    const result = normalizeAlertHistoryResponse(raw)
    expect(result[0].sentAt).toBeNull()
  })

  it('coerces missing string fields to empty string', () => {
    const raw = [{}]
    const result = normalizeAlertHistoryResponse(raw)
    const item = result[0]
    expect(item.id).toBe('')
    expect(item.cabinetId).toBe('')
    expect(item.channel).toBe('')
    expect(item.eventType).toBe('')
    expect(item.messageText).toBe('')
    expect(item.status).toBe('')
    expect(item.createdAt).toBe('')
    expect(item.sentAt).toBeNull()
  })

  it('returns [] for non-array input', () => {
    expect(normalizeAlertHistoryResponse(null)).toEqual([])
    expect(normalizeAlertHistoryResponse('x')).toEqual([])
  })

  it('returns [] for empty array', () => {
    expect(normalizeAlertHistoryResponse([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// normalizeAlertSummaryResponse
// ---------------------------------------------------------------------------

describe('normalizeAlertSummaryResponse', () => {
  it('maps a full summary response to canonical AlertSummary', () => {
    const raw = {
      period: '7d',
      totalAlerts: 42,
      bySeverity: { critical: 5, warning: 20, info: 17 },
      byType: [
        {
          alertType: 'margin_drop',
          severity: 'critical',
          count: 5,
          lastTriggered: '2025-12-01T12:00:00Z',
        },
      ],
    }

    const result = normalizeAlertSummaryResponse(raw)

    expect(result).toEqual({
      period: '7d',
      totalAlerts: 42,
      bySeverity: { critical: 5, warning: 20, info: 17 },
      byType: [
        {
          alertType: 'margin_drop',
          severity: 'critical',
          count: 5,
          lastTriggered: '2025-12-01T12:00:00Z',
        },
      ],
    })
  })

  it('coerces bySeverity values with toCount (non-numeric → 0)', () => {
    const raw = {
      period: '7d',
      totalAlerts: 0,
      bySeverity: { critical: null, warning: 'abc', info: undefined },
      byType: [],
    }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.bySeverity.critical).toBe(0)
    expect(result.bySeverity.warning).toBe(0)
    expect(result.bySeverity.info).toBe(0)
  })

  it('handles missing bySeverity gracefully', () => {
    const raw = { period: '7d', totalAlerts: 0, byType: [] }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.bySeverity).toEqual({})
  })

  it('handles null bySeverity gracefully', () => {
    const raw = { period: '7d', totalAlerts: 0, bySeverity: null, byType: [] }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.bySeverity).toEqual({})
  })

  it('coerces totalAlerts with toCount fallback', () => {
    const raw = { period: '7d', totalAlerts: null, bySeverity: {}, byType: [] }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.totalAlerts).toBe(0)
  })

  it('coerces period to empty string when missing', () => {
    const raw = { totalAlerts: 5, bySeverity: {}, byType: [] }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.period).toBe('')
  })

  it('maps byType items with coercion', () => {
    const raw = {
      period: '7d',
      totalAlerts: 3,
      bySeverity: {},
      byType: [{ alertType: 'roas_low', count: 'not-a-number' }],
    }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.byType).toHaveLength(1)
    expect(result.byType[0].alertType).toBe('roas_low')
    expect(result.byType[0].count).toBe(0)
    expect(result.byType[0].lastTriggered).toBeNull()
  })

  it('handles empty byType array', () => {
    const raw = { period: '7d', totalAlerts: 0, bySeverity: {}, byType: [] }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.byType).toEqual([])
  })

  it('handles non-array byType as empty array', () => {
    const raw = { period: '7d', totalAlerts: 0, bySeverity: {}, byType: null }
    const result = normalizeAlertSummaryResponse(raw)
    expect(result.byType).toEqual([])
  })

  it('handles completely empty/invalid input', () => {
    const result = normalizeAlertSummaryResponse(null)
    expect(result).toEqual({
      period: '',
      totalAlerts: 0,
      byType: [],
      bySeverity: {},
    })
  })
})
