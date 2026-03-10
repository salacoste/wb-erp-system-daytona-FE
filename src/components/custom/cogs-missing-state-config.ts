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
    badgeClassName: 'bg-red-600 text-white border-red-600',
    iconBgColor: 'bg-red-50',
    iconTextColor: 'text-red-600',
  },
  warning: {
    badgeText: 'Внимание',
    message: 'Назначьте COGS для точного расчета маржи',
    actionText: 'Назначить COGS',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-orange-100 text-orange-800 border-orange-400',
    iconBgColor: 'bg-orange-50',
    iconTextColor: 'text-orange-600',
  },
  info: {
    badgeText: 'Почти готово',
    message: 'Назначьте COGS оставшимся товарам',
    actionText: 'Дособрать товары',
    badgeVariant: 'outline',
    badgeClassName: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    iconBgColor: 'bg-yellow-50',
    iconTextColor: 'text-yellow-700',
  },
}
