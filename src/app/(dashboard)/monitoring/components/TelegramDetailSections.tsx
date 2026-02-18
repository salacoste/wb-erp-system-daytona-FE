/**
 * TelegramDetailSections -- Sub-components for TelegramDetailPanel
 * Epic 68-FE (Story 68.5)
 * Extracted to keep TelegramDetailPanel under 200 lines.
 */

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  TelegramEventBreakdown,
  TelegramFailure,
  TelegramPreferences,
} from '../types/monitoring'

/** Event breakdown table -- enabled events only */
export function EventBreakdownTable({ events }: { events: TelegramEventBreakdown[] }) {
  if (events.length === 0) {
    return (
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">События</h4>
        <p className="text-xs text-muted-foreground">Нет включённых типов событий</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">События (включённые)</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Тип события</TableHead>
            <TableHead className="text-right">Отправлено</TableHead>
            <TableHead className="text-right">Ошибки</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map(e => (
            <TableRow key={e.eventType}>
              <TableCell className="text-sm">{e.eventType}</TableCell>
              <TableCell className="text-right text-sm">{e.sentCount}</TableCell>
              <TableCell
                className={`text-right text-sm ${e.failedCount > 0 ? 'text-red-600 font-medium' : ''}`}
              >
                {e.failedCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** Format ISO timestamp as DD.MM.YYYY HH:MM */
function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()} ${hh}:${min}`
}

/** Recent failures list (max 10) */
export function FailuresSection({ failures }: { failures: TelegramFailure[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-red-600">Недавние ошибки</h4>
      <ul className="space-y-1.5" aria-label="Список недавних ошибок доставки">
        {failures.map((f, i) => (
          <li key={`${f.timestamp}-${i}`} className="text-xs">
            <span className="text-muted-foreground">{formatTimestamp(f.timestamp)}</span>{' '}
            <Badge variant="outline" className="text-xs">
              {f.eventType}
            </Badge>{' '}
            <span className="text-red-600">{f.errorMessage}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Preferences summary: quiet hours, language, enabled count */
export function PreferencesSection({ preferences }: { preferences: TelegramPreferences }) {
  const quietHours =
    preferences.quietHoursEnabled && preferences.quietHoursFrom && preferences.quietHoursTo
      ? `${preferences.quietHoursFrom} — ${preferences.quietHoursTo}`
      : 'Выкл.'

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">Настройки</h4>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          Тихие часы: <strong className="text-foreground">{quietHours}</strong>
        </span>
        <span>
          Язык: <strong className="text-foreground">{preferences.language.toUpperCase()}</strong>
        </span>
        <span>
          Событий вкл.:{' '}
          <strong className="text-foreground">{preferences.enabledEvents.length}</strong>
        </span>
      </div>
    </div>
  )
}

/** Full CTA block for not_configured state */
export function NotConfiguredBlock() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="text-3xl" aria-hidden="true">
          {'\u26AA'}
        </span>
        <h4 className="text-sm font-semibold">Telegram не настроен</h4>
        <p className="max-w-sm text-xs text-muted-foreground">
          Подключите Telegram-бота для получения уведомлений о сбоях конвейеров, проблемах с данными
          и других важных событиях системы.
        </p>
        <Link
          href="/settings/notifications"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Настроить Telegram
        </Link>
      </CardContent>
    </Card>
  )
}

/** Skeleton for loading state */
export function DetailPanelSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 pb-5 pt-5" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-10" />
            </div>
          ))}
        </div>
        <Separator />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  )
}
