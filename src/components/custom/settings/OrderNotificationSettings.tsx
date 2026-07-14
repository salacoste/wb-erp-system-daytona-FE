'use client'

// ============================================================================
// FBS Order Notification Settings Component
// Epic 132-FE: Story 132.3
// Renders toggle switches, time inputs, and SLA minute inputs
// ============================================================================

import { useOrderNotificationSettings } from '@/hooks/useOrderNotificationSettings'
import type { UpdateOrderNotificationSettingsDto } from '@/types/notifications'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Package, Clock, Moon } from 'lucide-react'
import { ToggleRow, HourInput, SlaInput } from './OrderNotifInputs'

export function OrderNotificationSettings() {
  const { settings, isLoading, error, updateSettings, isUpdating } = useOrderNotificationSettings()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error || !settings) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить настройки уведомлений о заказах</AlertDescription>
      </Alert>
    )
  }

  // BD-FE-001: strip `cabinetId` — the BE GET response includes it but the PUT DTO
  // rejects it ("property cabinetId should not exist"). Spread only writable fields.
  const patch = (partial: Partial<UpdateOrderNotificationSettingsDto>) => {
    const { cabinetId, ...rest } = settings
    void cabinetId
    return updateSettings({ ...rest, ...partial } as UpdateOrderNotificationSettingsDto)
  }

  return (
    <div className="space-y-4">
      {/* Notifications toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Уведомления о заказах FBS
          </CardTitle>
          <CardDescription>
            Настройте уведомления для заказов, выполняемых по схеме FBS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <ToggleRow
            id="newOrderEnabled"
            label="Новый заказ"
            description="Уведомление при поступлении нового FBS-заказа"
            checked={settings.newOrderEnabled}
            onCheckedChange={v => patch({ newOrderEnabled: v })}
            disabled={isUpdating}
          />
          <ToggleRow
            id="slaWarningEnabled"
            label="Предупреждение SLA"
            description="Уведомление при приближении дедлайна подтверждения/сборки"
            checked={settings.slaWarningEnabled}
            onCheckedChange={v => patch({ slaWarningEnabled: v })}
            disabled={isUpdating}
          />
          <ToggleRow
            id="dailySummaryEnabled"
            label="Ежедневная сводка"
            description="Сводка по заказам за день в указанное время"
            checked={settings.dailySummaryEnabled}
            onCheckedChange={v => patch({ dailySummaryEnabled: v })}
            disabled={isUpdating}
          />
        </CardContent>
      </Card>

      {/* Time settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Время уведомлений
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <HourInput
            label="Час ежедневной сводки"
            value={settings.dailySummaryHour}
            onChange={v => patch({ dailySummaryHour: v })}
            disabled={isUpdating || !settings.dailySummaryEnabled}
          />
          <div className="pt-3 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Тихие часы</span>
            </div>
            <HourInput
              label="Начало"
              value={settings.quietHoursStart}
              onChange={v => patch({ quietHoursStart: v })}
              disabled={isUpdating}
            />
            <HourInput
              label="Конец"
              value={settings.quietHoursEnd}
              onChange={v => patch({ quietHoursEnd: v })}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* SLA thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5" />
            Пороги предупреждений SLA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SlaInput
            label="Подтверждение заказа"
            value={settings.confirmationSlaWarningMinutes}
            onChange={v => patch({ confirmationSlaWarningMinutes: v })}
            disabled={isUpdating || !settings.slaWarningEnabled}
          />
          <SlaInput
            label="Сборка и отгрузка"
            value={settings.completionSlaWarningMinutes}
            onChange={v => patch({ completionSlaWarningMinutes: v })}
            disabled={isUpdating || !settings.slaWarningEnabled}
          />
        </CardContent>
      </Card>
    </div>
  )
}
