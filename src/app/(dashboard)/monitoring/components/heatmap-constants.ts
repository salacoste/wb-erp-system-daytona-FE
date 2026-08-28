/**
 * Heatmap constants and helpers — Epic 68-FE (Story 68.3)
 * Extracted to keep PipelineHeatmap.tsx under 200 lines
 */

import type { PipelineCategory } from '../types/monitoring'

// --- Date helpers ---

export function getDefaultDateRange(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - days)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function getAutoResolution(days: number): 'hour' | 'day' {
  return days <= 3 ? 'hour' : 'day'
}

// --- Period options ---

export const PERIOD_OPTIONS = [
  { label: 'Сегодня', days: 1 },
  { label: '7 дней', days: 7 },
  { label: '14 дней', days: 14 },
  { label: '30 дней', days: 30 },
] as const

// --- Filter presets ---

export type FilterPreset = 'all' | 'high_frequency' | 'daily' | 'with_issues'

export const FILTER_PRESETS: { key: FilterPreset; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'high_frequency', label: 'Высокочастотные' },
  { key: 'daily', label: 'Ежедневные' },
  { key: 'with_issues', label: 'С проблемами' },
]

// --- Category Russian labels ---

export const CATEGORY_RU: Record<PipelineCategory, string> = {
  high_frequency: 'Высокочаст.',
  daily: 'Ежедн.',
  weekly: 'Еженед.',
}

// --- Legend items ---

// Colors mirror HeatmapCell STATUS_COLORS (semantic CSS-var tokens, Story 172.12-FE);
// `recovered` uses the alpha-variant positive token to stay distinct from `success`.
export const LEGEND_ITEMS = [
  { color: 'var(--color-chart-positive)', label: 'Успешно' },
  { color: 'var(--color-status-warning)', label: 'Частично' },
  { color: 'var(--color-chart-negative)', label: 'Ошибка' },
  { color: 'var(--color-muted-foreground)', label: 'Пропущено' },
  { color: 'var(--color-muted)', label: 'Нет данных', border: true },
  { color: 'var(--color-status-information)', label: 'В процессе' },
  {
    color: 'color-mix(in srgb, var(--color-chart-positive) 60%, transparent)',
    label: 'Восстановлено',
  },
]
