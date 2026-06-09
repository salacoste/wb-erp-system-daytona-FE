/** PipelineHeatmap — Epic 68-FE (Story 68.3). Auto resolution: <=3d → hour, >3d → day */

'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPercentage, formatPercentageInt } from '@/lib/utils'
import { usePipelineGrid } from '../hooks/use-pipeline-grid'
import { HeatmapCellComponent } from './HeatmapCell'
import { SummaryItem, HeatmapSkeleton } from './PipelineHeatmapSubcomponents'
import type { GridParams } from '../types/monitoring'
import {
  getDefaultDateRange,
  getAutoResolution,
  PERIOD_OPTIONS,
  FILTER_PRESETS,
  CATEGORY_RU,
  LEGEND_ITEMS,
  type FilterPreset,
} from './heatmap-constants'

interface PipelineHeatmapProps {
  enabled: boolean
}

export function PipelineHeatmap({ enabled }: PipelineHeatmapProps) {
  const [days, setDays] = useState(7)
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('all')

  const range = useMemo(() => getDefaultDateRange(days), [days])
  const resolution = getAutoResolution(days)

  const params: GridParams = useMemo(
    () => ({ from: range.from, to: range.to, resolution }),
    [range, resolution]
  )

  const { data: grid, isLoading, isError, refetch } = usePipelineGrid(params, enabled)

  // Filter pipelines by preset
  const filteredPipelines = useMemo(() => {
    if (!grid) return []
    const all = grid.pipelines
    if (activeFilter === 'all') return all
    if (activeFilter === 'high_frequency') return all.filter(p => p.category === 'high_frequency')
    if (activeFilter === 'daily') return all.filter(p => p.category === 'daily')
    return all.filter(p => ['warning', 'critical'].includes(p.status))
  }, [grid, activeFilter])

  if (!enabled) return null
  if (isLoading) return <HeatmapSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center py-12" role="alert">
        <p className="text-sm text-red-600">Не удалось загрузить карту активности</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    )
  }

  if (!grid) return null
  const { summary } = grid

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 p-3 text-sm">
        <SummaryItem label="Здоровье" value={formatPercentageInt(summary.healthScore)} />
        <SummaryItem label="Выполнений" value={summary.totalExecutions.toLocaleString('ru-RU')} />
        <SummaryItem label="Ошибок" value={summary.totalFailures.toLocaleString('ru-RU')} />
        {/* successRate is a 0-1 ratio (#149:243) — scale to percent before formatting */}
        <SummaryItem label="Успешность" value={formatPercentage(summary.successRate * 100)} />
      </div>

      {/* Period buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Период:</span>
        {PERIOD_OPTIONS.map(opt => (
          <Button
            key={opt.days}
            variant={days === opt.days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(opt.days)}
            aria-pressed={days === opt.days}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Filter presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Фильтр:</span>
        {FILTER_PRESETS.map(fp => {
          const active = activeFilter === fp.key
          return (
            <button
              key={fp.key}
              type="button"
              onClick={() => setActiveFilter(active && fp.key !== 'all' ? 'all' : fp.key)}
              aria-pressed={active}
            >
              <Badge
                variant={active ? 'default' : 'outline'}
                className="cursor-pointer select-none"
              >
                {fp.label}
                {active && fp.key !== 'all' && (
                  <span className="ml-1 text-xs opacity-70" aria-hidden="true">
                    ×
                  </span>
                )}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Heatmap grid */}
      <div
        className="overflow-x-auto rounded-lg border"
        role="grid"
        aria-label="Карта активности пайплайнов"
      >
        <div className="min-w-[600px]">
          {filteredPipelines.map(pipeline => (
            <div key={pipeline.pipelineId} className="flex border-b last:border-b-0" role="row">
              <div className="sticky left-0 z-10 flex w-48 shrink-0 items-center gap-1.5 border-r bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pipeline.displayName}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="px-1 py-0 text-[10px]">
                      {CATEGORY_RU[pipeline.category]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {pipeline.expectedFrequency}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5">
                {pipeline.cells.map((cell, idx) => (
                  <HeatmapCellComponent key={idx} cell={cell} pipelineName={pipeline.displayName} />
                ))}
              </div>
            </div>
          ))}
          {filteredPipelines.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Нет пайплайнов для отображения
            </p>
          )}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div
              className={`h-3.5 w-3.5 rounded-sm ${item.border ? 'border border-gray-300' : ''}`}
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
