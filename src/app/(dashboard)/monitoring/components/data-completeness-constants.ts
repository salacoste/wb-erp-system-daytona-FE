/**
 * Data completeness constants and helpers
 * Epic 68-FE (Story 68.4) — extracted from DataCompletenessTable
 * Pure data/config — no 'use client' needed
 */

import type { DataCompletenessTable as DataCompletenessRow } from '../types/monitoring'

// --- Badge config by completeness status ---

export const COMPLETENESS_BADGE: Record<
  string,
  { label: string; variant: 'outline'; className: string }
> = {
  complete: {
    label: 'Полные',
    variant: 'outline',
    className: 'border-status-success text-status-success',
  },
  incomplete: {
    label: 'Неполные',
    variant: 'outline',
    className: 'border-status-warning text-status-warning',
  },
  critical: {
    label: 'Критично',
    variant: 'outline',
    className: 'border-status-error text-status-error',
  },
}

// --- Health bar config by overall status ---

export const HEALTH_CONFIG: Record<string, { label: string; className: string; barClass: string }> =
  {
    healthy: {
      label: 'Все данные загружены',
      className: 'text-status-success',
      barClass: '[&>div]:bg-status-success',
    },
    degraded: {
      label: 'Незначительные пропуски',
      className: 'text-status-warning',
      barClass: '[&>div]:bg-status-warning',
    },
    critical: {
      label: 'Требуется внимание',
      className: 'text-status-error',
      barClass: '[&>div]:bg-status-error',
    },
  }

// --- Helper functions ---

/** Average completeness ratio across all tables, as integer percent */
export function getOverallPercent(tables: DataCompletenessRow[]): number {
  if (tables.length === 0) return 0
  const sum = tables.reduce((acc, t) => acc + t.completenessRatio, 0)
  return Math.round((sum / tables.length) * 100)
}

/** Sort tables ascending by completeness ratio (worst first) */
export function sortByCompleteness(tables: DataCompletenessRow[]): DataCompletenessRow[] {
  return [...tables].sort((a, b) => a.completenessRatio - b.completenessRatio)
}
