/**
 * TelegramDetailPanel -- Expandable detail panel for Telegram health
 * Epic 68-FE (Story 68.5)
 * Lazy-loaded via useTelegramHealth hook when `enabled` prop is true.
 * Sections: bot info, delivery stats, event breakdown, failures, preferences.
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTelegramHealth } from '../hooks/use-telegram-health'
import type { BotStatus, TelegramDelivery } from '../types/monitoring'
import { formatDate } from '@/lib/utils'
import {
  EventBreakdownTable,
  FailuresSection,
  PreferencesSection,
  NotConfiguredBlock,
  DetailPanelSkeleton,
} from './TelegramDetailSections'

interface TelegramDetailPanelProps {
  enabled: boolean
}

const BOT_STATUS_CONFIG: Record<BotStatus, { icon: string; label: string; color: string }> = {
  active: { icon: '\u{1F7E2}', label: 'Активен', color: 'text-green-600' },
  degraded: { icon: '\u26A0\uFE0F', label: 'Проблемы с доставкой', color: 'text-yellow-600' },
  offline: { icon: '\u{1F534}', label: 'Бот оффлайн', color: 'text-red-600' },
  not_configured: { icon: '\u26AA', label: 'Не настроен', color: 'text-gray-500' },
} as const

export function TelegramDetailPanel({ enabled }: TelegramDetailPanelProps) {
  const { data, isLoading } = useTelegramHealth(enabled)

  if (isLoading) return <DetailPanelSkeleton />
  if (!data) return null

  const botStatus = data.bot.status
  if (botStatus === 'not_configured') return <NotConfiguredBlock />

  const cfg = BOT_STATUS_CONFIG[botStatus]
  const { binding, delivery, eventBreakdown, recentFailures, preferences } = data
  const enabledEvents = eventBreakdown.filter(e => e.enabled)

  return (
    <Card>
      <CardContent className="space-y-4 pb-5 pt-5">
        <BotInfoSection
          statusConfig={cfg}
          username={binding.telegramUsername}
          boundAt={binding.boundAt}
          isVerified={binding.isVerified}
        />
        <Separator />
        <DeliveryStatsSection delivery={delivery} />
        <Separator />
        <EventBreakdownTable events={enabledEvents} />
        {recentFailures.length > 0 && (
          <>
            <Separator />
            <FailuresSection failures={recentFailures.slice(0, 10)} />
          </>
        )}
        <Separator />
        <PreferencesSection preferences={preferences} />
      </CardContent>
    </Card>
  )
}

/** Bot status badge + binding info */
function BotInfoSection({
  statusConfig,
  username,
  boundAt,
  isVerified,
}: {
  statusConfig: { icon: string; label: string; color: string }
  username: string | null
  boundAt: string | null
  isVerified: boolean
}) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">Telegram-бот</h4>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="outline" className={statusConfig.color}>
          <span aria-hidden="true" className="mr-1">
            {statusConfig.icon}
          </span>
          {statusConfig.label}
        </Badge>
        {username && <span className="text-muted-foreground">@{username}</span>}
        {boundAt && <span className="text-muted-foreground">с {formatDate(boundAt)}</span>}
        {isVerified ? (
          <Badge variant="secondary" className="text-green-700">
            Подтверждён
          </Badge>
        ) : (
          <Badge variant="outline" className="text-yellow-600">
            Не подтверждён
          </Badge>
        )}
      </div>
    </div>
  )
}

/** Delivery rate, totals, avg latency */
function DeliveryStatsSection({ delivery }: { delivery: TelegramDelivery }) {
  const stats = [
    { label: 'Отправлено', value: delivery.totalSent },
    { label: 'Ошибки', value: delivery.totalFailed, warn: delivery.totalFailed > 0 },
    { label: 'Rate-limited', value: delivery.totalRateLimited },
    { label: 'Тихие часы', value: delivery.totalSkippedQuietHours },
    { label: 'Доставка', value: `${delivery.deliveryRate.toFixed(1)}%` },
    { label: 'Ср. время, мс', value: delivery.avgDeliveryMs?.toFixed(0) ?? '—' },
  ]

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">Статистика доставки</h4>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
        {stats.map(s => (
          <div key={s.label}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-sm font-semibold ${s.warn ? 'text-red-600' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
