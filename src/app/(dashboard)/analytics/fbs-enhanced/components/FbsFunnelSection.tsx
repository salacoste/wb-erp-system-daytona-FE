/**
 * FBS Funnel Section — Section 5 of 5
 * Epic 96-FE Story 96.13: 4-stage conversion funnel (views → cart → orders → deliveries).
 *
 * SVG geometry and stage-building logic extracted to FbsFunnelChart.tsx.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPercentage } from '@/lib/utils'
import type { FbsFunnelData } from '@/types/fbs-enhanced'
import { buildStages, formatCount, getStagePoints, SVG_WIDTH, SVG_HEIGHT } from './FbsFunnelChart'

interface FbsFunnelSectionProps {
  funnelData: FbsFunnelData | null | undefined
}

export function FbsFunnelSection({ funnelData }: FbsFunnelSectionProps) {
  if (funnelData == null) {
    return (
      <section aria-label="Воронка конверсии" data-testid="fbs-funnel-section">
        <h2 className="text-lg font-semibold mb-3">Воронка конверсии</h2>
        <p className="text-sm text-muted-foreground">Нет данных по воронке</p>
      </section>
    )
  }

  const stages = buildStages(funnelData)
  const maxValue = Math.max(...stages.map(s => s.value), 1)
  const hasInversion = stages.some(s => s.anomalous)

  return (
    <section aria-label="Воронка конверсии" data-testid="fbs-funnel-section">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Воронка конверсии</h2>
        {/* M-2 fix: inversion anomaly indicator per CLAUDE.md Defensive Frontend Principle */}
        {hasInversion && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                role="button"
                aria-label="Аномалия данных воронки"
                className="inline-flex items-center gap-1 text-amber-600 cursor-help"
                data-testid="fbs-funnel-inversion-warning"
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Аномалия данных воронки: следующая стадия больше предыдущей. Возможна ошибка данных
                на стороне WB.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="rounded-md border bg-background p-4">
        <div className="flex flex-col items-center gap-0 lg:flex-row lg:items-start lg:gap-8">
          {/* SVG funnel — L-1 fix: role="img" + <title> for accessibility */}
          <svg
            role="img"
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            data-testid="fbs-funnel-svg"
            className="shrink-0"
          >
            <title>Воронка конверсии — 4 стадии</title>
            {stages.map((stage, i) => (
              <polygon
                key={stage.subLabel}
                points={getStagePoints(stage, i, stages, maxValue)}
                fill={stage.color}
                opacity={0.85}
                aria-label={`${stage.label}: ${formatCount(stage.value)}`}
              />
            ))}
          </svg>

          {/* Stage labels + values */}
          <div className="flex flex-col gap-3 mt-4 lg:mt-0">
            {stages.map((stage, i) => (
              <div key={stage.subLabel} className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: stage.color }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-xl font-bold" style={{ color: stage.color }}>
                    {formatCount(stage.value)}
                  </p>
                  {i > 0 && stages[i - 1].value > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage((stage.value / stages[i - 1].value) * 100, 1)} от
                      предыдущего
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
