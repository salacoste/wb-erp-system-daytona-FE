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

export const LEGEND_ITEMS = [
  { color: '#22C55E', label: 'Успешно' },
  { color: '#F59E0B', label: 'Частично' },
  { color: '#EF4444', label: 'Ошибка' },
  { color: '#6B7280', label: 'Пропущено' },
  { color: '#F3F4F6', label: 'Нет данных', border: true },
  { color: '#3B82F6', label: 'В процессе' },
  { color: '#10B981', label: 'Восстановлено' },
]
