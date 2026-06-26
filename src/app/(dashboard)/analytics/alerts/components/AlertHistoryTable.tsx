'use client'

/**
 * Alert history table with type, severity, message, date, status columns
 * Includes filter controls for alertType and status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AlertHistoryItem, AlertHistoryParams } from '@/types/alerts'
import { ALERT_TYPE_LABELS, AlertType } from '@/types/alerts'
import { formatDate } from '@/lib/utils'
import { parseMessage, StatusBadge, STATUS_OPTIONS } from './AlertHistoryHelpers'

const ALERT_TYPE_OPTIONS = Object.values(AlertType)

interface AlertHistoryTableProps {
  items: AlertHistoryItem[] | undefined
  isLoading: boolean
  historyParams?: AlertHistoryParams
  onFilterChange?: (patch: Partial<AlertHistoryParams>) => void
}

export function AlertHistoryTable({
  items,
  isLoading,
  historyParams,
  onFilterChange,
}: AlertHistoryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История уведомлений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {/* h2 — alerts page renders h1 in AlertsPageHeader; no h2 precedes this empty-state section */}
          <h2 className="text-lg font-semibold text-muted-foreground mb-2">Нет уведомлений</h2>
          <p className="text-sm text-muted-foreground">
            За выбранный период уведомлений не найдено
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>История уведомлений ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {onFilterChange && (
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="w-52">
              <Select
                value={historyParams?.alertType ?? 'all'}
                onValueChange={v => onFilterChange({ alertType: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {ALERT_TYPE_OPTIONS.map(type => (
                    <SelectItem key={type} value={type}>
                      {ALERT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select
                value={historyParams?.status ?? 'all'}
                onValueChange={v => onFilterChange({ status: v === 'all' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>
                      {s === 'sent' ? 'Отправлено' : s === 'pending' ? 'В очереди' : 'Ошибка'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип</TableHead>
              <TableHead>Канал</TableHead>
              <TableHead>Заголовок</TableHead>
              <TableHead>Сообщение</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => {
              const { title, message } = parseMessage(item.messageText)
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.eventType}</TableCell>
                  <TableCell>{item.channel}</TableCell>
                  <TableCell className="max-w-[180px] truncate font-medium">{title}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {message}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
