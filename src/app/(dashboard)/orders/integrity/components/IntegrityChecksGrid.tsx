'use client'

/**
 * IntegrityChecksGrid — 6 check cards in a 3x2 grid
 *
 * Displays individual integrity check results with pass/warn/fail indicators.
 */

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CheckResult, CheckPassStatus } from '@/types/orders-integrity'

interface IntegrityChecksGridProps {
  checks: Record<string, CheckResult>
}

const CHECK_LABELS: Record<string, { title: string; description: string }> = {
  duplicates: {
    title: 'Дубликаты',
    description: 'Повторяющиеся записи заказов',
  },
  orphans: {
    title: 'Сироты',
    description: 'Записи без связи с источником',
  },
  missing_history: {
    title: 'Пропущенная история',
    description: 'Заказы без истории статусов',
  },
  duplicate_status_history: {
    title: 'Дубли истории',
    description: 'Повторяющиеся записи в истории',
  },
  invalid_transitions: {
    title: 'Неверные переходы',
    description: 'Недопустимые смены статусов',
  },
  sync_overlaps: {
    title: 'Пересечения синхронизации',
    description: 'Наложения периодов синхронизации',
  },
}

const STATUS_DISPLAY: Record<
  CheckPassStatus,
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  pass: { icon: CheckCircle2, color: 'text-green-600', label: 'OK' },
  warn: { icon: AlertTriangle, color: 'text-amber-600', label: 'Внимание' },
  fail: { icon: XCircle, color: 'text-red-600', label: 'Ошибка' },
}

export function IntegrityChecksGrid({ checks }: IntegrityChecksGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(CHECK_LABELS).map(([key, meta]) => {
        const check = checks[key]
        if (!check) return null
        const display = STATUS_DISPLAY[check.status]
        const Icon = display.icon

        return (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {meta.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${display.color}`} />
                  <span className="text-sm font-medium">{display.label}</span>
                </div>
                <span className="text-2xl font-bold tabular-nums">{check.count}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
