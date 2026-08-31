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
 * Story 174.2: semantic status tokens (solid valence pairs for badge text);
 * stale/no_data render muted — a missing signal is not an error valence.
 */
export const STATUS_COLORS: Record<PipelineStatus, string> = {
  healthy: 'bg-status-success text-status-success-foreground',
  warning: 'bg-status-warning text-status-warning-foreground',
  critical: 'bg-status-error text-status-error-foreground',
  stale: 'bg-muted text-muted-foreground',
  no_data: 'bg-muted text-muted-foreground',
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
