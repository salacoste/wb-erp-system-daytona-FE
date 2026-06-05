/**
 * Shared empty-fixture factories for Alerts domain tests.
 *
 * Convention: counts = 0, strings = '', nullables = null,
 * objects = {}. Mirrors normalizer fallbacks at
 * `src/lib/api/alerts-normalizer.ts`.
 *
 * @see src/types/alerts.ts
 * @see src/lib/api/alerts-normalizer.ts
 */

import type { AlertRule, AlertSummary } from '@/types/alerts'

/**
 * Single empty AlertRule factory — all fields set to safe defaults.
 * Useful for testing rule rendering, form reset, and edge cases.
 */
export function emptyAlertRule(overrides?: Partial<AlertRule>): AlertRule {
  return {
    id: '',
    cabinetId: '',
    alertType: '',
    enabled: false,
    thresholds: {},
    cooldownMinutes: 0,
    severity: 'info',
    channels: {},
    label: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

/**
 * Empty AlertSummary factory — zero counts, empty byType/bySeverity.
 * Triggers "no alerts" empty state in AlertSummaryCards.
 */
export function emptyAlertSummary(overrides?: Partial<AlertSummary>): AlertSummary {
  return {
    period: '',
    totalAlerts: 0,
    byType: [],
    bySeverity: {},
    ...overrides,
  }
}
