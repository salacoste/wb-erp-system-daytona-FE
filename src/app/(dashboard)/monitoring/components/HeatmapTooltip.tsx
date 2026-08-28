/**
 * HeatmapTooltip — Tooltip content for a heatmap cell
 * Epic 68-FE (Story 68.3)
 * Displays pipeline execution details: status, counts, duration, errors
 */

import type { HeatmapCell } from '../types/monitoring'

const CELL_STATUS_RU: Record<string, string> = {
  success: 'Успешно',
  partial: 'Частично',
  failed: 'Ошибка',
  missed: 'Пропущено',
  no_data: 'Нет данных',
  pending: 'В процессе',
  recovered: 'Восстановлено',
}

/** Format milliseconds to human-readable Russian duration */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} мс`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} с`
  return `${(ms / 60_000).toFixed(1)} мин`
}

/** Format ISO date to compact Russian form */
function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface HeatmapTooltipProps {
  cell: HeatmapCell
  pipelineName: string
}

export function HeatmapTooltip({ cell, pipelineName }: HeatmapTooltipProps) {
  const statusLabel = CELL_STATUS_RU[cell.status] ?? cell.status
  const hasErrors = cell.errors.length > 0
  const visibleErrors = cell.errors.slice(0, 5)

  return (
    <div className="space-y-1.5 text-xs">
      {/* Pipeline name */}
      <p className="font-semibold">{pipelineName}</p>

      {/* Period */}
      <p className="text-muted-foreground">
        {formatDate(cell.periodStart)} — {formatDate(cell.periodEnd)}
      </p>

      {/* Status */}
      <p>
        Статус: <span className="font-medium">{statusLabel}</span>
      </p>

      {/* Execution counts */}
      <div className="space-y-0.5">
        <p>
          Выполнений: {cell.executionsActual} / {cell.executionsExpected}
        </p>
        <p>Успешных: {cell.successCount}</p>
        <p>Ошибок: {cell.failureCount}</p>
      </div>

      {/* Average duration */}
      {cell.avgDurationMs !== null && <p>Ср. длительность: {formatDuration(cell.avgDurationMs)}</p>}

      {/* Errors section */}
      {hasErrors && (
        <div className="mt-1 border-t border-border pt-1">
          <p className="font-semibold">Ошибки</p>
          <ul className="mt-0.5 space-y-0.5">
            {visibleErrors.map((err, i) => (
              <li key={i} className="text-status-error">
                <span className="text-muted-foreground">{formatDate(err.timestamp)}</span>
                {' — '}
                {err.errorMessage}
              </li>
            ))}
          </ul>
          {cell.errors.length > 5 && (
            <p className="mt-0.5 text-muted-foreground">+{cell.errors.length - 5} ещё...</p>
          )}
        </div>
      )}
    </div>
  )
}
