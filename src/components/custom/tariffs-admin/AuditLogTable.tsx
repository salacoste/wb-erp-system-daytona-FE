'use client'

// ============================================================================
// Audit Log Table Component
// Epic 52-FE: Story 52-FE.4 - Audit Log Viewer
// Displays audit trail with filtering and pagination
// ============================================================================

import { useState } from 'react'
import { FileText, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { useTariffAuditLog } from '@/hooks/useTariffAuditLog'
import { AuditFieldFilter, getFieldLabel } from './AuditFieldFilter'
import { AuditActionBadge } from './AuditActionBadge'
import { AuditValueDisplay } from './AuditValueDisplay'

const ITEMS_PER_PAGE = 50

/**
 * Format datetime for audit timestamp
 * @param dateString - ISO date string from API
 * @returns Formatted date string DD.MM.YY HH:mm
 */
function formatAuditDateTime(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString().slice(-2)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Loading skeleton for table rows
 */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
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
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-gray-900">
        Журнал изменений пуст
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Здесь будут отображаться все изменения тарифов.
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
        Не удалось загрузить журнал изменений
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCcw className="h-4 w-4 mr-2" />
        Повторить
      </Button>
    </div>
  )
}

/**
 * Pagination controls component
 */
interface PaginationControlsProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

function PaginationControls({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled,
}: PaginationControlsProps) {
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-muted-foreground">
        Показано {startItem}-{endItem} из {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Назад"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <span className="text-sm text-muted-foreground">
          Страница {page} из {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Вперед"
        >
          Вперед
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Audit Log Table Component
 * Displays audit trail with filtering and server-side pagination
 */
export function AuditLogTable() {
  const [page, setPage] = useState(1)
  const [fieldFilter, setFieldFilter] = useState('')

  const { data, isLoading, isError, refetch } = useTariffAuditLog({
    page,
    limit: ITEMS_PER_PAGE,
    field_name: fieldFilter || undefined,
  })

  const handleFilterChange = (value: string) => {
    setFieldFilter(value)
    setPage(1) // Reset to first page on filter change
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Журнал изменений тарифов</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="mb-4">
          <AuditFieldFilter
            value={fieldFilter}
            onChange={handleFilterChange}
            disabled={isLoading}
          />
        </div>

        {isError && <ErrorState onRetry={refetch} />}

        {!isError && !isLoading && (!data?.data || data.data.length === 0) && (
          <EmptyState />
        )}

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
                  data?.data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">
                        {formatAuditDateTime(entry.created_at)}
                      </TableCell>
                      <TableCell
                        className="truncate max-w-[150px]"
                        title={entry.user_email}
                      >
                        {entry.user_email}
                      </TableCell>
                      <TableCell>
                        <AuditActionBadge action={entry.action} />
                      </TableCell>
                      <TableCell
                        className="text-xs"
                        title={entry.field_name}
                      >
                        {getFieldLabel(entry.field_name)}
                      </TableCell>
                      <TableCell>
                        <AuditValueDisplay
                          fieldName={entry.field_name}
                          value={entry.old_value}
                        />
                      </TableCell>
                      <TableCell>
                        <AuditValueDisplay
                          fieldName={entry.field_name}
                          value={entry.new_value}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {entry.ip_address}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {/* Pagination */}
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
