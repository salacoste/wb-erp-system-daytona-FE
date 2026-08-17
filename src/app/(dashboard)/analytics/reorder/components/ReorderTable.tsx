/**
 * Reorder recommendations table with status badges and action buttons.
 */

'use client'

import { ShoppingCart, PackageCheck } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReorderRecommendation } from '@/types/reorder-recommendations'

interface ReorderTableProps {
  data: ReorderRecommendation[]
  isLoading: boolean
  onMarkOrdered: (id: string) => void
  onMarkReceived: (id: string) => void
  isUpdating: boolean
}

const STATUS_BADGE_MAP: Record<
  ReorderRecommendation['status'],
  { label: string; className: string }
> = {
  // 168.8: semantic status chips — /15 bg + full text (alerts chip idiom); expired stays muted
  pending: { label: 'Ожидает', className: 'bg-status-warning/15 text-status-warning' },
  ordered: { label: 'Заказано', className: 'bg-status-information/15 text-status-information' },
  received: { label: 'Получено', className: 'bg-status-success/15 text-status-success' },
  expired: { label: 'Просрочено', className: 'bg-muted text-muted-foreground' },
}

function StatusBadge({ status }: { status: ReorderRecommendation['status'] }) {
  const cfg = STATUS_BADGE_MAP[status]
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 8 }).map((_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-16" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

export function ReorderTable({
  data,
  isLoading,
  onMarkOrdered,
  onMarkReceived,
  isUpdating,
}: ReorderTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Артикул</TableHead>
          <TableHead className="text-right">Кол-во</TableHead>
          <TableHead className="text-right">Остаток</TableHead>
          <TableHead>Источник</TableHead>
          <TableHead>Заказать до</TableHead>
          <TableHead>Обнуление</TableHead>
          <TableHead className="text-right">Сумма</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <LoadingRows />
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
              Нет рекомендаций по пополнению
            </TableCell>
          </TableRow>
        ) : (
          data.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{String(item.nmId)}</TableCell>
              <TableCell className="text-right">{item.recommendedQty}</TableCell>
              <TableCell className="text-right">{item.currentStock}</TableCell>
              <TableCell>{item.demandSource === 'ml' ? 'ML' : 'Скорость'}</TableCell>
              <TableCell>{item.orderByDate ? formatDate(item.orderByDate) : '—'}</TableCell>
              <TableCell>{item.stockoutDate ? formatDate(item.stockoutDate) : '—'}</TableCell>
              <TableCell className="text-right">
                {item.totalReorderValue != null ? formatCurrency(item.totalReorderValue) : '—'}
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {item.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onMarkOrdered(item.id)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Заказано
                    </Button>
                  )}
                  {item.status === 'ordered' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onMarkReceived(item.id)}
                    >
                      <PackageCheck className="h-3 w-3 mr-1" />
                      Получено
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
