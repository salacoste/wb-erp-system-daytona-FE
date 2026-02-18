/**
 * HeatmapCell — Single colored cell in the pipeline heatmap grid
 * Epic 68-FE (Story 68.3)
 * Keyboard-accessible (tabIndex=0) with tooltip on hover/focus
 * 7 status colors matching design system
 */

'use client'

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { HeatmapCell as HeatmapCellType } from '../types/monitoring'
import { HeatmapTooltip } from './HeatmapTooltip'

/** Status → background color mapping */
const STATUS_COLORS: Record<string, string> = {
  success: '#22C55E',
  partial: '#F59E0B',
  failed: '#EF4444',
  missed: '#6B7280',
  no_data: '#F3F4F6',
  pending: '#3B82F6',
  recovered: '#10B981',
}

/** Status → Russian label for aria */
const CELL_STATUS_RU: Record<string, string> = {
  success: 'Успешно',
  partial: 'Частично',
  failed: 'Ошибка',
  missed: 'Пропущено',
  no_data: 'Нет данных',
  pending: 'В процессе',
  recovered: 'Восстановлено',
}

/** Format period start to compact date label */
function formatCellDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface HeatmapCellProps {
  cell: HeatmapCellType
  pipelineName: string
}

export function HeatmapCellComponent({ cell, pipelineName }: HeatmapCellProps) {
  const bgColor = STATUS_COLORS[cell.status] ?? STATUS_COLORS.no_data
  const statusRu = CELL_STATUS_RU[cell.status] ?? cell.status
  const dateLabel = formatCellDate(cell.periodStart)

  const ariaLabel = `${pipelineName}, ${dateLabel}, статус: ${statusRu}, ${cell.executionsActual}/${cell.executionsExpected} выполнений`

  // Border for no_data to distinguish from white background
  const borderClass = cell.status === 'no_data' ? 'border border-gray-300' : ''

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="gridcell"
          tabIndex={0}
          aria-label={ariaLabel}
          className={`h-7 w-7 shrink-0 cursor-pointer rounded-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 md:h-9 md:w-9 ${borderClass}`}
          style={{ backgroundColor: bgColor }}
        />
      </TooltipTrigger>
      <TooltipContent size="lg" side="top">
        <HeatmapTooltip cell={cell} pipelineName={pipelineName} />
      </TooltipContent>
    </Tooltip>
  )
}
