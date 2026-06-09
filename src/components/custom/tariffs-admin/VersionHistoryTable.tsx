'use client'

// ============================================================================
// Version History Table Component
// Epic 52-FE: Story 52-FE.1 - Version History Table
// Displays all tariff versions with status, dates, and delete action
// Sub-components: VersionHistoryTableStates (skeleton, empty, error)
// ============================================================================

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatDate } from '@/lib/utils'
import { useTariffVersionHistory } from '@/hooks/useTariffVersionHistory'
import { VersionStatusBadge } from './VersionStatusBadge'
import { DeleteVersionDialog } from './DeleteVersionDialog'
import { formatSource, TableSkeleton, EmptyState, ErrorState } from './VersionHistoryTableStates'
import type { TariffVersion } from '@/types/tariffs-admin'

/**
 * Version History Table Component
 * Displays all tariff versions with their status and allows deletion of scheduled versions
 */
export function VersionHistoryTable() {
  const { data, isLoading, isError, error, refetch } = useTariffVersionHistory()
  const [versionToDelete, setVersionToDelete] = useState<TariffVersion | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>История версий тарифов</CardTitle>
      </CardHeader>
      <CardContent>
        {isError && <ErrorState onRetry={refetch} error={error} />}

        {!isError && !isLoading && (!data || data.length === 0) && <EmptyState />}

        {!isError && (isLoading || (data && data.length > 0)) && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Дата начала</TableHead>
                <TableHead className="w-[120px]">Дата окончания</TableHead>
                <TableHead className="w-[100px]">Статус</TableHead>
                <TableHead className="w-[80px]">Источник</TableHead>
                <TableHead>Заметки</TableHead>
                <TableHead className="w-[150px]">Создано</TableHead>
                <TableHead className="w-[150px]">Автор</TableHead>
                <TableHead className="w-[80px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableSkeleton />}
              {!isLoading &&
                data?.map(version => (
                  <TableRow key={version.id}>
                    <TableCell>{formatDate(version.effective_from)}</TableCell>
                    <TableCell>
                      {version.effective_until ? formatDate(version.effective_until) : '—'}
                    </TableCell>
                    <TableCell>
                      <VersionStatusBadge status={version.status} />
                    </TableCell>
                    <TableCell>{formatSource(version.source)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{version.notes || '—'}</TableCell>
                    <TableCell>{formatDateTime(version.created_at)}</TableCell>
                    <TableCell className="truncate">{version.updated_by}</TableCell>
                    <TableCell>
                      {version.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVersionToDelete(version)}
                          title="Удалить версию"
                          aria-label="Удалить"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        <DeleteVersionDialog
          open={!!versionToDelete}
          version={versionToDelete}
          onClose={() => setVersionToDelete(null)}
        />
      </CardContent>
    </Card>
  )
}
