// RecoveryPanel — Recovery status table with trigger/force actions (Epic 68-FE, Story 68.6)
'use client'

import { Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRecoveryStatus, useTriggerRecovery } from '../hooks/use-recovery'
import { Confirm, Tip, Skel } from './RecoveryPanelSubcomponents'

const S: Record<string, { label: string; cls: string }> = {
  healthy: { label: '✓ OK', cls: 'border-green-500 text-green-700' },
  overdue: { label: '⚠ Просрочено', cls: 'border-yellow-500 text-yellow-700' },
  overdue_critical: { label: '✕ Критично', cls: 'border-red-500 text-red-700' },
  no_history: { label: '— Нет данных', cls: 'border-muted-foreground text-muted-foreground' },
}
const ORDER: Record<string, number> = { overdue_critical: 0, overdue: 1, no_history: 2, healthy: 3 }

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecoveryPanel({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useRecoveryStatus(enabled)
  const m = useTriggerRecovery()
  if (isLoading) return <Skel />
  const tasks = data?.tasks
    ? [...data.tasks].sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3))
    : []
  if (!tasks.length)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Нет задач для восстановления</p>
    )

  return (
    <div role="region" aria-label="Восстановление данных">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Задача</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Попыток</TableHead>
            <TableHead>Последняя попытка</TableHead>
            <TableHead className="text-right">Действие</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(t => {
            const c = S[t.status] ?? S.no_history
            const ok = t.status === 'healthy'
            const force = !t.canRetry && !ok
            return (
              <TableRow key={t.taskType} className={cn(ok && 'opacity-50')}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {t.displayName}
                    <Tip task={t} />
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('whitespace-nowrap', c.cls)}>
                    {c.label}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">
                  {t.totalAttempts}
                  {t.maxRetries != null ? `/${t.maxRetries}` : ''}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {fmtDate(t.lastAttempt)}
                </TableCell>
                <TableCell className="text-right">
                  {ok ? null : (
                    <Confirm
                      title={force ? 'Принудительное восстановление?' : 'Восстановить данные?'}
                      desc={
                        force
                          ? 'Игнорирует cooldown и может создать нагрузку на API'
                          : `Задача «${t.displayName}» будет перезапущена.`
                      }
                      act={force ? 'Принудительно' : 'Восстановить'}
                      danger={force}
                      busy={m.isPending}
                      onOk={() => m.mutate({ taskType: t.taskType, forceRetry: force })}
                    >
                      <Button
                        size="sm"
                        variant={force ? 'destructive' : 'outline'}
                        disabled={m.isPending}
                      >
                        {m.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        {force ? '⚡ Принудительно' : '▶ Восстановить'}
                      </Button>
                    </Confirm>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
