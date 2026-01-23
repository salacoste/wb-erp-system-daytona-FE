'use client'

// ============================================================================
// Version History Table Component
// Epic 52-FE: Story 52-FE.1 - Version History Table
// Displays all tariff versions with status, dates, and delete action
// ============================================================================

import { useState } from 'react'
import { Trash2, ClipboardList, RefreshCcw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTariffVersionHistory } from '@/hooks/useTariffVersionHistory'
import { VersionStatusBadge } from './VersionStatusBadge'
import { DeleteVersionDialog } from './DeleteVersionDialog'
import { formatDate } from '@/lib/utils'
import type { TariffVersion } from '@/types/tariffs-admin'

/**
 * Format datetime for created_at column
 * @param dateString - ISO date string from API
 * @returns Formatted date string DD.MM.YYYY HH:mm
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Format source for display
 * @param source - 'manual' or 'api' from API
 * @returns Display text
 */
function formatSource(source: 'manual' | 'api'): string {
  return source === 'api' ? 'API' : 'manual'
}

/**
 * Loading skeleton for table rows
 */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" data-testid="skeleton" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-gray-900">
        История версий пуста
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Создайте первую версию тарифов или запланируйте изменения.
      </p>
    </div>
  )
}

/**
 * Error state component
 */
interface ErrorStateProps {
  onRetry: () => void
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-red-500 mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900">Ошибка загрузки</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Не удалось загрузить историю версий
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4 mr-2" />
        Повторить
      </Button>
    </div>
  )
}

/**
 * Version History Table Component
 * Displays all tariff versions with their status and allows deletion of scheduled versions
 */
export function VersionHistoryTable() {
  const { data, isLoading, isError, refetch } = useTariffVersionHistory()
  const [versionToDelete, setVersionToDelete] = useState<TariffVersion | null>(
    null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>История версий тарифов</CardTitle>
      </CardHeader>
      <CardContent>
        {isError && <ErrorState onRetry={refetch} />}

        {!isError && !isLoading && (!data || data.length === 0) && (
          <EmptyState />
        )}

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
                data?.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>{formatDate(version.effective_from)}</TableCell>
                    <TableCell>
                      {version.effective_until
                        ? formatDate(version.effective_until)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <VersionStatusBadge status={version.status} />
                    </TableCell>
                    <TableCell>{formatSource(version.source)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {version.notes || '—'}
                    </TableCell>
                    <TableCell>{formatDateTime(version.created_at)}</TableCell>
                    <TableCell className="truncate">
                      {version.updated_by}
                    </TableCell>
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
