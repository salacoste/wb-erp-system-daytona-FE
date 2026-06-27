'use client'

/**
 * DashboardHero (TZ-5) — the focused, persona-tuned hero KPI strip (Tier 1).
 *
 * Renders the active persona's ≤6 hero KPIs (from persona-hero.ts / spec §4C) with the
 * lead metric rendered largest. The active persona comes from the widget store (TZ-4);
 * values are resolved from the grid props. This is the at-a-glance summary above the
 * detailed P&L grid (Tier 2).
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-5)
 */

import { useDashboardWidgetsStore } from '@/stores/dashboardWidgetsStore'
import { PERSONA_LABELS } from '@/stores/persona-presets'
import { getPersonaHeroKpis, type HeroKpiDef } from './persona-hero'
import {
  cn,
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercentage,
} from '@/lib/utils'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

export function DashboardHero(props: DashboardMetricsGridProps): React.ReactElement {
  const persona = useDashboardWidgetsStore(s => s.persona) ?? 'Owner'
  const kpis = getPersonaHeroKpis(persona, props)

  return (
    <section
      aria-label={`Главные метрики · ${PERSONA_LABELS[persona]}`}
      className="grid grid-cols-2 items-stretch gap-3 lg:grid-cols-6"
    >
      {kpis.map(({ def, value }) => (
        <HeroKpiTile key={def.id} def={def} value={value} />
      ))}
    </section>
  )
}

function formatHeroValue(def: HeroKpiDef, value: number | null): string {
  if (value == null) return '—'
  switch (def.format) {
    case 'currency':
      return formatCurrencyCompact(value)
    case 'percent':
      return formatPercentage(value)
    case 'pcs':
      return `${formatNumber(value)} шт`
  }
}

function HeroKpiTile({
  def,
  value,
}: {
  def: HeroKpiDef
  value: number | null
}): React.ReactElement {
  const text = formatHeroValue(def, value)
  const isNegative = value != null && value < 0
  return (
    <div
      role="article"
      aria-label={`${def.label}: ${text}`}
      className={cn(
        'rounded-lg border bg-card p-3 transition-shadow hover:shadow-md',
        def.lead && 'col-span-2'
      )}
    >
      <div className="text-xs font-medium text-muted-foreground">{def.label}</div>
      <div
        title={def.format === 'currency' && value != null ? formatCurrency(value) : undefined}
        className={cn(
          'mt-1 min-w-0 break-words font-bold tabular-nums',
          def.lead ? 'text-2xl' : 'text-xl',
          isNegative ? 'text-red-600' : 'text-foreground'
        )}
      >
        {text}
      </div>
    </div>
  )
}
