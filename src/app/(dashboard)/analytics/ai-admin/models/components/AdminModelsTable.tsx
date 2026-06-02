'use client'

/**
 * AdminModelsTable — pure presentational table for AI models list.
 * Extracted from AdminModelsList for file-size compliance (Story 112.1-FE).
 * AP#8: null MAPE → '—'. AP#10: modelId via String(id).
 * aria-sort per Story 110.2-FE F-6 / SkuAccuracyTable pattern.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import {
  formatMapeDisplay,
  getModelTypeLabel,
  STATUS_LABELS,
  STATUS_VARIANTS,
  type SortCol,
  type SortDir,
} from './admin-models-helpers'

/** F-10: statuses for which rollback makes no sense / backend will reject. */
// F-39: 'deprecated' (live status) is rollback-blocked like 'retired' — same end-of-life semantics.
const ROLLBACK_BLOCKED_STATUSES = new Set([
  'training',
  'rolled_back',
  'failed',
  'retired',
  'deprecated',
])
import type { AiModel } from '@/types/ai/models'

interface SortableHeadProps {
  col: SortCol
  label: string
  sortCol: SortCol
  sortDir: SortDir
  onSortClick: (col: SortCol) => void
}

function SortableHead({ col, label, sortCol, sortDir, onSortClick }: SortableHeadProps) {
  const isActive = sortCol === col
  const ariaSort = isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
  return (
    <TableHead aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSortClick(col)}
        aria-label={`Сортировать по ${label}`}
        className="flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        {label}
        {isActive && (sortDir === 'asc' ? ' ↑' : ' ↓')}
      </button>
    </TableHead>
  )
}

interface AdminModelsTableProps {
  models: AiModel[]
  sortCol: SortCol
  sortDir: SortDir
  onSortClick: (col: SortCol) => void
  onRollback: (model: AiModel) => void
}

export function AdminModelsTable({
  models,
  sortCol,
  sortDir,
  onSortClick,
  onRollback,
}: AdminModelsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Артикул модели</TableHead>
            <TableHead>Тип</TableHead>
            <SortableHead
              col="version"
              label="Версия"
              sortCol={sortCol}
              sortDir={sortDir}
              onSortClick={onSortClick}
            />
            <TableHead>Статус</TableHead>
            <SortableHead
              col="mape"
              label="MAPE"
              sortCol={sortCol}
              sortDir={sortDir}
              onSortClick={onSortClick}
            />
            <SortableHead
              col="createdAt"
              label="Создана"
              sortCol={sortCol}
              sortDir={sortDir}
              onSortClick={onSortClick}
            />
            <TableHead>Действие</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map(model => (
            <TableRow key={model.id}>
              {/* AP#10: opaque ID via String() — never formatNumber */}
              <TableCell>{String(model.id)}</TableCell>
              {/* F-40: localized label (admin endpoint returns 10 model types as raw
                  snake_case); unknown types fall back to the raw value. */}
              <TableCell>{getModelTypeLabel(model.modelType)}</TableCell>
              <TableCell>v{model.version}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[model.status] ?? 'outline'}>
                  {STATUS_LABELS[model.status] ?? model.status}
                </Badge>
              </TableCell>
              {/* AP#8: null MAPE → '—' */}
              <TableCell>{formatMapeDisplay(model.metrics.mape)}</TableCell>
              <TableCell>{model.trainedAt ? formatDate(model.trainedAt) : '—'}</TableCell>
              <TableCell>
                {/* F-10: disable for statuses where rollback is nonsensical / backend rejects */}
                {(() => {
                  const isBlocked = ROLLBACK_BLOCKED_STATUSES.has(model.status)
                  return (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isBlocked}
                      onClick={e => {
                        e.stopPropagation()
                        onRollback(model)
                      }}
                      aria-label={
                        isBlocked
                          ? `Откат недоступен для модели v${model.version} (статус: ${STATUS_LABELS[model.status] ?? model.status})`
                          : `Откатить модель v${model.version}`
                      }
                    >
                      Откатить
                    </Button>
                  )
                })()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
