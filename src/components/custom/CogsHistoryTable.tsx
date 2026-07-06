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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { canManageOperationalData } from '@/lib/role-permissions'
import type { CogsHistoryItem } from '@/types/cogs'
import type { User } from '@/types/auth'
import { AffectedWeeksCell } from './AffectedWeeksCell'
import { CogsEditDialog } from './CogsEditDialog'
import { CogsDeleteDialog } from './CogsDeleteDialog'
import { formatDate, formatCurrency, SourceCell, ActionsDropdown } from './CogsHistoryTableCells'

export interface CogsHistoryTableProps {
  data: CogsHistoryItem[]
  includeDeleted: boolean
  onIncludeDeletedChange: (value: boolean) => void
  /** BD-14: canonical (Capitalized) auth role — required so the page can't forget it. */
  userRole: User['role']
}

/**
 * COGS History Table Component
 * Story 5.1-fe: View COGS History
 */
export function CogsHistoryTable({
  data,
  includeDeleted,
  onIncludeDeletedChange,
  userRole,
}: CogsHistoryTableProps) {
  const [editRecord, setEditRecord] = useState<CogsHistoryItem | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<CogsHistoryItem | null>(null)

  // BD-14: canonical roles are Capitalized (authStoreHelpers.normalizeUser maps
  // owner→Owner, etc.). Viewing soft-deleted COGS is Owner + Service only (not Manager).
  const canViewDeleted = userRole === 'Owner' || userRole === 'Service'
  const canEdit = canManageOperationalData(userRole)

  return (
    <div className="space-y-4">
      {canViewDeleted && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="show-deleted"
            checked={includeDeleted}
            onCheckedChange={checked => onIncludeDeletedChange(checked === true)}
          />
          <Label htmlFor="show-deleted" className="text-sm text-muted-foreground">
            Показать удалённые записи
          </Label>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
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
            {data.map(record => (
              <TableRow
                key={record.cogs_id}
                className={cn(!record.is_active && 'bg-muted/50 opacity-60')}
              >
                <TableCell>{formatDate(record.valid_from)}</TableCell>
                <TableCell>{formatDate(record.valid_to)}</TableCell>
                <TableCell className={cn('font-medium', !record.is_active && 'line-through')}>
                  {formatCurrency(record.unit_cost_rub)}
                </TableCell>
                <TableCell className="text-center">
                  <SourceCell source={record.source} />
                </TableCell>
                <TableCell>
                  <AffectedWeeksCell weeks={record.affected_weeks} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {record.notes || '—'}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    {record.is_active && (
                      <ActionsDropdown
                        record={record}
                        onEdit={setEditRecord}
                        onDelete={setDeleteRecord}
                      />
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editRecord && (
        <CogsEditDialog
          open={!!editRecord}
          onOpenChange={open => !open && setEditRecord(null)}
          record={editRecord}
          onSuccess={() => setEditRecord(null)}
        />
      )}

      {deleteRecord && (
        <CogsDeleteDialog
          open={!!deleteRecord}
          onOpenChange={open => !open && setDeleteRecord(null)}
          record={deleteRecord}
          history={data}
          onSuccess={() => setDeleteRecord(null)}
        />
      )}
    </div>
  )
}
