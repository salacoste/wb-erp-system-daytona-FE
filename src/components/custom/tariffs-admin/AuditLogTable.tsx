'use client'

// ============================================================================
// Audit Log Table Component
// Epic 52-FE: Story 52-FE.4 - Audit Log Viewer
// Displays audit trail with filtering and pagination
// ============================================================================

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTariffAuditLog } from '@/hooks/useTariffAuditLog'
import { AuditFieldFilter, getFieldLabel } from './AuditFieldFilter'
import { AuditActionBadge } from './AuditActionBadge'
import { AuditValueDisplay } from './AuditValueDisplay'
import { formatDateTime } from '@/lib/utils'
import { TableSkeleton, EmptyState, ErrorState, PaginationControls } from './AuditLogTableParts'

const ITEMS_PER_PAGE = 50

/**
 * Audit Log Table Component
 * Displays audit trail with filtering and server-side pagination
 */
export function AuditLogTable() {
  const [page, setPage] = useState(1)
  const [fieldFilter, setFieldFilter] = useState('')

  const { data, isLoading, isError, error, refetch } = useTariffAuditLog({
    page,
    limit: ITEMS_PER_PAGE,
    field_name: fieldFilter || undefined,
  })

  const handleFilterChange = (value: string) => {
    setFieldFilter(value)
    setPage(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Журнал изменений тарифов</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <AuditFieldFilter
            value={fieldFilter}
            onChange={handleFilterChange}
            disabled={isLoading}
          />
        </div>

        {isError && <ErrorState onRetry={refetch} error={error} />}

        {!isError && !isLoading && (!data?.data || data.data.length === 0) && <EmptyState />}

        {!isError && (isLoading || (data?.data && data.data.length > 0)) && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Дата/время</TableHead>
                  <TableHead className="w-[150px]">Пользователь</TableHead>
                  <TableHead className="w-[80px]">Действие</TableHead>
                  <TableHead className="w-[150px]">Поле</TableHead>
                  <TableHead>Было</TableHead>
                  <TableHead>Стало</TableHead>
                  <TableHead className="w-[100px]">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableSkeleton />}
                {!isLoading &&
                  data?.data.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">{formatDateTime(entry.created_at)}</TableCell>
                      <TableCell className="truncate max-w-[150px]" title={entry.user_email}>
                        {entry.user_email}
                      </TableCell>
                      <TableCell>
                        <AuditActionBadge action={entry.action} />
                      </TableCell>
                      <TableCell className="text-xs" title={entry.field_name}>
                        {getFieldLabel(entry.field_name)}
                      </TableCell>
                      <TableCell>
                        <AuditValueDisplay fieldName={entry.field_name} value={entry.old_value} />
                      </TableCell>
                      <TableCell>
                        <AuditValueDisplay fieldName={entry.field_name} value={entry.new_value} />
                      </TableCell>
                      <TableCell className="text-xs font-mono">{entry.ip_address}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {data?.meta && data.meta.total > 0 && (
              <PaginationControls
                page={data.meta.page}
                totalPages={data.meta.total_pages}
                total={data.meta.total}
                limit={data.meta.limit}
                onPageChange={setPage}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
