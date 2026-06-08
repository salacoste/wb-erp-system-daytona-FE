/**
 * Reorder Status & Velocity Trend Configuration
 * Extracted from supply-planning-config.ts for file size compliance
 */

import type { ReorderStatus, VelocityTrend, ReorderStatusConfig } from '@/types/supply-planning'

// -- Reorder Status Helpers --

/** Get display configuration for reorder status */
export function getReorderStatusConfig(status: ReorderStatus): ReorderStatusConfig {
  const configs: Record<ReorderStatus, ReorderStatusConfig> = {
    urgent: { label: 'Срочно заказать', color: '#EF4444', bgColor: '#FEE2E2' },
    soon: { label: 'Заказать скоро', color: '#F97316', bgColor: '#FED7AA' },
    ok: { label: 'Запас достаточен', color: '#22C55E', bgColor: '#D1FAE5' },
  }
  return configs[status]
}

/** Get label for reorder status */
export function getReorderStatusLabel(status: ReorderStatus): string {
  return getReorderStatusConfig(status).label
}

/** Get color for reorder status */
export function getReorderStatusColor(status: ReorderStatus): string {
  return getReorderStatusConfig(status).color
}

// -- Velocity Trend Helpers --

/**
 * Velocity trend display configuration
 * UX Specs by Sally (UX Expert) - 2025-12-12
 */
// 'no_data' is excluded: it has no renderable trend display (Defensive Frontend — indicate, don't fabricate).
export const VELOCITY_TREND_CONFIG: Record<
  Exclude<VelocityTrend, 'no_data'>,
  {
    label: string
    icon: string
    color: string
    textClass: string
    lucideIcon: string
  }
> = {
  growing: {
    label: 'Растёт',
    icon: '↗️',
    color: '#16A34A',
    textClass: 'text-green-600',
    lucideIcon: 'TrendingUp',
  },
  stable: {
    label: 'Стабильно',
    icon: '➡️',
    color: '#6B7280',
    textClass: 'text-gray-500',
    lucideIcon: 'Minus',
  },
  declining: {
    label: 'Падает',
    icon: '↘️',
    color: '#DC2626',
    textClass: 'text-red-600',
    lucideIcon: 'TrendingDown',
  },
} as const

/** Get display info for a renderable velocity trend ('no_data' has no display — handle at call site). */
export function getVelocityTrendInfo(trend: Exclude<VelocityTrend, 'no_data'>): {
  label: string
  icon: string
  color: string
  textClass: string
  lucideIcon: string
} {
  return VELOCITY_TREND_CONFIG[trend]
}
