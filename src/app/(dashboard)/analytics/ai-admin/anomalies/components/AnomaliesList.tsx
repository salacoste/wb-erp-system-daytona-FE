'use client'

/**
 * AnomaliesList — Owner/Manager-gated anomaly resolution page content.
 * Story 112.3-FE Task 4.
 * State-precedence chain: hydration skeleton → role-denied → loading →
 *   backend-pending + manual form → list-error → empty → happy table.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAnomalies } from '@/hooks/useAnomalies'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import { formatDate } from '@/lib/utils'
import { ResolveAnomalyDialog } from './ResolveAnomalyDialog'
import { ManualResolveForm } from './ManualResolveForm'
import { STUB_PENDING_BACKEND_167 } from './anomalies-helpers'
import type { AnomalyFilter } from './anomalies-helpers'
import type { AnomalyEntry } from '@/types/ai/system'

export function AnomaliesList() {
  const user = useAuthStore(s => s.user)
  const [statusFilter, setStatusFilter] = useState<AnomalyFilter>('all')
  const [dialogTarget, setDialogTarget] = useState<AnomalyEntry | null>(null)

  const { data, isLoading, isError } = useAnomalies({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  // F-11: differentiate "auth not yet hydrated" (user===null) from "explicitly denied".
  if (user === null) {
    return (
      <div className="space-y-2" aria-label="Загрузка">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Owner OR Manager access — broader than Story 112.1/112.2 Owner-only pattern.
  if (user.role !== 'Owner' && user.role !== 'Manager') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Доступ запрещён. Эта страница доступна только владельцу или менеджеру кабинета.{' '}
          <Link href={ROUTES.ANALYTICS.MODELS} className="underline">
            Вернуться к списку моделей
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Загрузка аномалий">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Не удалось загрузить список аномалий. Попробуйте позже.</AlertDescription>
      </Alert>
    )
  }

  const anomalies = data?.anomalies ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Разрешение аномалий</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Аномалии — точки данных, которые AI пометил для ручной проверки. Укажите причину, чтобы
          помочь модели обучиться.
        </p>
      </div>

      {/* Backend-pending Alert + manual fallback form */}
      {STUB_PENDING_BACKEND_167 && <ManualResolveForm />}

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <Label htmlFor="status-filter">Статус:</Label>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as AnomalyFilter)}>
          <SelectTrigger id="status-filter" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="pending">Ожидают разрешения</SelectItem>
            <SelectItem value="resolved">Разрешено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table or empty state */}
      {anomalies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет аномалий, требующих внимания.</p>
      ) : (
        <Table>
          <TableHeader>
            {/* Sort is server-default (triggeredAt DESC). Not user-interactive in v1. */}
            <TableRow>
              <TableHead>ID аномалии</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Дата возникновения</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anomalies.map(anomaly => (
              <TableRow key={anomaly.id}>
                {/* AP#10: String() for opaque IDs — never formatNumber */}
                <TableCell className="font-mono text-xs">{String(anomaly.id)}</TableCell>
                <TableCell>{String(anomaly.nmId)}</TableCell>
                <TableCell>{anomaly.anomalyType}</TableCell>
                <TableCell>{formatDate(anomaly.triggeredAt)}</TableCell>
                <TableCell>
                  <Badge variant={anomaly.status === 'pending' ? 'destructive' : 'secondary'}>
                    {anomaly.status === 'pending' ? 'Ожидает' : 'Разрешено'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {anomaly.status === 'pending' && (
                    <Button variant="outline" size="sm" onClick={() => setDialogTarget(anomaly)}>
                      Разрешить
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination total — always shown when not in stub mode (even when total=0 after filter).
          Hidden in stub mode: stub always returns total=0 so the count is misleading. */}
      {data && !STUB_PENDING_BACKEND_167 && (
        <p className="text-xs text-muted-foreground">Всего: {data.total}</p>
      )}

      <ResolveAnomalyDialog
        anomaly={dialogTarget}
        open={dialogTarget !== null}
        onOpenChange={open => {
          if (!open) setDialogTarget(null)
        }}
      />
    </div>
  )
}
