'use client'

/**
 * IntegrityStatusCard — overall health badge for orders integrity
 *
 * Displays the aggregate health status (healthy/warning/unhealthy)
 * with a colored icon and last check timestamp.
 */

import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { IntegrityCheckStatus } from '@/types/orders-integrity'

interface IntegrityStatusCardProps {
  status: IntegrityCheckStatus
  durationMs: number
  lastCheck: string
  onRefresh: () => void
  isRefetching: boolean
}

const STATUS_CONFIG: Record<
  IntegrityCheckStatus,
  {
    icon: typeof CheckCircle2
    label: string
    variant: 'default' | 'secondary' | 'destructive'
    color: string
  }
> = {
  healthy: {
    icon: CheckCircle2,
    label: 'Данные в порядке',
    variant: 'default',
    color: 'text-status-success',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Есть предупреждения',
    variant: 'secondary',
    color: 'text-status-warning',
  },
  unhealthy: {
    icon: XCircle,
    label: 'Обнаружены проблемы',
    variant: 'destructive',
    color: 'text-status-error',
  },
}

export function IntegrityStatusCard({
  status,
  durationMs,
  lastCheck,
  onRefresh,
  isRefetching,
}: IntegrityStatusCardProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  const formattedLastCheck = lastCheck
    ? new Date(lastCheck).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-4">
          <div className={`${config.color}`}>
            <Icon className="h-10 w-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Целостность данных</h2>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Последняя проверка: {formattedLastCheck}
              {durationMs > 0 && (
                <span className="ml-2 text-xs">({(durationMs / 1000).toFixed(1)} сек.)</span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRefresh()}
          disabled={isRefetching}
          aria-label="Обновить проверку"
        >
          <RefreshCw className={`mr-1 h-4 w-4${isRefetching ? ' animate-spin' : ''}`} />
          Обновить
        </Button>
      </CardContent>
    </Card>
  )
}
