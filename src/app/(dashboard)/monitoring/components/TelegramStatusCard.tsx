/**
 * TelegramStatusCard -- Quick status card for monitoring overview tab
 * Epic 68-FE (Story 68.5)
 * Shows bot status, delivery rate, recent failures count.
 * Compact design: sits next to DataCompletenessTable.
 */

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercentage } from '@/lib/utils'
import type { DashboardTelegram, BotStatus } from '../types/monitoring'

interface TelegramStatusCardProps {
  telegram: DashboardTelegram | undefined
  isLoading: boolean
}

const BOT_STATUS_CONFIG: Record<BotStatus, { icon: string; label: string; color: string }> = {
  active: { icon: '\u{1F7E2}', label: 'Активен', color: 'text-green-600' },
  degraded: { icon: '\u26A0\uFE0F', label: 'Проблемы с доставкой', color: 'text-yellow-600' },
  offline: { icon: '\u{1F534}', label: 'Бот оффлайн', color: 'text-red-600' },
  not_configured: { icon: '\u26AA', label: 'Не настроен', color: 'text-muted-foreground' },
} as const

export function TelegramStatusCard({ telegram, isLoading }: TelegramStatusCardProps) {
  if (isLoading) return <TelegramStatusCardSkeleton />

  const status = telegram?.status ?? 'not_configured'
  const config = BOT_STATUS_CONFIG[status]
  const deliveryRate = telegram?.deliveryRate7d ?? 0
  const failures = telegram?.recentFailures ?? 0

  return (
    <Card>
      <CardContent className="space-y-3 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">Telegram</h3>
          <Badge
            variant="outline"
            className={config.color}
            aria-label={`Статус бота: ${config.label}`}
          >
            <span aria-hidden="true" className="mr-1">
              {config.icon}
            </span>
            {config.label}
          </Badge>
        </div>

        {status === 'not_configured' ? (
          <NotConfiguredCta />
        ) : (
          <StatusMetrics deliveryRate={deliveryRate} failures={failures} />
        )}
      </CardContent>
    </Card>
  )
}

/** Delivery rate + failure count metrics row */
function StatusMetrics({ deliveryRate, failures }: { deliveryRate: number; failures: number }) {
  // deliveryRate is a 0-1 ratio (request #149); gate on 0-1 scale, render via comma+NBSP formatter
  const rateColor =
    deliveryRate >= 0.95
      ? 'text-green-600'
      : deliveryRate >= 0.8
        ? 'text-yellow-600'
        : 'text-red-600'

  return (
    <div className="flex items-end gap-6">
      <div>
        <p className="text-xs text-muted-foreground">Доставка (7 дн.)</p>
        <p
          className={`text-lg font-bold ${rateColor}`}
          aria-label={`Процент доставки за 7 дней: ${formatPercentage(deliveryRate * 100)}`}
        >
          {formatPercentage(deliveryRate * 100)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Ошибки</p>
        <p
          className={`text-lg font-bold ${failures > 0 ? 'text-red-600' : 'text-foreground'}`}
          aria-label={`Недавних ошибок: ${failures}`}
        >
          {failures}
        </p>
      </div>
    </div>
  )
}

/** CTA block for unconfigured Telegram */
function NotConfiguredCta() {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        Настройте Telegram для получения уведомлений о проблемах системы.
      </p>
      <Link
        href="/settings/notifications"
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        Настроить Telegram &rarr;
      </Link>
    </div>
  )
}

/** Skeleton loader matching card layout */
function TelegramStatusCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 pb-4 pt-5" aria-busy="true">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <div className="flex items-end gap-6">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-6 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
