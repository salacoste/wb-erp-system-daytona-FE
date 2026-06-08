/**
 * Health History Chart — constants and pure helpers.
 * Epic 68-FE (Story 68.7), extracted from HealthHistoryChart.
 */

import type { HealthReportSummary, OverallStatus } from '../types/monitoring'

export type PeriodDays = 7 | 14 | 30

export const PERIOD_OPTIONS: { days: PeriodDays; label: string }[] = [
  { days: 7, label: '7 дней' },
  { days: 14, label: '14 дней' },
  { days: 30, label: '30 дней' },
]

export const STATUS_COLORS: Record<OverallStatus, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  critical: 'bg-red-500',
}

export const STATUS_RING: Record<OverallStatus, string> = {
  healthy: 'ring-green-300',
  degraded: 'ring-yellow-300',
  critical: 'ring-red-300',
}

export const STATUS_EMOJI: Record<OverallStatus, string> = {
  healthy: '✅',
  degraded: '⚠️',
  critical: '❌',
}

export function formatDayLabel(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr)
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return {
    day: days[d.getDay()],
    date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }
}

/** Count reports by status for trend summary */
export function countByStatus(reports: HealthReportSummary[]) {
  let healthy = 0
  let degraded = 0
  let critical = 0
  for (const r of reports) {
    if (r.status === 'healthy') healthy++
    else if (r.status === 'degraded') degraded++
    else critical++
  }
  return { healthy, degraded, critical }
}
