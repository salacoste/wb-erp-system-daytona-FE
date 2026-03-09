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
  complete: { label: 'Полные', variant: 'outline', className: 'border-green-500 text-green-700' },
  incomplete: {
    label: 'Неполные',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-700',
  },
  critical: { label: 'Критично', variant: 'outline', className: 'border-red-500 text-red-700' },
}

// --- Health bar config by overall status ---

export const HEALTH_CONFIG: Record<string, { label: string; className: string; barClass: string }> =
  {
    healthy: {
      label: 'Все данные загружены',
      className: 'text-green-700',
      barClass: '[&>div]:bg-green-500',
    },
    degraded: {
      label: 'Незначительные пропуски',
      className: 'text-yellow-700',
      barClass: '[&>div]:bg-yellow-500',
    },
    critical: {
      label: 'Требуется внимание',
      className: 'text-red-700',
      barClass: '[&>div]:bg-red-500',
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
