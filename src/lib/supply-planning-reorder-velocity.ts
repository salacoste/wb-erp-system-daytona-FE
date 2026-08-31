/**
 * Reorder Status & Velocity Trend Configuration
 * Extracted from supply-planning-config.ts for file size compliance
 */

import type { ReorderStatus, VelocityTrend, ReorderStatusConfig } from '@/types/supply-planning'

// -- Reorder Status Helpers --

/**
 * Get display configuration for reorder status.
 * Story 174.2: raw hexes → semantic CSS-var tokens (tints via color-mix idiom;
 * 'soon' orange maps to the warning valence — the closest caution tier).
 */
export function getReorderStatusConfig(status: ReorderStatus): ReorderStatusConfig {
  const configs: Record<ReorderStatus, ReorderStatusConfig> = {
    urgent: {
      label: 'Срочно заказать',
      color: 'var(--color-status-error)',
      bgColor: 'color-mix(in srgb, var(--color-status-error) 15%, transparent)',
    },
    soon: {
      label: 'Заказать скоро',
      color: 'var(--color-status-warning)',
      bgColor: 'color-mix(in srgb, var(--color-status-warning) 15%, transparent)',
    },
    ok: {
      label: 'Запас достаточен',
      color: 'var(--color-status-success)',
      bgColor: 'color-mix(in srgb, var(--color-status-success) 15%, transparent)',
    },
    // Story 169.13 (pattern #218/#226): muted visible-unknown tier — never rendered as
    // the optimistic green "Запас достаточен".
    unknown: {
      label: 'Статус неизвестен',
      color: 'var(--color-muted-foreground)',
      bgColor: 'var(--color-muted)',
    },
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
 * Story 174.2: textClass/color → semantic tokens (growing=success, stable=muted,
 * declining=error). Route presentation renders via TREND_TEXT_TOKENS (169.13).
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
    color: 'var(--color-status-success)',
    textClass: 'text-status-success',
    lucideIcon: 'TrendingUp',
  },
  stable: {
    label: 'Стабильно',
    icon: '➡️',
    color: 'var(--color-muted-foreground)',
    textClass: 'text-muted-foreground',
    lucideIcon: 'Minus',
  },
  declining: {
    label: 'Падает',
    icon: '↘️',
    color: 'var(--color-status-error)',
    textClass: 'text-status-error',
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
