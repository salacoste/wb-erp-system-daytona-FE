/**
 * Shared monitoring-domain constants.
 * Epic 93-FE Story 93.1: extracted from PipelineStatusGrid.tsx + monitor-pipeline-utils.ts
 * to close the "mirrors X — keep in sync" ledger from Epic 92-FE retro action item #4.
 *
 * Consumers:
 * - src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx
 * - src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts (re-exported)
 */
import type { PipelineStatus } from '@/app/(dashboard)/monitoring/types/monitoring'

/**
 * Tailwind utility classes for pipeline-status badges.
 * Key: PipelineStatus enum value. Value: `bg-*` + `text-*` class pair.
 */
export const STATUS_COLORS: Record<PipelineStatus, string> = {
  healthy: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  critical: 'bg-red-500 text-white',
  stale: 'bg-gray-500 text-white',
  no_data: 'bg-gray-300 text-gray-700',
}

/**
 * Russian display labels for pipeline-status badges, prefixed with a status glyph.
 * Key: PipelineStatus enum value. Value: glyph + Russian status word.
 */
export const STATUS_LABELS: Record<PipelineStatus, string> = {
  healthy: '✓ Работает',
  warning: '⚠ Задержка',
  critical: '✕ Критично',
  stale: '◷ Устарело',
  no_data: '— Нет данных',
}
