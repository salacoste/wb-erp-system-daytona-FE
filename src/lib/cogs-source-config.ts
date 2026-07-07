/**
 * COGS provenance — single source of truth for the source → { icon, label } mapping.
 *
 * Consolidated from three previously-drifting maps (BD-13 DRY): the history `SourceCell`
 * and the edit-dialog `sourceLabels` now both derive from `COGS_SOURCE_CONFIG` below.
 * Adding a backend source is now ONE edit here + ONE entry on the `CogsSource` union —
 * every surface picks it up.
 *
 * Exhaustive: `Record<CogsSource, …>` is compiler-checked, so a new union member without a
 * config entry fails `tsc` (the exact drift that let `moysklad` silently fall back to
 * `manual` / ✏️ «Ручной ввод» in BD-13).
 */
import type { CogsSource } from '@/types/cogs'

export interface CogsSourceMeta {
  icon: string
  label: string
}

export const COGS_SOURCE_CONFIG: Record<CogsSource, CogsSourceMeta> = {
  manual: { icon: '✏️', label: 'Ручной ввод' },
  import: { icon: '📥', label: 'Импорт из файла' },
  system: { icon: '⚙️', label: 'Системный пересчёт' },
  moysklad: { icon: '🔄', label: 'Синхронизация с МойСклад' },
}
