'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CogsHistoryItem } from '@/types/cogs'
import { AffectedWeeksCell } from './AffectedWeeksCell'
import { CogsEditDialog } from './CogsEditDialog'
import { CogsDeleteDialog } from './CogsDeleteDialog'

/**
 * Source icon configuration (UX Decision from Story 5.1-fe)
 * AC: 8 - Source icons with tooltips
 */
const sourceConfig: Record<string, { icon: string; label: string }> = {
  manual: { icon: '✏️', label: 'Ручной ввод' },
  import: { icon: '📥', label: 'Импорт из файла' },
  system: { icon: '⚙️', label: 'Системный пересчёт' },
}

export interface CogsHistoryTableProps {
  data: CogsHistoryItem[]
  includeDeleted: boolean
  onIncludeDeletedChange: (value: boolean) => void
  /** User role for RBAC (default: 'manager') */
  userRole?: 'analyst' | 'manager' | 'owner' | 'admin'
}

/**
 * COGS History Table Component
 * Story 5.1-fe: View COGS History
 *
 * AC: 4, 5, 7, 8, 14, 15, 16, 17, 18, 19, 20
 * Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
 */
export function CogsHistoryTable({
  data,
  includeDeleted,
  onIncludeDeletedChange,
  userRole = 'manager',
}: CogsHistoryTableProps) {
  // Dialog states for edit/delete (Stories 5.2-fe, 5.3-fe)
  const [editRecord, setEditRecord] = useState<CogsHistoryItem | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<CogsHistoryItem | null>(null)

  // AC: 14, 20 - Role-based visibility
  const canViewDeleted = userRole === 'owner' || userRole === 'admin'
  const canEdit = userRole !== 'analyst'

  /**
   * Format date to Russian locale (AC: 4)
   */
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Текущий'
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  /**
   * Format currency to Russian locale (AC: 4)
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  /**
   * Source cell with icon and tooltip (AC: 8)
   */
  const SourceCell = ({ source }: { source: 'manual' | 'import' | 'system' }) => {
    const config = sourceConfig[source] || sourceConfig.manual
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help text-lg">{config.icon}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  /**
   * Actions dropdown (AC: 17, 18, 19)
   */
  const ActionsDropdown = ({ record }: { record: CogsHistoryItem }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Открыть меню</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setEditRecord(record)}>
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteRecord(record)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-4">
      {/* AC: 14 - Show deleted checkbox (Owner/Admin only) */}
      {canViewDeleted && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-deleted"
            checked={includeDeleted}
            onCheckedChange={(checked) => onIncludeDeletedChange(checked === true)}
          />
          <Label htmlFor="show-deleted" className="text-sm text-muted-foreground">
            Показать удалённые записи
          </Label>
        </div>
      )}

      {/* AC: 4-5 - Table with columns */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Дата начала</TableHead>
              <TableHead className="w-[120px]">Дата окончания</TableHead>
              <TableHead className="w-[130px]">Себестоимость</TableHead>
              <TableHead className="w-[60px] text-center">Источник</TableHead>
              <TableHead className="w-[120px]">Затронуто недель</TableHead>
              <TableHead>Примечание</TableHead>
              {canEdit && <TableHead className="w-[60px]">Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record) => (
              <TableRow
                key={record.cogs_id}
                className={cn(
                  // AC: 15 - Deleted row styling
                  !record.is_active && 'bg-muted/50 opacity-60'
                )}
              >
                <TableCell>{formatDate(record.valid_from)}</TableCell>
                <TableCell>{formatDate(record.valid_to)}</TableCell>
                <TableCell
                  className={cn(
                    'font-medium',
                    // AC: 15 - Strikethrough for deleted
                    !record.is_active && 'line-through'
                  )}
                >
                  {formatCurrency(record.unit_cost_rub)}
                </TableCell>
                <TableCell className="text-center">
                  <SourceCell source={record.source} />
                </TableCell>
                <TableCell>
                  {/* AC: 7 - Affected weeks collapsible */}
                  <AffectedWeeksCell weeks={record.affected_weeks} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {record.notes || '—'}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    {/* AC: 16 - No actions for deleted records */}
                    {record.is_active && <ActionsDropdown record={record} />}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog (Story 5.2-fe) - AC: 18 */}
      {editRecord && (
        <CogsEditDialog
          open={!!editRecord}
          onOpenChange={(open) => !open && setEditRecord(null)}
          record={editRecord}
          onSuccess={() => setEditRecord(null)}
        />
      )}

      {/* Delete Dialog (Story 5.3-fe) - AC: 19 */}
      {deleteRecord && (
        <CogsDeleteDialog
          open={!!deleteRecord}
          onOpenChange={(open) => !open && setDeleteRecord(null)}
          record={deleteRecord}
          history={data}
          onSuccess={() => setDeleteRecord(null)}
        />
      )}
    </div>
  )
}
