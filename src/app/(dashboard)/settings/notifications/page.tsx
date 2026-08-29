'use client'

// ============================================================================
// Telegram Notifications Settings Page
// Epic 34-FE: Story 34.5-FE
// Integration of all notification components with layout and empty states
// Analytics: Page view tracking and help link clicks
// ============================================================================

import { useTelegramBinding } from '@/hooks/useTelegramBinding'
import {
  TelegramBindingCard,
  TelegramBindingModal,
  NotificationPreferencesPanel,
  QuietHoursPanel,
} from '@/components/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContextBar, PageHeader } from '@/components/product'
import { PageState } from '@/components/product/states'
import { HelpCircle } from 'lucide-react'
import { TelegramMetrics } from '@/lib/analytics/telegram-metrics'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { NotificationsHeroBanner } from './NotificationsHeroBanner'
import { NotificationsDisabledPanel } from './NotificationsDisabledPanel'
import { OrderNotificationSettings } from '@/components/custom/settings/OrderNotificationSettings'

/**
 * Telegram Notifications Settings Page
 *
 * Layout (Q16): Vertical stack with max-width 1024px
 * Empty State (Q19): Hero banner when not bound
 * Mobile (Q18): Full-width cards, reduced padding
 */
export default function NotificationsSettingsPage() {
  const { status, isBound, isCheckingStatus, checkStatus } = useTelegramBinding()
  const [isBindingModalOpen, setIsBindingModalOpen] = useState(false)
  const connectButtonRef = useRef<HTMLButtonElement>(null)
  const pageRef = useRef<HTMLElement>(null)

  const isTelegramUnavailable = !isCheckingStatus && status == null

  // Track page view on mount (Epic 34-FE Analytics)
  useEffect(() => {
    TelegramMetrics.pageViewed()
  }, [])

  // Track help link clicks
  const handleHelpClick = () => {
    TelegramMetrics.helpClicked()
  }

  const returnBindingFocus = () => {
    const target = connectButtonRef.current?.isConnected
      ? connectButtonRef.current
      : pageRef.current
    target?.focus()
  }

  return (
    <section
      ref={pageRef}
      tabIndex={-1}
      aria-label="Настройки Telegram-уведомлений"
      className="space-y-6 py-2 outline-none"
    >
      <PageHeader
        title="Telegram Уведомления"
        description="Каналы, события и расписание уведомлений для текущего кабинета"
        breadcrumbs={[
          { label: 'Главная', href: '/dashboard' },
          { label: 'Настройки', href: '/settings' },
          { label: 'Уведомления' },
        ]}
        busy={isCheckingStatus}
      />

      <ContextBar
        scope="Telegram и FBS-уведомления"
        items={
          status
            ? [
                {
                  id: 'telegram-connection',
                  label: 'Telegram',
                  value: status.bound ? 'Подключен' : 'Не подключен',
                },
              ]
            : []
        }
        state={isTelegramUnavailable ? 'unavailable' : isCheckingStatus ? 'refreshing' : 'fresh'}
        stateLabel={
          isTelegramUnavailable
            ? 'Статус Telegram недоступен'
            : isCheckingStatus
              ? 'Проверяем подключение Telegram'
              : undefined
        }
        onRefresh={isTelegramUnavailable ? () => void checkStatus() : undefined}
        refreshLabel="Повторить проверку Telegram"
      />

      {isCheckingStatus ? (
        <PageState
          state="loading"
          title="Проверяем подключение Telegram"
          explanation="Получаем актуальный статус канала уведомлений."
          trust="Настройки появятся после подтверждённого ответа сервера."
        />
      ) : isTelegramUnavailable ? (
        <PageState
          state="error"
          title="Статус Telegram недоступен"
          explanation="Сервер пока не подтвердил, подключён ли Telegram."
          trust="Не показываем неизвестный статус как отключённый канал."
          recovery={<Button onClick={() => void checkStatus()}>Повторить проверку</Button>}
        />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Empty State Hero Banner (Q19) - Only shown when NOT bound */}
          {!isBound && (
            <NotificationsHeroBanner
              connectButtonRef={connectButtonRef}
              onConnect={() => setIsBindingModalOpen(true)}
            />
          )}

          {/* Card 1: Telegram Binding Status - Only shown when bound */}
          {isBound && <TelegramBindingCard onUnbindReturnFocus={() => pageRef.current?.focus()} />}

          {/* Card 2: Notification Preferences */}
          {isBound ? (
            <NotificationPreferencesPanel />
          ) : (
            <NotificationsDisabledPanel
              icon="⚙️"
              title="Настройки уведомлений"
              description="Здесь вы сможете настроить типы уведомлений, язык сообщений и время ежедневной сводки"
              lockMessage="Настройки уведомлений станут доступны после подключения"
            />
          )}

          {/* Card 3: Quiet Hours Configuration */}
          {isBound ? (
            <QuietHoursPanel />
          ) : (
            <NotificationsDisabledPanel
              icon="🌙"
              title="Тихие часы"
              description="Здесь вы сможете настроить время, когда уведомления не будут приходить"
              lockMessage="Тихие часы станут доступны после подключения"
            />
          )}

          {/* Help Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <HelpCircle
                  aria-hidden="true"
                  className="mt-0.5 size-6 shrink-0 text-status-information"
                />
                <div className="min-w-0">
                  <h2 className="mb-2 font-semibold text-foreground">Нужна помощь с настройкой?</h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Если у вас возникли вопросы по настройке Telegram уведомлений, обратитесь к
                    нашему руководству или свяжитесь с поддержкой.
                  </p>
                  <Link
                    href="/help/notifications"
                    onClick={handleHelpClick}
                    className="rounded-sm text-sm font-medium text-telegram underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Открыть руководство →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FBS settings stay independent from Telegram availability. */}
      <OrderNotificationSettings />

      {/* Telegram Binding Modal */}
      <TelegramBindingModal
        open={isBindingModalOpen}
        onOpenChange={setIsBindingModalOpen}
        onSuccess={() => setIsBindingModalOpen(false)}
        onReturnFocus={returnBindingFocus}
      />
    </section>
  )
}
