'use client'

/**
 * Alert history table with type, severity, message, date, status columns
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AlertHistoryItem } from '@/types/alerts'
import { formatDate } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  sent: 'Отправлено',
  pending: 'В очереди',
  failed: 'Ошибка',
}

interface AlertHistoryTableProps {
  items: AlertHistoryItem[] | undefined
  isLoading: boolean
}

export function AlertHistoryTable({ items, isLoading }: AlertHistoryTableProps) {
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
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Нет уведомлений</h3>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип</TableHead>
              <TableHead>Канал</TableHead>
              <TableHead>Сообщение</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.eventType}</TableCell>
                <TableCell>{item.channel}</TableCell>
                <TableCell className="max-w-xs truncate">{item.messageText}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-800'
  const label = statusLabels[status] ?? status
  return (
    <Badge className={style} variant="outline">
      {label}
    </Badge>
  )
}
