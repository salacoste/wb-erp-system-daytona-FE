/**
 * CogsMissingState configuration and helpers
 * Extracted from CogsMissingState.tsx for file size compliance
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

/** Coverage level classification */
export type CoverageLevel = 'critical' | 'warning' | 'info' | 'complete'

/** Determine coverage level based on percentage */
export function getCoverageLevel(coverage: number): CoverageLevel {
  if (coverage === 100) return 'complete'
  if (coverage >= 50) return 'info'
  if (coverage > 0) return 'warning'
  return 'critical'
}

/** Coverage level configuration */
export const COVERAGE_CONFIG: Record<
  Exclude<CoverageLevel, 'complete'>,
  {
    badgeText: string
    message: string
    actionText: string
    badgeVariant: 'destructive' | 'secondary' | 'outline'
    badgeClassName: string
    iconBgColor: string
    iconTextColor: string
  }
> = {
  critical: {
    badgeText: 'Критично',
    message: 'Назначьте себестоимость товарам для расчета маржи',
    actionText: 'Назначить COGS',
    badgeVariant: 'destructive',
    badgeClassName: 'bg-status-error text-status-error-foreground border-status-error',
    iconBgColor: 'bg-status-error/10',
    iconTextColor: 'text-status-error',
  },
  warning: {
    badgeText: 'Внимание',
    message: 'Назначьте COGS для точного расчета маржи',
    actionText: 'Назначить COGS',
    badgeVariant: 'secondary',
    badgeClassName: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
    iconBgColor: 'bg-status-warning/10',
    iconTextColor: 'text-status-warning',
  },
  info: {
    badgeText: 'Почти готово',
    message: 'Назначьте COGS оставшимся товарам',
    actionText: 'Дособрать товары',
    badgeVariant: 'outline',
    badgeClassName: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
    iconBgColor: 'bg-status-warning/10',
    iconTextColor: 'text-status-warning',
  },
}
